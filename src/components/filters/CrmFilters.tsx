import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { createCrmFiltersConfig } from './filterConfigs';
import { useSession } from "next-auth/react";
import {
  CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
  getStages,
  getCampaigns,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug } from "@utils/Helper";

interface CrmFiltersProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
  type?: any;
}

export default function CrmFilters({ onFiltersChange, onExport, type }: CrmFiltersProps) {
  const { data: session, status } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  // Static tags data
  const staticTags = [
    { value: "hot-lead", label: "Hot Lead" },
    { value: "cold-lead", label: "Cold Lead" },
    { value: "follow-up", label: "Follow Up" },
    { value: "interested", label: "Interested" },
    { value: "not-interested", label: "Not Interested" },
    { value: "callback", label: "Callback" },
    { value: "qualified", label: "Qualified" },
    { value: "unqualified", label: "Unqualified" },
  ];

  // Fetch data for filter options
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [stagesData, campaignsData, hierarchyData] = await Promise.all([
          getStages(type),
          getCampaigns({
            per_page: 1000,
            filters: CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
          }),
          GetHierarchyData(type === 'lead' ? ModuleSlug.CRM_LEADS : ModuleSlug.CRM_OPPORTUNITIES)
        ]);
        
        setStages(stagesData || []);
        setCampaigns(campaignsData?.data || []);
        setExtensions(hierarchyData?.extensions || []);
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, type]);

  // Create dynamic filter config with all data
  const crmConfig = createCrmFiltersConfig(stages, campaigns, extensions, staticTags);
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Only show export if onExport prop is provided and user has permission
      if (onExport && session?.user?.permissions?.includes('export-crm')) {
        setShowExport(true);
      }
      // if (session?.user?.permissions?.includes('filters-crm')) {
        setShowFilters(true);
      // }
    }
  }, [status, session, onExport]);

  // Show loading state while stages data is being fetched
  if (loading) {
    return <div></div>;
  }

  // Show error state if stages data failed to load
  if (error) {
    console.error('Failed to load stages data:', error);
    // Fall back to default config without stages data
  }

  return (
    <GenericFilter
      tabs={crmConfig}
      onFiltersChange={onFiltersChange}
      showFilters={showFilters}
      onExport={onExport}
      showExport={false}
      exportOptions={[
        { label: 'Excel', value: 'excel' },
        { label: 'PDF', value: 'pdf' }
      ]}
    />
  );
}
