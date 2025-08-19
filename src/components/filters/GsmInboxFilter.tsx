import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { createGsmInboxFiltersConfig } from './filterConfigs';
import { useGsmCompanies } from './GsmCompanies';
import { useSession } from "next-auth/react";

interface GsmInboxFilterProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
}

export default function GsmInboxFilter({ onFiltersChange, onExport }: GsmInboxFilterProps) {
  const { data: session, status } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Use the hierarchy data hook
  const { 
      dataGsm,
      dataCompany,
    loading: hierarchyLoading, 
    error: hierarchyError 
  } = useGsmCompanies();
  
  // Create dynamic filter config with hierarchy data
  const gsmInboxConfig = createGsmInboxFiltersConfig({
    gsm: dataGsm,
    company: dataCompany
  });
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Only show export if onExport prop is provided and user has permission
      if (onExport && session?.user?.permissions?.includes('export-gsm-assignment')) {
        setShowExport(true);
      }
      if (session?.user?.permissions?.includes('filters-gsm-assignment')) {
        setShowFilters(true);
      }
    }
  }, [status, session, onExport]);

  // Show loading state while hierarchy data is being fetched
  if (hierarchyLoading) {
    return <div></div>;
  }

  // Show error state if hierarchy data failed to load
  if (hierarchyError) {
    console.error('Failed to load hierarchy data:', hierarchyError);
    // Fall back to default config without hierarchy data
  }

  return (
    <GenericFilter
      tabs={gsmInboxConfig}
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

