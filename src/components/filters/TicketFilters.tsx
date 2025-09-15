import React, { useEffect, useState, useCallback, useMemo } from "react";
import GenericFilter from './GenericFilter';
import { createCallRecordingsFiltersConfig, createTicketFiltersConfig } from './filterConfigs';
import { useHierarchyData } from './useHierarchyData';
import { useSession } from "next-auth/react";
import { GetAllModules, GetAllSubmodules, GetAllSubmoduleChildren } from "@utils/ticket-module";
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
  const [submodules, setSubmodules] = useState([]);
  const [submoduleChildren, setSubmoduleChildren] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState<string | null>(null);
  
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

  // Fetch submodules when module changes
  useEffect(() => {
    const fetchSubmodules = async () => {
      if (selectedModuleId) {
        try {
          console.log('Fetching submodules for module:', selectedModuleId);
          const submodulesData = await GetAllSubmodules();
          const filteredSubmodules = submodulesData?.filter((sub: any) => sub.module_id == selectedModuleId) || [];
          console.log('Filtered submodules:', filteredSubmodules);
          setSubmodules(filteredSubmodules);
        } catch (error) {
          console.error('Failed to fetch submodules:', error);
        }
      } else {
        console.log('No module selected, clearing submodules');
        setSubmodules([]);
      }
    };

    if (status === 'authenticated') {
      fetchSubmodules();
    }
  }, [status, selectedModuleId]);

  // Fetch submodule children when submodule changes
  useEffect(() => {
    const fetchSubmoduleChildren = async () => {
      if (selectedSubmoduleId) {
        try {
          console.log('Fetching submodule children for submodule:', selectedSubmoduleId);
          const childrenData = await GetAllSubmoduleChildren();
          const filteredChildren = childrenData?.filter((child: any) => child.submodule_id == selectedSubmoduleId) || [];
          console.log('Filtered submodule children:', filteredChildren);
          setSubmoduleChildren(filteredChildren);
        } catch (error) {
          console.error('Failed to fetch submodule children:', error);
        }
      } else {
        console.log('No submodule selected, clearing submodule children');
        setSubmoduleChildren([]);
      }
    };

    if (status === 'authenticated') {
      fetchSubmoduleChildren();
    }
  }, [status, selectedSubmoduleId]);

  // Handle immediate filter changes for cascading logic (module → submodule → submodule child)
  const handleFilterChange = useCallback((filters: Record<string, any>) => {
    console.log('Immediate filter change detected:', filters);
    console.log('Current state - Module:', selectedModuleId, 'Submodule:', selectedSubmoduleId);
    
    // Update module selection
    if (filters.module_id !== selectedModuleId) {
      console.log('Module changed from', selectedModuleId, 'to', filters.module_id);
      setSelectedModuleId(filters.module_id || null);
      setSelectedSubmoduleId(null);
      setSubmoduleChildren([]);
    }
    
    // Update submodule selection
    if (filters.submodule_id !== selectedSubmoduleId) {
      console.log('Submodule changed from', selectedSubmoduleId, 'to', filters.submodule_id);
      setSelectedSubmoduleId(filters.submodule_id || null);
    }
    
    // Handle filter clearing
    if (Object.keys(filters).length === 0) {
      console.log('Filters cleared, resetting all states');
      setSelectedModuleId(null);
      setSelectedSubmoduleId(null);
      setSubmodules([]);
      setSubmoduleChildren([]);
    }
    
    // Note: We don't call onFiltersChange here since this is for immediate updates only
    // The actual API call will happen when the user clicks Apply or when onFiltersChange is called
  }, [selectedModuleId, selectedSubmoduleId]);

  // Create dynamic filter config with hierarchy data, modules, statuses, and types
  const ticketConfig = useMemo(() => createTicketFiltersConfig({
    departments: hierarchyDataDepartments,
    extensions: hierarchyDataExtensions,
    users: hierarchyDataUsers,
    modules: modules,
    statuses: statuses,
    types: types,
    submodules: submodules,
    submoduleChildren: submoduleChildren
  }), [
    hierarchyDataDepartments,
    hierarchyDataExtensions,
    hierarchyDataUsers,
    modules,
    statuses,
    types,
    submodules,
    submoduleChildren
  ]);

  // Debug: Log when ticketConfig changes
  useEffect(() => {
    console.log('TicketConfig updated:', {
      modules: modules.length,
      submodules: submodules.length,
      submoduleChildren: submoduleChildren.length,
      selectedModuleId,
      selectedSubmoduleId
    });
  }, [ticketConfig, modules.length, submodules.length, submoduleChildren.length, selectedModuleId, selectedSubmoduleId]);

  // Debug: Log when dependencies change
  useEffect(() => {
    console.log('Dependencies changed:', {
      selectedModuleId,
      selectedSubmoduleId,
      submodulesCount: submodules.length,
      submoduleChildrenCount: submoduleChildren.length
    });
  }, [selectedModuleId, selectedSubmoduleId, submodules.length, submoduleChildren.length]);

  
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
    return <div></div>;
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
      onFiltersChangeImmediate={handleFilterChange}
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

