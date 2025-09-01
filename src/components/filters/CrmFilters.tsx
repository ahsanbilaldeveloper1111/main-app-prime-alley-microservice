import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { createCrmFiltersConfig } from './filterConfigs';
import { useSession } from "next-auth/react";
import { getStages } from "@utils/crm";

interface CrmFiltersProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
}

export default function CrmFilters({ onFiltersChange, onExport }: CrmFiltersProps) {
  const { data: session, status } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  // Fetch stages for filter options
  useEffect(() => {
    const fetchStages = async () => {
      try {
        setLoading(true);
        const stagesData = await getStages();
        setStages(stagesData || []);
      } catch (error) {
        console.error('Failed to fetch stages:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchStages();
    }
  }, [status]);

  // Create dynamic filter config with stages data
  const crmConfig = createCrmFiltersConfig(stages);
  
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
    return <div>Loading filters...</div>;
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
