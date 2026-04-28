import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { createGsmListFiltersConfig } from './filterConfigs';
import { useSession } from "next-auth/react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

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
      if (onExport && session?.user?.permissions?.includes(PERMISSIONS.EXPORT_CALL_LOGS)) {
        setShowExport(true);
      }
      if (session?.user?.permissions?.includes(PERMISSIONS.VIEW_CALL_LOGS_FILTERS)) {
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

