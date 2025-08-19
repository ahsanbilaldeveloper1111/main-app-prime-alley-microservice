import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { createGsmListFiltersConfig } from './filterConfigs';
import { useSession } from "next-auth/react";

interface GsmListFilterProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
}

export default function GsmListFilter({ onFiltersChange, onExport }: GsmListFilterProps) {
  const { data: session, status } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  
  // Create dynamic filter config with hierarchy data
  const gsmListConfig = createGsmListFiltersConfig();
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Only show export if onExport prop is provided and user has permission
      if (onExport && session?.user?.permissions?.includes('export-call-logs')) {
        setShowExport(true);
      }
      if (session?.user?.permissions?.includes('filters-call-logs')) {
        setShowFilters(true);
      }
    }
  }, [status, session, onExport]);

 

  return (
    <GenericFilter
      tabs={gsmListConfig}
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

