import React, { ReactElement, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Row, Col, Card, Button, Badge, Form, Modal, Spinner} from "react-bootstrap";
import Layout from "@layout/index";
import ProtectedRoute from "@components/ProtectedRoute";
import { X } from "lucide-react";
import { HistoryListRecord, getHistoryChain, HistoryChainRecord, getStages, StageData, getCrmDataById, CrmDataItem } from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import axiosInstance from "@utils/axios";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  Users,
  Target,
  Handshake,
  ShoppingBag,
  Activity,
  Download,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Eye,
  Filter,
  Clock,
  Calendar,
  PlusCircle,
  TrendingUp,
  Layers,
} from "lucide-react";
import "@assets/scss/ticketsnew.scss";
import { GlobalDateFormat, GlobalTimeFormat, ModuleSlug } from "@utils/Helper";
import moment from "moment";
import GenericTable, { TableColumn } from "@components/GenericTable";
import GenericSidebar from "@components/GenericSidebar";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";

// Types
interface ActivityRecord {
  id: number;
  record_id?: string; // Original record_id from API for history chain calls
  customer: string;
  type: string;
  agent: string;
  lastActivity: string;
  stage: string;
  tags: string[];
  dateTime: string;
}

const HistoryPage = () => {
  const router = useRouter();
  // New Activity Tracker States
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [activityFilters, setActivityFilters] = useState({
    agents: [] as string[], // Store extension IDs
    dateRange: { start: '', end: '' }
  });
  const [showActivitySidebar, setShowActivitySidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [showActivityTimelineModal, setShowActivityTimelineModal] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [selectedActivityRecord, setSelectedActivityRecord] = useState<any>(null);
  const [activitySearch, setActivitySearch] = useState('');
  const [allActivityRecords, setAllActivityRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });
  const [historyChain, setHistoryChain] = useState<HistoryChainRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [recordStages, setRecordStages] = useState<StageData[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [crmData, setCrmData] = useState<CrmDataItem | null>(null);
  const [loadingCrmData, setLoadingCrmData] = useState(false);

  // Fetch extensions on component mount
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_HISTORY);
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
      } catch (error) {
        console.error("Failed to fetch extensions:", error);
      }
    };
    fetchExtensions();
  }, []);

  // Fetch history data from API
  const fetchHistoryData = useCallback(async (page: number = 1, perPage?: number) => {
    try {
      setLoading(true);
      const currentPerPage = perPage ?? pagination.per_page;
      const params: any = {
        page,
        per_page: currentPerPage,
      };

      // Add search if available
      if (activitySearch) {
        params.search = activitySearch;
      }

      // Add user_extension filter if available
      if (activityFilters.agents.length > 0) {
        params.user_extension = activityFilters.agents;
      }

      // Add date range filters if available
      if (activityFilters.dateRange.start) {
        params.from = activityFilters.dateRange.start;
      }
      if (activityFilters.dateRange.end) {
        params.to = activityFilters.dateRange.end;
      }

      // Add type filter if not 'all'
      if (activityTypeFilter !== 'all') {
        // Map filter values to API parameter values
        const typeMap: Record<string, string> = {
          'leads': 'lead',
          'deals': 'deal',
          'orders': 'order',
          'prospects': 'prospect'
        };
        const apiType = typeMap[activityTypeFilter];
        if (apiType) {
          params.type = apiType;
        }
      }

      // Make direct API call to get full response with pagination
      // Since getHistoryList only returns data array, we need the raw response
      const rawResponse = await axiosInstance.get("/crm/history/list", { params });
      
      // Extract data and pagination from the response structure
      // Response structure: { code: 200, data: { success: true, data: [...], pagination: {...} } }
      const responseData = rawResponse?.data?.data;
      const records = responseData?.data || [];
      const paginationInfo = responseData?.pagination || {};
      
      // Map API response to ActivityRecord format
    
      const mappedRecords: ActivityRecord[] =   records.map((record: HistoryListRecord, index: number) => {
        // Capitalize first letter of record_type
        const typeCapitalized = record.record_type.charAt(0).toUpperCase() + record.record_type.slice(1);
        
        // Format date for display
        const dateObj = new Date(record.updated_at);
        const dateStr = dateObj.toISOString().split('T')[0];
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const formattedDate = `${dateStr} ${timeStr}`;

        // Get agent name from extensions
        const agentExtension = record.assigned_to || record.action_by;
        let agentName = 'N/A';
        if (agentExtension) {
          const extension = extensions.find((ext: any) => ext?.id == agentExtension || ext?.extension == agentExtension);
          const fullName = extension?.display_name || extension?.name || agentExtension;
          // Remove extension in parentheses (e.g., "Rizwan Haider (511)" -> "Rizwan Haider")
          agentName = fullName.replace(/\s*\([^)]*\)\s*$/, '').trim() || fullName;
        }

        return {
          id: Number.parseInt(record.record_id) || index + 1,
          record_id: record.record_id, // Store original record_id for API calls
          customer: record.record_name,
          type: typeCapitalized,
          agent: agentName,
          lastActivity: formattedDate,
          dateTime: record.updated_at,
          stage: record.stage_name || 'N/A',
          tags: [] // Tags not available in API response
        };
      });
      console.log("ZE MAPPED RECORDS", mappedRecords)
      setAllActivityRecords(mappedRecords || []);
      setPagination({
        current_page: paginationInfo.current_page || page,
        last_page: paginationInfo.last_page || 1,
        per_page: paginationInfo.per_page || currentPerPage,
        total: paginationInfo.total || 0
      });
    } catch (error) {
      console.error("Failed to fetch history data:", error);
      setAllActivityRecords([]);
    } finally {
      if(extensions?.length === 0)
      {
        return;
      }
      setLoading(false);
    }
  }, [activitySearch, activityFilters.dateRange, activityFilters.agents, pagination.per_page, extensions, activityTypeFilter]);

  // Fetch data on component mount
  useEffect(() => {
    fetchHistoryData(1);
  }, []);

  // Refetch when filters change (reset to page 1)
  useEffect(() => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchHistoryData(1);
  }, [activityFilters.agents, activityFilters.dateRange.start, activityFilters.dateRange.end, extensions, activityTypeFilter]);
  
  // Valid filter IDs for history
  const validHistoryFilters = ['all', 'leads', 'deals', 'orders'];
  
  // Read tab from URL on mount and when router is ready
  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const tabFromUrl = String(router.query.tab);
      if (validHistoryFilters.includes(tabFromUrl) && tabFromUrl !== activityTypeFilter) {
        setActivityTypeFilter(tabFromUrl);
      }
    }
  }, [router.isReady, router.query.tab, activityTypeFilter]);
  
  // Handler to update filter and URL
  const handleFilterChange = useCallback((filterId: string) => {
    setActivityTypeFilter(filterId);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    
    // Update URL with tab query parameter
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: filterId }
      },
      undefined,
      { shallow: true }
    );
  }, [router]);

  // Get agent options from hierarchy data (extensions)
  const availableAgents = extensions.map((ext: any) => ({
    value: ext.id || ext.extension,
    label: (ext.display_name || ext.name || ext.id || ext.extension).replace(/\s*\([^)]*\)\s*$/, '').trim()
  }));

  // Filter activities based on search (type filter is now handled by API)
  const filteredActivityRecords = allActivityRecords
    .filter(activity => {
      // Search filter (client-side for instant feedback)
      if (!activitySearch) return true;
      const searchLower = activitySearch.toLowerCase();
      return activity.customer.toLowerCase().includes(searchLower) ||
             activity.agent.toLowerCase().includes(searchLower);
    })

  // Quick filter counts
  const typeFilterCounts = {
    all: allActivityRecords.length,
    prospects: allActivityRecords.filter(a => a.type === 'Prospect').length,
    leads: allActivityRecords.filter(a => a.type === 'Lead').length,
    deals: allActivityRecords.filter(a => a.type === 'Deal').length,
    orders: allActivityRecords.filter(a => a.type === 'Order').length,
  };

  // Fetch history chain and stages when modal or sidebar opens
  useEffect(() => {
    if ((showActivitySidebar || showActivityTimelineModal) && selectedActivityRecord) {
      const fetchHistoryAndStages = async () => {
        setLoadingHistory(true);
        try {
          // Determine entity type and ID
          const recordType = selectedActivityRecord.type.toLowerCase();
          const recordId = selectedActivityRecord.record_id || selectedActivityRecord.id;
          
          // Map record type to API type
          const apiType = recordType === 'prospect' ? 'prospect' : 
                         recordType === 'lead' ? 'lead' :
                         recordType === 'deal' ? 'deal' :
                         recordType === 'order' ? 'order' : 'lead';
          
          // Fetch history chain
          const chainData = await getHistoryChain(apiType as "prospect" | "lead" | "deal" | "order", recordId);
          setHistoryChain(chainData || []);
          
          // Check for CRM Data record in history chain
          const crmDataRecord = chainData?.find((record: HistoryChainRecord) => {
            const entityType = String(record.entity_type);
            return entityType === "CRM Data";
          });
          if (crmDataRecord) {
            // Extract ID from format "crm_data_453" -> 453
            // Check both id and entity_id fields
            const idString = String(crmDataRecord.id || crmDataRecord.entity_id || '');
            const idMatch = /crm_data_(\d+)/.exec(idString);
            if (idMatch?.[1]) {
              const crmDataId = Number.parseInt(idMatch[1]);
              setLoadingCrmData(true);
              try {
                const crmDataItem = await getCrmDataById(crmDataId);
                setCrmData(crmDataItem);
              } catch (error) {
                console.error("Failed to fetch CRM data:", error);
                setCrmData(null);
              } finally {
                setLoadingCrmData(false);
              }
            } else {
              setCrmData(null);
            }
          } else {
            setCrmData(null);
          }
          
          // Fetch stages for the record type
          const stageType = recordType === 'prospect' ? 'lead' : apiType; // Prospects use lead stages
          const stagesData = await getStages(stageType as "lead" | "deal" | "order");
          const sortedStages = [...stagesData].sort((a, b) => a.sequence - b.sequence);
          setRecordStages(sortedStages);
          
          // Determine current step index based on record type
          // The 4 main steps are: Prospect (0), Lead (1), Deal (2), Order (3)
          const typeToStepIndex: Record<string, number> = {
            'prospect': 0,
            'lead': 1,
            'deal': 2,
            'order': 3
          };
          
          const stepIndex = typeToStepIndex[recordType] ?? 0;
          setCurrentStageIndex(stepIndex);
        } catch (error) {
          console.error("Failed to fetch history chain:", error);
          setHistoryChain([]);
          setRecordStages([]);
        } finally {
          setLoadingHistory(false);
        }
      };
      
      fetchHistoryAndStages();
    } else {
      setHistoryChain([]);
      setRecordStages([]);
      setCurrentStageIndex(0);
      setCrmData(null);
    }
  }, [showActivitySidebar, showActivityTimelineModal, selectedActivityRecord]);


  const { PERMISSIONS } = HEADER_CONSTANTS;

  // Define table columns for GenericTable
  const tableColumns: TableColumn<ActivityRecord>[] = [
    {
      key: 'customer',
      label: 'Record Name',
      type: 'multi-field',
      fields: {
        primary: 'customer',
        secondary: 'tags',
        secondaryClass: 'text-muted small'
      },
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.customer}</div>
          {row.tags && row.tags.length > 0 && (
            <div className="mt-1">
              {row.tags.map((tag: any, idx: number) => (
                <Badge key={idx} bg="light" text="dark" className="me-1" style={{ fontSize: '0.7rem' }}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'agent',
      label: 'Agent',
      type: 'avatar',
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          <div 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#0d6efd',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            {(() => {
              const alphabeticChars = row.agent.replace(/[^a-zA-Z]/g, '');
              const splittedArray = alphabeticChars.split(' ');
              return [splittedArray[0]?.[0] || '', splittedArray?.[1]?.[0] || ''].join('').toUpperCase();
            })()}
          </div>
          <div className="small">{row.agent}</div>
        </div>
      )
    },
    {
      key: 'lastActivity',
      label: 'Last Activity',
      type: 'date',
      render: (row) => (
        <div className="small text-uppercase">
          {row.dateTime ? moment(row.dateTime).format(GlobalDateFormat) : '-'}
          <div className="text-muted">{row.dateTime ? moment(row.dateTime).format(GlobalTimeFormat) : ''}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      type: 'badge',
      render: (row) => (
        <Badge 
          bg={
            row.type === 'Prospect' ? 'secondary' :
            row.type === 'Lead' ? 'primary' :
            row.type === 'Deal' ? 'success' :
            'info'
          }
        >
          {row.type}
        </Badge>
      )
    },
    {
      key: 'stage',
      label: 'Stage',
      type: 'text',
      render: (row) => (
        <div className="small fw-semibold">{row.stage}</div>
      )
    }
  ];

  // Define filter fields for GenericFilterSidebar
  const filterFields: FilterField[] = [
    {
      id: 'agents',
      label: 'Agents',
      type: 'multi-select',
      value: activityFilters.agents.map(agentId => {
        const agent = availableAgents.find(a => a.value === agentId);
        return agent ? { value: agent.value, label: agent.label } : null;
      }).filter(Boolean),
      onChange: (selected) => {
        setActivityFilters(prev => ({
          ...prev,
          agents: selected ? selected.map((s: any) => s.value) : []
        }));
      },
      options: availableAgents,
      placeholder: 'Select agents...'
    },
    {
      id: 'dateFrom',
      label: 'From',
      type: 'date',
      value: activityFilters.dateRange.start,
      onChange: (value) => setActivityFilters(prev => ({ 
        ...prev, 
        dateRange: { ...prev.dateRange, start: value } 
      }))
    },
    {
      id: 'dateTo',
      label: 'To',
      type: 'date',
      value: activityFilters.dateRange.end,
      onChange: (value) => setActivityFilters(prev => ({ 
        ...prev, 
        dateRange: { ...prev.dateRange, end: value } 
      }))
    }
  ];

  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_CRM_HISTORY]}>
      <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
      <div className="mb-3 mb-md-0">
  <nav aria-label="breadcrumb">
    <ol className="breadcrumb mb-0">
      <li className="breadcrumb-item">
        <a href="/dashboard" className="text-decoration-none">
          CRM
        </a>
      </li>
      <li className="breadcrumb-item active fw-bold" aria-current="page">
        Activity Management
      </li>
    </ol>
  </nav>
