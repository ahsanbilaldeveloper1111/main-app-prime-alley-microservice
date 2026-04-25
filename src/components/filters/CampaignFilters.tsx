import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { createCampaignFiltersConfig } from './filterConfigs';
import { useSession } from "next-auth/react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

interface CampaignFiltersProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
}

export default function CampaignFilters({ onFiltersChange, onExport }: CampaignFiltersProps) {
  const { data: session, status } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      // Only show export if onExport prop is provided and user has permission
      if (onExport && session?.user?.permissions?.includes(PERMISSIONS.EXPORT_CRM)) {
        setShowExport(true);
      }
      setShowFilters(true);
    }
  }, [status, session, onExport]);

  // Create campaign filter config
  const campaignConfig = createCampaignFiltersConfig();

  return (
    <GenericFilter
      tabs={campaignConfig}
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
