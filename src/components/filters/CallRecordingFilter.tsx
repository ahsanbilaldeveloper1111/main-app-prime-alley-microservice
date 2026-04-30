import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { createCallRecordingsFiltersConfig } from './filterConfigs';
import { useHierarchyData } from './useHierarchyData';
import { useSession } from "next-auth/react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { hasCallRecordingsExportPermission } from "@utils/callPermissionUtils";

const { PERMISSIONS } = HEADER_CONSTANTS;

interface GroupsFiltersProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
  isVisibleCallDirection?: boolean;
  moduleSlug?: string;
}

export default function GroupsFilters({ onFiltersChange, onExport, isVisibleCallDirection = true, moduleSlug }: GroupsFiltersProps) {
  const { data: session, status } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Use the hierarchy data hook
  const { 
    hierarchyDataDepartments, 
    hierarchyDataExtensions,
    hierarchyDataUsers,
    loading: hierarchyLoading, 
    error: hierarchyError 
  } = useHierarchyData(moduleSlug);
  // Create dynamic filter config with hierarchy data
  const callRecordingsConfig = createCallRecordingsFiltersConfig({
    departments: hierarchyDataDepartments,
    extensions: hierarchyDataExtensions,
    users: hierarchyDataUsers
  }, isVisibleCallDirection);
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Only show export if onExport prop is provided and user has permission
      if (onExport && hasCallRecordingsExportPermission(session?.user?.permissions)) {
        setShowExport(true);
      }
      if (session?.user?.permissions?.includes(PERMISSIONS.VIEW_CALL_RECORDINGS_FILTERS)) {
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
      tabs={callRecordingsConfig}
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

