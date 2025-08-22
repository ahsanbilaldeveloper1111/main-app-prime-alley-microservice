import React, { useEffect, useState } from "react";
import GenericFilter from './GenericFilter';
import { createCallRecordingsFiltersConfig, createTicketFiltersConfig } from './filterConfigs';
import { useHierarchyData } from './useHierarchyData';
import { useSession } from "next-auth/react";
import { GetAllModules } from "@utils/ticket-module";
import { GetAllStatuses } from "@utils/ticket-statuses";
import { GetAllTypes } from "@utils/ticket-types";

interface GroupsFiltersProps {
  onFiltersChange?: (filters: Record<string, any>) => void;
  onExport?: (exportType: string, filters: Record<string, any>) => void;
  isVisibleCallDirection?: boolean;
}

export default function GroupsFilters({ onFiltersChange, onExport, isVisibleCallDirection = true }: GroupsFiltersProps) {
  const { data: session, status } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [modules, setModules] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [types, setTypes] = useState([]);
  
  // Use the hierarchy data hook
  const { 
    hierarchyDataDepartments, 
    hierarchyDataExtensions,
    hierarchyDataUsers,
    loading: hierarchyLoading, 
    error: hierarchyError 
  } = useHierarchyData();

  // Fetch modules data
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const modulesData = await GetAllModules();
        if (modulesData) {
          setModules(modulesData);
        }
      } catch (error) {
        console.error('Failed to fetch modules:', error);
      }
    };

    if (status === 'authenticated') {
      fetchModules();
    }
  }, [status]);

  // Fetch statuses data
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const statusesData = await GetAllStatuses();
        if (statusesData) {
          setStatuses(statusesData);
        }
      } catch (error) {
        console.error('Failed to fetch statuses:', error);
      }
    };

    if (status === 'authenticated') {
      fetchStatuses();
    }
  }, [status]);

  // Fetch types data
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const typesData = await GetAllTypes();
        if (typesData) {
          setTypes(typesData);
        }
      } catch (error) {
        console.error('Failed to fetch types:', error);
      }
    };

    if (status === 'authenticated') {
      fetchTypes();
    }
  }, [status]);

  // Create dynamic filter config with hierarchy data, modules, statuses, and types
  const ticketConfig = createTicketFiltersConfig({
    departments: hierarchyDataDepartments,
    extensions: hierarchyDataExtensions,
    users: hierarchyDataUsers,
    modules: modules,
    statuses: statuses,
    types: types
  });

  
  useEffect(() => {
    if (status === 'authenticated') {
      // Only show export if onExport prop is provided and user has permission
      if (onExport && session?.user?.permissions?.includes('export-call-recordings')) {
        setShowExport(true);
      }
      //if (session?.user?.permissions?.includes('filters-call-recordings')) {
        setShowFilters(true);
      //}
    }
  }, [status, session, onExport]);

  // Show loading state while hierarchy data is being fetched
  if (hierarchyLoading) {
    return <div>Loading filters...</div>;
  }

  // Show error state if hierarchy data failed to load
  if (hierarchyError) {
    console.error('Failed to load hierarchy data:', hierarchyError);
    // Fall back to default config without hierarchy data
  }

  return (
    <GenericFilter
      tabs={ticketConfig}
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

