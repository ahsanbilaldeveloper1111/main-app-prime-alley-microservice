import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { groupFiltersConfig } from './filterConfigs';
import { useSession } from "next-auth/react";

interface GroupsFiltersProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
}

export default function GroupsFilters({ onFiltersChange, onExport }: GroupsFiltersProps) {
  const { data: session, status } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Only show export if onExport prop is provided and user has permission
      if (onExport && session?.user?.permissions?.includes('export-groups')) {
        setShowExport(true);
      }
      if (session?.user?.permissions?.includes('filters-groups')) {
        setShowFilters(true);
      }
    }
  }, [status, session, onExport]);

  return (
    <GenericFilter
      tabs={groupFiltersConfig}
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