</div>
        <div className="d-flex flex-wrap gap-2">
          <Button
              variant={showFilterBar ? "secondary" : "outline-secondary"}
              onClick={() => setShowFilterBar(!showFilterBar)}
            >
              <Layers size={16} className="me-2" />
              {showFilterBar ? "Hide Tabs" : "Show Tabs"}
            </Button>
          <Button variant="outline-secondary" >
            <Download size={16} className="me-2" />
            Export
          </Button>
          <Button variant={`${showFiltersSidebar ? "secondary" : "outline-secondary"}`} onClick={() => setShowFiltersSidebar(!showFiltersSidebar)}>
              <Filter size={16} className="me-2" />
              Filters
            </Button>
        </div>
      </div>

     {/* Stats Cards */}
     <StatsCards 
        data={[
          {
            title: 'All Types',
            value: typeFilterCounts.all || pagination.total || 0,
            icon: Activity,
            iconColor: '#6366F1',
            iconBgColor: '#EEF2FF',
            subtitle: 'Total activities'
          },
          {
            title: 'Leads',
            value: typeFilterCounts.leads || 0,
            icon: Target,
            iconColor: '#3B82F6',
            iconBgColor: '#DBEAFE',
            metric: {
              text: 'Lead activities',
              dotColor: '#2563EB'
            }
          },
          {
            title: 'Deals',
            value: typeFilterCounts.deals || 0,
            icon: Handshake,
            iconColor: '#10B981',
            iconBgColor: '#D1FAE5',
            subtitle: 'Deal activities'
          },
          {
            title: 'Orders',
            value: typeFilterCounts.orders || 0,
            icon: ShoppingBag,
            iconColor: '#8B5CF6',
            iconBgColor: '#EDE9FE',
            metric: {
              text: 'Order activities',
              dotColor: '#7C3AED'
            }
          },
          {
            title: 'Deals',
            value: typeFilterCounts.deals || 0,
            icon: Handshake,
            iconColor: '#10B981',
            iconBgColor: '#D1FAE5',
            subtitle: 'Deal activities'
          },
          {
            title: 'Orders',
            value: typeFilterCounts.orders || 0,
            icon: ShoppingBag,
            iconColor: '#8B5CF6',
            iconBgColor: '#EDE9FE',
            metric: {
              text: 'Order activities',
              dotColor: '#7C3AED'
            }
          }
        ]}
        gridMinWidth="220px"
      />
      {/* Quick Filter Buttons */}
      {showFilterBar && (
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="p-3">
          <div className="d-flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All Types', color: '#6c757d', icon: <Activity size={16} /> },
              { id: 'leads', label: 'Leads', color: '#0d6efd', icon: <Target size={16} /> },
              { id: 'deals', label: 'Deals', color: '#28a745', icon: <Handshake size={16} /> },
              { id: 'orders', label: 'Orders', color: '#20c997', icon: <ShoppingBag size={16} /> }
            ].map(filter => {
              const isActive = activityTypeFilter === filter.id;
              return (
                <Button
                  key={filter.id}
                  variant={isActive ? undefined : 'outline-secondary'}
                  onClick={() => handleFilterChange(filter.id)}
                  className="d-flex align-items-center gap-2"
                  style={isActive ? {
                    background: filter.color,
                    borderColor: filter.color,
                    color: '#fff'
                  } : {
                    background: '#fff',
                    borderColor: filter.color,
                    color: filter.color
                  }}
                >
                  {filter.icon}
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </Card.Body>
      </Card>
      )}
      {/* Generic Sidebar for Activity Details */}
      <GenericSidebar
        isOpen={showActivitySidebar}
        onClose={() => setShowActivitySidebar(false)}
        title={selectedActivityRecord?.customer || 'Activity Details'}
        subtitle={`Assigned to ${selectedActivityRecord?.agent || 'N/A'}`}
        avatar={{
          name: selectedActivityRecord?.agent || '',
          useIcon: true
        }}
        width="420px"
        tabs={[
          {
            id: 'timeline',
            label: 'Timeline & Progress',
            sections: [
              {
                id: 'stage-progress',
                title: 'Stage Progress',
                icon: TrendingUp,
                customContent: loadingHistory ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading stages...</span>
                    </div>
                  </div>
                ) : recordStages.length > 0 ? (
                  <div className="position-relative" style={{ padding: '32px 0' }}>
                    {/* Background Progress Bar */}
                    <div 
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '10%',
                        right: '10%',
                        height: '4px',
                        backgroundColor: '#e3e8ef',
                        borderRadius: '4px',
                        transform: 'translateY(-50%)',
                        zIndex: 0
                      }}
                    />
                    {/* Filled Progress Bar */}
                    {[
                      { name: 'Prospect', icon: <Users size={20} />, color: '#9c27b0' },
                      { name: 'Lead', icon: <Target size={20} />, color: '#2196f3' },
                      { name: 'Deal', icon: <TrendingUp size={20} />, color: '#ff9800' },
                      { name: 'Order', icon: <ShoppingBag size={20} />, color: '#4caf50' }
                    ].length > 0 && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '10%',
                          width: currentStageIndex > 0 ? `${(currentStageIndex / 3) * 80}%` : '0%',
                          height: '4px',
                          background: `linear-gradient(90deg, #667eea 0%, #764ba2 100%)`,
                          borderRadius: '4px',
                          transform: 'translateY(-50%)',
                          zIndex: 0,
                          transition: 'width 0.5s ease'
                        }}
                      />
                    )}
                    
                    {/* Stage Items */}
                    <div className="d-flex justify-content-between align-items-center position-relative" style={{ zIndex: 1 }}>
                      {[
                        { name: 'Prospect', icon: <Users size={20} />, color: '#9c27b0' },
                        { name: 'Lead', icon: <Target size={20} />, color: '#2196f3' },
                        { name: 'Deal', icon: <TrendingUp size={20} />, color: '#ff9800' },
                        { name: 'Order', icon: <ShoppingBag size={20} />, color: '#4caf50' }
                      ].map((stage, idx) => {
                        const isCompleted = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        
                        return (
                          <div 
                            key={stage.name} 
                            className="d-flex flex-column align-items-center"
                            style={{ flex: 1 }}
                          >
                            {/* Stage Circle */}
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                              style={{ 
                                width: isCurrent ? '64px' : '52px', 
                                height: isCurrent ? '64px' : '52px',
                                background: isCurrent 
                                  ? `linear-gradient(135deg, ${stage.color} 0%, ${stage.color}dd 100%)`
                                  : isCompleted 
                                    ? stage.color 
                                    : '#e3e8ef',
                                color: (isCurrent || isCompleted) ? '#fff' : '#9ca3af',
                                transition: 'all 0.3s ease',
                                boxShadow: isCurrent 
                                  ? `0 8px 24px ${stage.color}66` 
                                  : isCompleted 
                                    ? `0 4px 12px ${stage.color}44`
                                    : 'none'
                              }}
                            >
                              {isCompleted && !isCurrent ? (
                                <CheckCircle size={24} strokeWidth={3} />
                              ) : (
                                stage.icon
                              )}
                            </div>
                            
                            {/* Stage Label */}
                            <span 
                              className="fw-semibold text-center"
                              style={{ 
                                fontSize: isCurrent ? '15px' : '13px',
                                color: isCurrent ? stage.color : isCompleted ? '#374151' : '#9ca3af'
                              }}
                            >
                              {stage.name}
                            </span>
                            
                            {/* Current Stage Badge */}
                            {isCurrent && (
                              <Badge 
                                className="mt-1"
                                style={{ 
                                  backgroundColor: `${stage.color}22`,
                                  color: stage.color,
                                  fontSize: '11px',
                                  padding: '4px 10px'
                                }}
                              >
                                CURRENT
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">
                    <TrendingUp size={48} className="mb-3 opacity-50" />
                    <div>No stage information available</div>
                  </div>
                )
              },
              {
                id: 'activity-timeline',
                title: 'Activity Timeline',
                icon: Clock,
                customContent: loadingHistory ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : historyChain.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <Clock size={48} className="mb-3 opacity-50" />
                    <div>No activity history available</div>
                  </div>
                ) : (
                  <div className="position-relative" style={{ paddingLeft: '56px' }}>
                    {/* Timeline Line */}
                    <div 
                      style={{
                        position: 'absolute',
                        left: '30px',
                        top: '0',
                        bottom: '20px',
                        width: '3px',
                        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '3px',
                        opacity: 0.2
                      }}
                    />

                    {historyChain.map((record, index) => {
                      const dateObj = new Date(record.created_at);
                      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                      
                      const userExtension = record.user_extension_done_by || record.user_extension;
                      const userName = userExtension 
                        ? (extensions.find((ext: any) => ext?.id == userExtension || ext?.extension == userExtension)?.display_name || 
                           extensions.find((ext: any) => ext?.id == userExtension || ext?.extension == userExtension)?.name || 
                           userExtension)
                        : 'System';
                      const cleanUserName = userName.replace(/\s*\([^)]*\)\s*$/, '').trim();
                      
                      const getIconForEvent = (event: string, action: string | null) => {
                        if (event === 'created') {
                          return { icon: <PlusCircle size={20} />, bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' };
                        }
                        if (action?.toLowerCase().includes('stage') || event?.toLowerCase().includes('stage')) {
                          return { icon: <ArrowRight size={20} />, bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' };
                        }
                        if (action?.toLowerCase().includes('call') || event?.toLowerCase().includes('call')) {
                          return { icon: <Phone size={20} />, bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
                        }
                        if (action?.toLowerCase().includes('email') || event?.toLowerCase().includes('email')) {
                          return { icon: <Mail size={20} />, bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' };
                        }
                        return { icon: <FileText size={20} />, bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' };
                      };
                      
                      const iconData = getIconForEvent(record.event, record.action);
                      
                      return (
                        <div 
                          key={index} 
                          className="position-relative mb-4 pb-3"
                        >
                          {/* Timeline Icon */}
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center position-absolute"
                            style={{ 
                              width: '60px', 
                              height: '60px',
                              left: '-56px',
                              top: '0',
                              background: iconData.bg,
                              border: '4px solid #fff',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                              color:'#fff'
                            }}
                          >
                            {iconData.icon}
                          </div>
                          
                          {/* Timeline Content */}
                          <Card 
                            className="border-0"
                            style={{ 
                              backgroundColor: '#fff',
                              borderLeft: '3px solid #667eea22',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                          >
                            <Card.Body className="p-3">
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  <Badge bg="light" text="dark" style={{ fontSize: '12px' }}>
                                    <Calendar size={12} className="me-1" />
                                    {record.created_at_human || dateStr}
                                  </Badge>
                                  <Badge bg="light" text="muted" style={{ fontSize: '12px' }}>
                                    <Clock size={12} className="me-1" />
                                    {timeStr}
                                  </Badge>
                                </div>
                                <Badge bg="light" text="muted" style={{ fontSize: '11px' }}>
                                  <Users size={11} className="me-1" />
                                  {cleanUserName}
                                </Badge>
                              </div>
                              <p className="mb-0 fw-medium text-dark" style={{ fontSize: '15px' }}>
                                {record.description || record.action_display || 'Activity recorded'}
                              </p>
                            </Card.Body>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            ]
          },
          {
            id: 'info',
            label: 'Information',
            sections: [
              {
                id: 'customer-info',
                title: 'Customer Info',
                icon: Users,
                fields: [
                  {
                    label: 'Name',
                    value: crmData?.name || selectedActivityRecord?.customer || 'N/A'
                  },
                  {
                    label: 'Phone',
                    value: crmData?.phone || 'N/A',
                    icon: Phone
                  }
                ]
              },
              {
                id: 'agent-info',
                title: 'Agent Info',
                icon: Users,
                fields: [
                  {
                    label: 'Agent Name',
                    value: selectedActivityRecord?.agent || 'N/A'
                  }
                ]
              }
            ]
          }
        ]}
        actions={[
          {
            label: 'Close',
            onClick: () => setShowActivitySidebar(false),
            variant: 'outline-secondary'
          }
        ]}
      />

      {/* Activities Table */}
      <GenericTable
        data={filteredActivityRecords}
        columns={tableColumns}
        loading={loading}
        emptyMessage={
          <div className="text-center py-4">
            <AlertCircle size={48} className="mb-3 opacity-50" />
            <div>No activities found matching your criteria</div>
          </div>
        }
        loadingMessage="Loading activities..."
        pagination={{
          currentPage: pagination.current_page,
          rowsPerPage: pagination.per_page,
          totalRows: pagination.total,
          pageSizeOptions: [10, 15, 25, 50, 100]
        }}
        onPaginationChange={(page, rowsPerPage) => {
          setPagination(prev => ({ ...prev, current_page: page, per_page: rowsPerPage }));
          fetchHistoryData(page, rowsPerPage);
        }}
        actions={[
          {
            label: 'View',
            icon: <Eye size={16} />,
            onClick: (row) => {
              setSelectedActivityRecord(row);
              setShowActivityTimelineModal(true);
            },
            variant: 'link'
          }
        ]}
        onRowClick={(row) => {
          setSelectedActivityRecord(row);
          setShowActivitySidebar(true);
        }}
        hover={true}
        striped={false}
        customizableColumns={true}
        defaultSelectedColumns={['customer', 'agent', 'lastActivity', 'type', 'stage']}
      />

{/* Activity Timeline Modal */}
{selectedActivityRecord && (
  <Modal
    show={showActivityTimelineModal}
    onHide={() => setShowActivityTimelineModal(false)}
    size="xl"
    centered
    className="activity-timeline-modal"
  >
    {/* Modern Header with Gradient */}
    <div
      style={{
        background: "#fff",
        color: "black",
        padding: "24px 32px",
        position: "relative",
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderBottom: "1px solid #ccc",
      }}
    >
      <button
        onClick={() => setShowActivityTimelineModal(false)}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "black",
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.25)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.15)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <X size={18} />
      </button>
      
      {/* Header Content */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "#8b5cf6",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: "700",
            flexShrink: 0,
            color: "#fff",
          }}
        >
          {selectedActivityRecord.customer
            ? selectedActivityRecord.customer.charAt(0).toUpperCase()
            : "A"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ 
            margin: 0, 
            fontWeight: 700, 
            fontSize: "26px",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {selectedActivityRecord.customer}
          </h2>
          <div style={{ 
            marginTop: "6px", 
            opacity: 0.95, 
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            color: "#000",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Users size={14} />
              Assigned to {selectedActivityRecord.agent}
            </span>
            <span>•</span>
            <span>
              {['Prospect', 'Lead', 'Deal', 'Order'][currentStageIndex] || 'Unknown'} Stage
            </span>
          </div>
        </div>
      </div>
    </div>

    <Modal.Body style={{ padding: 0, maxHeight: "calc(90vh - 200px)", overflowY: "auto" }}>
      <style>{`
        .activity-timeline-modal .timeline-progress-bar {
          transition: width 0.5s ease;
        }
      `}</style>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", minHeight: "500px" }}>
        
        {/* Left Panel - Stage Progress & Timeline */}
        <div style={{ padding: "32px", borderRight: "1px solid #e5e7eb" }}>
          
          {/* Enhanced Stage Progress */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}>
              <h5 style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#1f2937",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <div style={{
                  width: "4px",
                  height: "18px",
                  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  borderRadius: "2px",
                }} />
                Stage Progress
              </h5>
              <Badge 
                bg="primary"
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: "#8b5cf6",
                }}
              >
                {['Prospect', 'Lead', 'Deal', 'Order'][currentStageIndex] || 'Unknown'}
              </Badge>
            </div>
            
            {loadingHistory ? (
              <div style={{
                padding: "48px 20px",
                textAlign: "center",
              }}>
                <Spinner animation="border" variant="primary" size="sm" style={{ marginBottom: "12px" }} />
                <p className="mb-0" style={{ color: "#6b7280", fontSize: "14px" }}>Loading stages...</p>
              </div>
            ) : (
              <div style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "40px 20px",
                position: "relative",
              }}>
                {/* Background Progress Bar */}
                <div 
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '10%',
                    right: '10%',
                    height: '4px',
                    backgroundColor: '#e3e8ef',
                    borderRadius: '4px',
                    transform: 'translateY(-50%)',
                    zIndex: 0
                  }}
                />
                {/* Filled Progress Bar */}
                <div 
                  className="timeline-progress-bar"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '10%',
                    width: currentStageIndex > 0 ? `${(currentStageIndex / 3) * 80}%` : '0%',
                    height: '4px',
                    background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                    borderRadius: '4px',
                    transform: 'translateY(-50%)',
                    zIndex: 0,
                  }}
                />
                
                {/* Stage Items */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                  zIndex: 1,
                }}>
                  {[
                    { name: 'Prospect', icon: <Users size={20} />, color: '#9c27b0' },
                    { name: 'Lead', icon: <Target size={20} />, color: '#2196f3' },
                    { name: 'Deal', icon: <TrendingUp size={20} />, color: '#ff9800' },
                    { name: 'Order', icon: <ShoppingBag size={20} />, color: '#4caf50' }
                  ].map((stage, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    
                    return (
                      <div 
                        key={stage.name}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        {/* Circle */}
                        <div 
                          style={{
                            width: isCurrent ? '56px' : '48px',
                            height: isCurrent ? '56px' : '48px',
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "8px",
                            background: isCompleted || isCurrent 
                              ? stage.color
                              : '#fff',
                            border: isCurrent ? `3px solid ${stage.color}` : `2px solid ${isCompleted ? stage.color : '#dee2e6'}`,
                            color: isCompleted || isCurrent ? '#fff' : '#6c757d',
                            boxShadow: isCurrent ? `0 8px 24px ${stage.color}40` : isCompleted ? `0 4px 12px ${stage.color}30` : 'none',
                            transition: 'all 0.3s ease',
                            transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                          }}
                        >
                          {isCompleted ? <CheckCircle size={isCurrent ? 24 : 20} /> : stage.icon}
                        </div>
                        
                        {/* Label */}
                        <div 
                          style={{
                            textAlign: "center",
                            fontSize: isCurrent ? '0.9rem' : '0.8rem',
                            fontWeight: isCurrent ? 700 : 600,
                            color: isCompleted || isCurrent ? stage.color : '#6c757d',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {stage.name}
                        </div>
                        
                        {/* Current indicator */}
                        {isCurrent && (
                          <div 
                            style={{
                              marginTop: "8px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              backgroundColor: `${stage.color}15`,
                              color: stage.color,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                            }}
                          >
                            Current
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Activity Timeline */}
          <div style={{ marginBottom: "28px" }}>
            <h5 style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#1f2937",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{
                width: "4px",
                height: "18px",
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                borderRadius: "2px",
              }} />
              Activity Timeline
              {!loadingHistory && historyChain.length > 0 && (
                <Badge 
                  bg="secondary"
                  style={{
                    marginLeft: "8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "6px",
                  }}
                >
                  {historyChain.length}
                </Badge>
              )}
            </h5>
            
            {loadingHistory ? (
              <div style={{
                padding: "48px 20px",
                textAlign: "center",
              }}>
                <Spinner animation="border" variant="primary" size="sm" style={{ marginBottom: "12px" }} />
                <p className="mb-0" style={{ color: "#6b7280", fontSize: "14px" }}>Loading activity timeline...</p>
              </div>
            ) : historyChain.length === 0 ? (
              <div style={{
                padding: "40px",
                textAlign: "center",
                color: "#6b7280",
                background: "#f9fafb",
                border: "2px dashed #d1d5db",
                borderRadius: "12px"
              }}>
                <Clock size={40} style={{ marginBottom: "12px", opacity: 0.5 }} />
                <div style={{ fontSize: "14px", fontWeight: 500 }}>No activity history available</div>
              </div>
            ) : (
              <div style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "20px",
              }}>
                <div style={{ position: "relative", paddingLeft: "56px" }}>
                  {/* Timeline Line */}
                  <div 
                    style={{
                      position: 'absolute',
                      left: '30px',
                      top: '0',
                      bottom: '20px',
                      width: '3px',
                      background: 'linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)',
                      borderRadius: '3px',
                      opacity: 0.2
                    }}
                  />

                  {historyChain.map((record, index) => {
                    const dateObj = new Date(record.created_at);
                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    
                    const userExtension = record.user_extension_done_by || record.user_extension;
                    const userName = userExtension 
                      ? (extensions.find((ext: any) => ext?.id == userExtension || ext?.extension == userExtension)?.display_name || 
                         extensions.find((ext: any) => ext?.id == userExtension || ext?.extension == userExtension)?.name || 
                         userExtension)
                      : 'System';
                    const cleanUserName = userName.replace(/\s*\([^)]*\)\s*$/, '').trim();
                    
                    const getIconForEvent = (event: string, action: string | null) => {
                      if (event === 'created') {
                        return { icon: <PlusCircle size={20} />, bg: '#10b981' };
                      }
                      if (action?.toLowerCase().includes('stage') || event?.toLowerCase().includes('stage')) {
                        return { icon: <ArrowRight size={20} />, bg: '#3b82f6' };
                      }
                      if (action?.toLowerCase().includes('call') || event?.toLowerCase().includes('call')) {
                        return { icon: <Phone size={20} />, bg: '#8b5cf6' };
                      }
                      if (action?.toLowerCase().includes('email') || event?.toLowerCase().includes('email')) {
                        return { icon: <Mail size={20} />, bg: '#ec4899' };
                      }
                      return { icon: <FileText size={20} />, bg: '#f59e0b' };
                    };
                    
                    const iconData = getIconForEvent(record.event, record.action);
                    
                    return (
                      <div 
                        key={index}
                        style={{
                          position: "relative",
                          marginBottom: index < historyChain.length - 1 ? "24px" : "0",
                        }}
                      >
                        {/* Timeline Icon */}
                        <div 
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "absolute",
                            left: '-56px',
                            top: '0',
                            background: iconData.bg,
                            border: '4px solid #fff',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            color: '#fff'
                          }}
                        >
                          {iconData.icon}
                        </div>
                        
                        {/* Timeline Content */}
                        <div 
                          style={{
                            background: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            borderLeft: `3px solid ${iconData.bg}`,
                            borderRadius: "8px",
                            padding: "12px 16px",
                          }}
                        >
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                            marginBottom: "8px",
                          }}>
                            <div style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#1f2937",
                            }}>
                              {record.description || record.action_display || 'Activity recorded'}
                            </div>
                            <Badge 
                              bg="light"
                              text="dark"
                              style={{
                                marginLeft: "8px",
                                fontSize: "11px",
                                fontWeight: 500,
                                padding: "4px 10px",
                                borderRadius: "6px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {record.created_at_human || dateStr}
                            </Badge>
                          </div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#6b7280",
                            fontSize: "13px",
                          }}>
                            <Users size={14} />
                            <span>{cleanUserName}</span>
                            <span>•</span>
                            <Clock size={14} />
                            <span>{timeStr}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Quick Actions & Info */}
        <div style={{ 
          padding: "32px 24px", 
          background: "#fafbfc",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}>
          
          {/* Customer Info */}
          <div>
            <h6 style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "14px",
            }}>
              Customer Information
            </h6>
            <div style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "16px",
            }}>
              {loadingCrmData ? (
                <div style={{
                  textAlign: "center",
                  padding: "20px",
                }}>
                  <Spinner animation="border" size="sm" variant="primary" />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                      Name
                    </span>
                    <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 600 }}>
                      {crmData?.name || selectedActivityRecord?.customer || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                      Phone
                    </span>
                    <span style={{ fontSize: "13px", color: "#1f2937", fontWeight: 500 }}>
                      {crmData?.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Agent Info */}
          <div>
            <h6 style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "14px",
            }}>
              Agent Information
            </h6>
            <div style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "16px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                >
                  {(() => {
                    const alphabeticChars = (selectedActivityRecord?.agent || '').replace(/[^a-zA-Z]/g, '');
                    const splittedArray = alphabeticChars.split(' ');
                    return [splittedArray[0]?.[0] || '', splittedArray?.[1]?.[0] || ''].join('').toUpperCase() || 'NA';
                  })()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1f2937",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {selectedActivityRecord?.agent || 'N/A'}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}>
                    Assigned Agent
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stage Summary */}
          <div>
            <h6 style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "14px",
            }}>
              Stage Summary
            </h6>
            <div style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "16px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    Current Stage
                  </span>
                  <Badge 
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      backgroundColor: "#8b5cf6",
                    }}
                  >
                    {['Prospect', 'Lead', 'Deal', 'Order'][currentStageIndex] || 'Unknown'}
                  </Badge>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    Progress
                  </span>
                  <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 600 }}>
                    {currentStageIndex + 1} / 4
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    Activities
                  </span>
                  <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 600 }}>
                    {historyChain.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal.Body>

    {/* Footer */}
    <div style={{
      padding: "20px 32px",
      borderTop: "1px solid #e5e7eb",
      background: "white",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
    }}>
      <Button
        variant="outline-secondary"
        onClick={() => setShowActivityTimelineModal(false)}
        style={{
          padding: "10px 24px",
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "14px",
          border: "2px solid #e5e7eb",
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = "#8b5cf6";
          e.currentTarget.style.color = "#8b5cf6";
          e.currentTarget.style.background = "#f5f3ff";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = "#e5e7eb";
          e.currentTarget.style.color = "#6c757d";
          e.currentTarget.style.background = "white";
        }}
      >
        Close
      </Button>
    </div>
  </Modal>
)}



      {/* Generic Filter Sidebar */}
      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={() => setShowFiltersSidebar(false)}
        title="Advanced Filters"
        subtitle="Filter activities by agent and date range"
        filters={filterFields}
        onApply={() => {
          setPagination(prev => ({ ...prev, current_page: 1 }));
          fetchHistoryData(1);
        }}
        onReset={() => {
          setActivityTypeFilter('all');
          setActivitySearch('');
          setActivityFilters({
            agents: [],
            dateRange: { start: '', end: '' }
          });
          setPagination(prev => ({ ...prev, current_page: 1 }));
          fetchHistoryData(1);
        }}
      />
      </div>
    </ProtectedRoute>
  );
};

HistoryPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default HistoryPage;
