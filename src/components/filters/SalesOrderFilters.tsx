import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { createSalesOrderFiltersConfig } from './filterConfigs';
import { useSession } from "next-auth/react";
import { listOrderStages } from "@utils/sales";

interface SalesOrderFiltersProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
}

export default function SalesOrderFilters({ onFiltersChange, onExport }: SalesOrderFiltersProps) {
  const { data: session, status } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  // Fetch order stages for filter options
  useEffect(() => {
    const fetchStages = async () => {
      try {
        setLoading(true);
        const stagesData = await listOrderStages();
        setStages(stagesData || []);
      } catch (error) {
        console.error('Failed to fetch order stages:', error);
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
  const salesOrderConfig = createSalesOrderFiltersConfig(stages);
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Only show export if onExport prop is provided and user has permission
      setShowFilters(true);
    }
  }, [status, session, onExport]);

  // Show loading state while stages data is being fetched
  if (loading) {
    return <div></div>;
  }

  // Show error state if stages data failed to load
  if (error) {
    console.error('Failed to load order stages data:', error);
    // Fall back to default config without stages data
  }

  console.log('SalesOrderFilters rendering with config:', salesOrderConfig);
  console.log('SalesOrderFilters onFiltersChange:', onFiltersChange);
  
  return (
    <GenericFilter
      tabs={salesOrderConfig}
      onFiltersChange={onFiltersChange}
      showFilters={showFilters}
      onExport={onExport}
      showExport={showExport}
      exportOptions={[
        { label: 'Excel', value: 'excel' },
        { label: 'PDF', value: 'pdf' }
      ]}
    />
  );
}
