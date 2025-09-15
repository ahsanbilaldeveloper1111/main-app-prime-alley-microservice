import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { createCrmDataFiltersConfig } from './filterConfigs';
import { useSession } from "next-auth/react";
import { getCampaigns } from "@utils/crm";
import { GetHierarchyData } from "@utils/users";

interface CrmDataFiltersProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
}

export default function CrmDataFilters({ onFiltersChange, onExport }: CrmDataFiltersProps) {
  const { data: session, status } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
        const [campaignsData, hierarchyData] = await Promise.all([
          getCampaigns(),
          GetHierarchyData()
        ]);
        
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
  }, [status]);

  // Create dynamic filter config with all data
  const crmDataConfig = createCrmDataFiltersConfig(campaigns, extensions, staticTags);
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Only show export if onExport prop is provided and user has permission
      if (onExport && session?.user?.permissions?.includes('export-crm-data')) {
        setShowExport(true);
      }
      // Show filters for CRM data
      setShowFilters(true);
    }
  }, [status, session, onExport]);

  // Show loading state while data is being fetched
  if (loading) {
    return <div></div>;
  }

  // Show error state if data failed to load
  if (error) {
    console.error('Failed to load filter data:', error);
    // Fall back to default config without data
  }

  return (
    <GenericFilter
      tabs={crmDataConfig}
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
