import React, { ReactElement, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Row, Col, Card, Button, Badge, Table, Form, Modal, InputGroup } from "react-bootstrap";
import Select from "react-select";
import Layout from "@layout/index";
import ProtectedRoute from "@components/ProtectedRoute";
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
  Search,
  Clock,
  Calendar,
  PlusCircle,
  TrendingUp,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import "@assets/scss/ticketsnew.scss";
import { GlobalDateFormat, GlobalTimeFormat, ModuleSlug } from "@utils/Helper";
import moment from "moment";

// Filter Bar Component
interface FilterBarProps {
  quickFilters: { id: string; label: string; count?: number; variant?: string; color?: string; icon?: React.ReactNode }[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;
  searchPlaceholder?: string;
  showAdvancedFilters?: boolean;
  onToggleAdvancedFilters?: () => void;
  advancedFilterCount?: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  quickFilters,
  activeFilter,
  onFilterChange,
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = "Search...",
  showAdvancedFilters,
  onToggleAdvancedFilters,
  advancedFilterCount = 0
}) => {
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body className="p-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3">
          {/* Left Side: Quick Filter Buttons */}
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map(filter => {
              const isActive = activeFilter === filter.id;
              const hasCustomColor = filter.color;

              // Determine button styles
              const buttonStyle: React.CSSProperties = {};
              if (hasCustomColor) {
                if (isActive) {
                  // Active state: use activeColor or fallback to color for background
                  const bgColor = filter.color;
                  buttonStyle.background = bgColor;
                  buttonStyle.borderColor = bgColor;
                  buttonStyle.color = "#fff";
                } else {
                  // Inactive state: use color for background with reduced opacity
                  buttonStyle.background = '#fff';
                  buttonStyle.borderColor = filter.color;
                  buttonStyle.color = filter.color;
                  
                }
              }

              return (
                <Button
                  key={filter.id}
                  variant={hasCustomColor ? undefined : (isActive ? (filter.variant || 'primary') : 'outline-secondary')}
                  onClick={() => onFilterChange && onFilterChange(filter.id)}
                  className="d-flex align-items-center gap-2"
                  style={hasCustomColor ? buttonStyle : undefined}
                >
                  {/* Icon */}
                  {filter.icon && <span className="d-flex align-items-center">{filter.icon}</span>}
                  
                  {/* Button Text */}
                  {filter.label}

                  {/* Badge */}
                  {filter.count !== undefined && (
                    <Badge
                      bg={isActive ? 'light' : 'light'}
                      text={isActive ? 'dark' : 'dark'}
                      className="ms-2"
                    >
                      {filter.count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Right Side: Search and Filters */}
          {(onSearchChange || onToggleAdvancedFilters) && (
            <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center flex-shrink-0">
              {onSearchChange && onSearch && (
                <InputGroup style={{ width: '300px', minWidth: '200px' }} className="flex-shrink-0">
                  <Form.Control
                    style={{ height: '41px' }}
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue || ""}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && onSearch) {
                        onSearch();
                      }
                    }}
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={() => onSearch?.()}
                  >
                    <Search size={16} />
                  </Button>
                </InputGroup>
              )}
              {onToggleAdvancedFilters && (
                <Button 
                  variant={showAdvancedFilters ? 'primary' : 'outline-secondary'}
                  onClick={onToggleAdvancedFilters}
                  className="d-flex align-items-center flex-shrink-0"
                >
                  <Filter size={16} className="me-2" />
                  Filters
                  {(advancedFilterCount ?? 0) > 0 && (
                    <Badge bg="light" text="dark" className="ms-2">
                      {advancedFilterCount}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

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
  const [showActivityAdvancedFilters, setShowActivityAdvancedFilters] = useState(false);
  const [activityFilters, setActivityFilters] = useState({
    agents: [] as string[], // Store extension IDs
    dateRange: { start: '', end: '' }
  });
  const [showActivityTimelineModal, setShowActivityTimelineModal] = useState(false);
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
  // Custom Select Styles
  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '38px',
      fontSize: '0.875rem',
      borderColor: state.isFocused ? '#86b7fe' : '#dee2e6',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none',
      '&:hover': {
        borderColor: '#86b7fe'
      }
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#0d6efd',
      color: 'white',
      fontSize: '0.813rem'
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: 'white',
      padding: '2px 6px'
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: 'white',
      '&:hover': {
        backgroundColor: '#0b5ed7',
        color: 'white'
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      fontSize: '0.875rem'
    })
  };

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

  // Fetch history chain and stages when modal opens
  useEffect(() => {
    if (showActivityTimelineModal && selectedActivityRecord) {
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
  }, [showActivityTimelineModal, selectedActivityRecord]);

  // Activity Timeline Modal
  const ActivityTimelineModal = () => {
    if (!selectedActivityRecord) return null;

    // Map history chain to timeline format
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
    const timelineData = historyChain.map((record: HistoryChainRecord) => {
      const dateObj = new Date(record.created_at);
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      
      // Get user name from extensions
      const userExtension = record.user_extension_done_by || record.user_extension;
      const userName = userExtension 
        ? (extensions.find((ext: any) => ext?.id == userExtension || ext?.extension == userExtension)?.display_name || 
           extensions.find((ext: any) => ext?.id == userExtension || ext?.extension == userExtension)?.name || 
           userExtension)
        : 'System';
      const cleanUserName = userName.replace(/\s*\([^)]*\)\s*$/, '').trim();
      
      const iconData = getIconForEvent(record.event, record.action);
      
      return {
        date: record.created_at_human || dateStr,
        time: timeStr,
        action: record.description || record.action_display || 'Activity recorded',
        user: cleanUserName,
        icon: iconData.icon,
        iconBg: iconData.bg,
        iconColor: '#fff'
      };
    });

    // Always show all 4 steps in order: Prospect → Lead → Deal → Order
    const stages = [
      { name: 'Prospect', icon: <Users size={20} />, color: '#9c27b0' },
      { name: 'Lead', icon: <Target size={20} />, color: '#2196f3' },
      { name: 'Deal', icon: <TrendingUp size={20} />, color: '#ff9800' },
      { name: 'Order', icon: <ShoppingBag size={20} />, color: '#4caf50' }
    ];
    
    // currentStageIndex is set in useEffect based on record type

    return (
      <Modal show={showActivityTimelineModal} onHide={() => setShowActivityTimelineModal(false)} size="xl" centered>
        {/* Enhanced Header with Gradient */}
        <Modal.Header closeButton style={{  color: '#000', padding: '24px 32px', borderBottom: '1px solid #ccc' }}>
          <div className="w-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <Modal.Title className="fw-bold fs-3 mb-1">{selectedActivityRecord.customer}</Modal.Title>
                <div className="d-flex align-items-center gap-3 mt-2" style={{ fontSize: '14px', opacity: 0.95 }}>
                  <span className="d-flex align-items-center gap-1">
                    <Users size={16} />
                    Assigned to {selectedActivityRecord.agent}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal.Header>
        
        <Modal.Body style={{ backgroundColor: '#f8f9fc', padding: '32px' }}>
          <Row className="g-4">
            {/* Left Column - Stage Progress & Activity Timeline */}
            <Col lg={8}>
              {/* Enhanced Stage Progress with Better Highlighting */}
              <Card className="border-0 mb-4" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                <Card.Body className="p-4" style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fc 100%)' }}>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <TrendingUp size={22} className="text-primary" />
                      Stage Progress
                    </h5>
                    {loadingHistory ? (
                      <div className="spinner-border spinner-border-sm text-primary" role="status" />
                    ) : stages.length > 0 && (
                      <Badge bg="primary" className="px-3 py-2">
                        {currentStageIndex + 1} of {stages.length}
                      </Badge>
                    )}
                  </div>
                  
                  {loadingHistory ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading stages...</span>
                      </div>
                    </div>
                  ) : stages.length > 0 ? (
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
                    {stages.length > 0 && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '10%',
                          width: currentStageIndex > 0 ? `${(currentStageIndex / (stages.length - 1)) * 80}%` : '0%',
                          height: '4px',
                          background: stages[currentStageIndex]?.color 
                            ? `linear-gradient(90deg, ${stages[currentStageIndex].color} 0%, ${stages[Math.min(currentStageIndex + 1, stages.length - 1)]?.color || stages[currentStageIndex].color} 100%)`
                            : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '4px',
                          transform: 'translateY(-50%)',
                          zIndex: 0,
                          transition: 'width 0.5s ease',
                          boxShadow: `0 2px 8px ${stages[currentStageIndex]?.color || '#667eea'}66`
                        }}
                      />
                    )}
                    
                    {/* Stage Items */}
                    <div className="d-flex justify-content-between align-items-center position-relative" style={{ zIndex: 1 }}>
                      {stages.map((stage, idx) => {
                        const isCompleted = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        const isUpcoming = idx > currentStageIndex;
                        
                        return (
                          <div 
                            key={stage.name} 
                            className="d-flex flex-column align-items-center"
                            style={{ flex: 1 }}
                          >
                            {/* Stage Circle */}
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center mb-2 position-relative"
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
                                    : 'none',
                                transform: isCurrent ? 'scale(1.05)' : 'scale(1)',
                                border: isCurrent ? `4px solid ${stage.color}33` : 'none'
                              }}
                            >
                              {isCompleted && !isCurrent ? (
                                <CheckCircle size={24} strokeWidth={3} />
                              ) : (
                                stage.icon
                              )}
                              
                              {/* Pulse Animation for Current Stage */}
                              {isCurrent && (
                                <>
                                  <div 
                                    className="position-absolute rounded-circle"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      background: stage.color,
                                      opacity: 0.3,
                                      animation: 'pulse 2s ease-in-out infinite'
                                    }}
                                  />
                                  <style>{`
                                    @keyframes pulse {
                                      0%, 100% { transform: scale(1); opacity: 0.3; }
                                      50% { transform: scale(1.2); opacity: 0; }
                                    }
                                  `}</style>
                                </>
                              )}
                            </div>
                            
                            {/* Stage Label */}
                            <span 
                              className="fw-semibold text-center"
                              style={{ 
                                fontSize: isCurrent ? '15px' : '13px',
                                color: isCurrent ? stage.color : isCompleted ? '#374151' : '#9ca3af',
                                transition: 'all 0.3s ease',
                                fontWeight: isCurrent ? 700 : 600
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
                                  padding: '4px 10px',
                                  fontWeight: 600
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
                  )}
                </Card.Body>
              </Card>

              {/* Enhanced Activity Timeline */}
              <Card className="border-0" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: '16px' }}>
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                    <Clock size={22} className="text-primary" />
                    Activity Timeline
                  </h5>
                  {loadingHistory ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : timelineData.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <Clock size={48} className="mb-3 opacity-50" />
                      <div>No activity history available</div>
                    </div>
                  ) : (
                    <div className="position-relative" style={{ paddingLeft: '56px' }}>
                      {/* Gradient Timeline Line */}
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

                      {timelineData.map((item, index) => (
                      <div 
                        key={index} 
                        className="position-relative mb-4 pb-3"
                        style={{
                          transition: 'transform 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                      >
                        {/* Enhanced Timeline Icon */}
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center position-absolute"
                          style={{ 
                            width: '60px', 
                            height: '60px',
                            left: '-56px',
                            top: '0',
                            background: item.iconBg,
                            border: '4px solid #fff',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            transition: 'all 0.3s ease',
                            color:'#fff'
                          }}
                        >
                          {item.icon}
                        </div>
                        
                        {/* Timeline Content Card */}
                        <Card 
                          className="border-0"
                          style={{ 
                            backgroundColor: '#fff',
                            borderLeft: '3px solid #667eea22',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Card.Body className="p-3">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div className="d-flex align-items-center gap-2">
                                <Badge 
                                  bg="light" 
                                  text="dark" 
                                  className="d-flex align-items-center gap-1"
                                  style={{ fontSize: '12px', fontWeight: 600 }}
                                >
                                  <Calendar size={12} />
                                  {item.date}
                                </Badge>
                                <Badge 
                                  bg="light" 
                                  text="muted"
                                  style={{ fontSize: '12px', fontWeight: 500 }}
                                >
                                  <Clock size={12} className="me-1" />
                                  {item.time}
                                </Badge>
                              </div>
                              <Badge 
                                bg="light" 
                                text="muted"
                                className="d-flex align-items-center gap-1"
                                style={{ fontSize: '11px' }}
                              >
                                <Users size={11} />
                                {item.user}
                              </Badge>
                            </div>
                            <p 
                              className="mb-0 fw-medium text-dark" 
                              style={{ fontSize: '15px', lineHeight: '1.6' }}
                            >
                              {item.action}
                            </p>
                          </Card.Body>
                        </Card>
                      </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Right Column - Enhanced Info Cards */}
            <Col lg={4}>
       

              {/* Customer Info */}
              <Card className="border-0 mb-3" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ height: '4px', background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' }} />
                <Card.Body className="p-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
                    >
                      <Users size={16} color="#fff" />
                    </div>
                    Customer Info
                  </h6>
                  {loadingCrmData ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</small>
                        <div className="text-dark fw-semibold" style={{ fontSize: '15px' }}>
                          {crmData?.name || selectedActivityRecord.customer}
                        </div>
                      </div>
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</small>
                        {crmData?.phone ? (
                          <div className="text-dark fw-medium d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                            <Phone size={14} className="text-primary" />
                            {crmData.phone}
                          </div>
                        ) : (
                          <div className="text-muted" style={{ fontSize: '14px' }}>N/A</div>
                        )}
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>

              {/* Agent Info */}
              <Card className="border-0" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ height: '4px', background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)' }} />
                <Card.Body className="p-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
                    >
                      <Users size={16} color="#fff" />
                    </div>
                    Agent Info
                  </h6>
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '18px'
                      }}
                    >
                      {selectedActivityRecord.agent.charAt(0)}
                    </div>
                    <div>
                      <div className="text-dark fw-semibold" style={{ fontSize: '15px' }}>{selectedActivityRecord.agent}</div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        
        <Modal.Footer className="border-0" style={{ backgroundColor: '#f8f9fc', padding: '20px 32px' }}>
          <div className="d-flex gap-2 w-100 justify-content-end">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowActivityTimelineModal(false)}
              style={{ paddingLeft: '24px', paddingRight: '24px', borderRadius: '8px', fontWeight: 600 }}
            >
              Close
            </Button>
            <Button 
              onClick={() => setShowActivityTimelineModal(false)}
              style={{ 
                paddingLeft: '24px', 
                paddingRight: '24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              <TrendingUp size={18} className="me-2" />
              Change Stage
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    );
  };

  const { PERMISSIONS } = HEADER_CONSTANTS;

  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_CRM_HISTORY]}>
      <div>
        {ActivityTimelineModal()}

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
          <h2 className="mb-1 fw-bold">Activity Management</h2>
          <p className="text-muted mb-0">Track and manage all customer activities across the pipeline</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-secondary" >
            <Download size={16} className="me-2" />
            Export
          </Button>
          <Button variant={`${showActivityAdvancedFilters ? "secondary" : "outline-secondary"}`} onClick={() => setShowActivityAdvancedFilters(!showActivityAdvancedFilters)}>
              <Filter size={16} className="me-2" />
              {showActivityAdvancedFilters ? "Hide Filters" : "Show Filters"}
            </Button>
        </div>
      </div>

      {/* Filter Bar with Type Tabs */}
      <FilterBar
        quickFilters={[
          {
            id: 'all',
            label: 'All Types',
            color: '#6c757d',
            icon: <Activity size={16} />
          },
          {
            id: 'leads',
            label: 'Leads',
            color: '#0d6efd',
            icon: <Target size={16} />
          },
          {
            id: 'deals',
            label: 'Deals',
            color: '#28a745',
            icon: <Handshake size={16} />
          },
          {
            id: 'orders',
            label: 'Orders',
            color: '#20c997',
            icon: <ShoppingBag size={16} />
          }
        ]}
        activeFilter={activityTypeFilter}
        onFilterChange={handleFilterChange}
        // searchValue={activitySearch}
        // onSearchChange={(value) => setActivitySearch(value)}
        // onSearch={() => {
        //   setPagination(prev => ({ ...prev, current_page: 1 }));
        //   fetchHistoryData(1);
        // }}
        // searchPlaceholder="Search by customer or agent..."
        // showAdvancedFilters={showActivityAdvancedFilters}
        // onToggleAdvancedFilters={() => setShowActivityAdvancedFilters(!showActivityAdvancedFilters)}
        // advancedFilterCount={
        //   activityFilters.agents.length +
        //   (activityFilters.dateRange.start ? 1 : 0) +
        //   (activityFilters.dateRange.end ? 1 : 0)
        // }
      />

      {/* Advanced Filters Panel */}
      {showActivityAdvancedFilters && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Label className="small fw-bold mb-2">Agents</Form.Label>
                <Select
                  isMulti
                  options={availableAgents}
                  value={activityFilters.agents.map(agentId => {
                    const agent = availableAgents.find(a => a.value === agentId);
                    return agent ? { value: agent.value, label: agent.label } : null;
                  }).filter(Boolean) as any}
                  onChange={(selected) => {
                    setActivityFilters(prev => ({
                      ...prev,
                      agents: selected ? selected.map(s => s.value) : []
                    }));
                  }}
                  placeholder="Select agents..."
                  styles={customSelectStyles}
                />
              </Col>
              <Col md={3}>
                <Form.Label className="small fw-bold mb-2">From</Form.Label>
                <Form.Control 
                  type="date" 
                  value={activityFilters.dateRange.start}
                  onChange={(e) => setActivityFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, start: e.target.value } 
                  }))}
                  style={{ fontSize: '0.875rem' }}
                />
              </Col>
              <Col md={3}>
                <Form.Label className="small fw-bold mb-2">To</Form.Label>
                <Form.Control 
                  type="date" 
                  value={activityFilters.dateRange.end}
                  onChange={(e) => setActivityFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, end: e.target.value } 
                  }))}
                  style={{ fontSize: '0.875rem' }}
                />
              </Col>
              <Col md={2}>
                <div className="d-flex gap-2">
                  {/* Apply Button */}
                  <Button
                    variant="primary"
                    className="flex-grow-1 d-flex align-items-center justify-content-center"
                    onClick={() => {
                      setPagination(prev => ({ ...prev, current_page: 1 }));
                      fetchHistoryData(1);
                    }}
                  >
                    Apply
                  </Button>

                  {/* Reset Button */}
                  <Button
                    variant="outline-secondary"
                    className="d-flex align-items-center justify-content-center"
                    onClick={() => {
                      setActivityTypeFilter('all');
                      setActivitySearch('');
                      setActivityFilters({
                        agents: [],
                        dateRange: { start: '', end: '' }
                      });
                      setPagination(prev => ({ ...prev, current_page: 1 }));
                      fetchHistoryData(1);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Activities Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ width: '25%' }}>Record Name</th>
                  <th style={{ width: '15%' }}>Agent</th>
                  <th style={{ width: '15%' }}>Last Activity</th>
                  <th style={{ width: '12%' }}>Type</th>
                  <th style={{ width: '18%' }}>Stage</th>
                  <th style={{ width: '15%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <div>Loading...</div>
                    </td>
                  </tr>
                ) : filteredActivityRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <AlertCircle size={48} className="mb-3 opacity-50" />
                      <div>No activities found matching your criteria</div>
                    </td>
                  </tr>
                ) : (
                  filteredActivityRecords.map((activity) => (
                    <tr 
                      key={activity.id}
                      onDoubleClick={() => {
                        setSelectedActivityRecord(activity);
                        setShowActivityTimelineModal(true);
                      }}
                      style={{
                        cursor: "pointer"
                      }}
                    >
                      <td>
                        <div>
                          <div className="fw-semibold text-dark">{activity.customer}</div>
                          {activity.tags.length > 0 && (
                            <div className="mt-1">
                              {activity.tags.map((tag, idx) => (
                                <Badge key={idx} bg="light" text="dark" className="me-1" style={{ fontSize: '0.7rem' }}>
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
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
                              // Get first two alphabetic characters from agent name
                              const alphabeticChars = activity.agent.replace(/[^a-zA-Z]/g, '');
                              const splittedArray = alphabeticChars.split(' ');
                              return [splittedArray[0][0], splittedArray?.[1]?.[0] || ''].join('').toUpperCase();
                            })()}
                           
                          </div>
                          <div className="small">{activity.agent}</div>
                        </div>
                      </td>
                      <td>
                        <div className="small text-uppercase">
                          {/* <div className="text-dark">{activity.lastActivity.split(' ')[0]}</div>
                          <div className="text-muted">{activity.lastActivity.split(' ')[1]}</div> */}
                          {activity.dateTime ? moment(activity.dateTime).format(GlobalDateFormat) : '-'}
                          <div className="text-muted">{activity.dateTime ? moment(activity.dateTime).format(GlobalTimeFormat) : ''}</div>
                        </div>
                      </td>
                      <td>
                        <Badge 
                          bg={
                            activity.type === 'Prospect' ? 'secondary' :
                            activity.type === 'Lead' ? 'primary' :
                            activity.type === 'Deal' ? 'success' :
                            'info'
                          }
                        >
                          {activity.type}
                        </Badge>
                      </td>
                      <td>
                        <div className="small fw-semibold">{activity.stage}</div>
                      </td>
                      <td>
                        <Button 
                         variant="link" 
                         size="sm" 
                         className="p-1" 
                          onClick={() => {
                            setSelectedActivityRecord(activity);
                            setShowActivityTimelineModal(true);
                          }}
                        >
                          <Eye size={16} className="me-1" />
                          
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          {/* Pagination Controls */}
          <div className="p-3 border-top">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Show</span>
                <Form.Select
                  size="sm"
                  value={pagination.per_page}
                  onChange={(e) => {
                    const newPerPage = Number(e.target.value);
                    setPagination(prev => ({ ...prev, per_page: newPerPage, current_page: 1 }));
                    fetchHistoryData(1, newPerPage);
                  }}
                  style={{ width: 'auto' }}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Form.Select>
                <span className="text-muted small">entries</span>
              </div>
              
              <div className="text-muted small">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} activities
              </div>

              <div className="d-flex gap-1">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  disabled={pagination.current_page === 1}
                  onClick={() => {
                    setPagination(prev => ({ ...prev, current_page: 1 }));
                    fetchHistoryData(1);
                  }}
                >
                  <ChevronsLeft size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  disabled={pagination.current_page === 1}
                  onClick={() => {
                    const newPage = pagination.current_page - 1;
                    setPagination(prev => ({ ...prev, current_page: newPage }));
                    fetchHistoryData(newPage);
                  }}
                >
                  <ChevronLeft size={14} />
                </Button>
                
                {[...new Array(pagination.last_page)].map((_, index) => {
                  const pageNum = index + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.last_page ||
                    (pageNum >= pagination.current_page - 1 && pageNum <= pagination.current_page + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={pagination.current_page === pageNum ? 'primary' : 'outline-secondary'}
                        onClick={() => {
                          setPagination(prev => ({ ...prev, current_page: pageNum }));
                          fetchHistoryData(pageNum);
                        }}
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if (pageNum === pagination.current_page - 2 || pageNum === pagination.current_page + 2) {
                    return <span key={pageNum} className="px-2">...</span>;
                  }
                  return null;
                })}
                
                <Button
                  size="sm"
                  variant="outline-secondary"
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() => {
                    const newPage = pagination.current_page + 1;
                    setPagination(prev => ({ ...prev, current_page: newPage }));
                    fetchHistoryData(newPage);
                  }}
                >
                  <ChevronRight size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() => {
                    setPagination(prev => ({ ...prev, current_page: pagination.last_page }));
                    fetchHistoryData(pagination.last_page);
                  }}
                >
                  <ChevronsRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
      </div>
    </ProtectedRoute>
  );
};

HistoryPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default HistoryPage;
