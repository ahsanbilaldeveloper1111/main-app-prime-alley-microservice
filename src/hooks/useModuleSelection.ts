import { useState, useMemo, useEffect } from 'react';
import { MultiValue } from 'react-select';
import { Module } from '@typings/controlhub/users';
import { GetModules } from '@utils/users';
import { ModuleSlug } from '@utils/Helper';

interface ModuleOption {
    value: string;
    label: string;
}

interface UseModuleSelectionProps {
    filteredModules?: Module[];
    session?: any;
    excludeModules?: Module[];
}

interface UseModuleSelectionReturn {
    selectedModules: string[];
    handleModuleChange: (selectedOptions: MultiValue<ModuleOption>) => void;
    moduleOptions: ModuleOption[];
    moduleValue: ModuleOption[];
    resetModules: () => void;
    isAllSelected: boolean;
    isLoadingModules?: boolean;
}

export const useModuleSelection = (
    filteredModulesOrSession?: Module[] | any,
    excludeModules?: Module[]
): UseModuleSelectionReturn => {
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [allModules, setAllModules] = useState<Module[]>([]);
    const [isLoadingModules, setIsLoadingModules] = useState<boolean>(false);

    // Determine if first param is filteredModules array or session object
    const isFilteredModulesArray = Array.isArray(filteredModulesOrSession);
    const filteredModules = isFilteredModulesArray ? filteredModulesOrSession as Module[] : undefined;
    const session = !isFilteredModulesArray ? filteredModulesOrSession : undefined;
    const excludeModulesList = excludeModules || [];

    // Fetch and filter modules if session is provided
    useEffect(() => {
        if (session && !filteredModules) {
            const fetchModules = async () => {
                setIsLoadingModules(true);
                try {
                    const modules = await GetModules();
                    if (modules && Array.isArray(modules)) {
                        setAllModules(modules);
                    }
                } catch (error) {
                    console.error('Error fetching modules:', error);
                    setAllModules([]);
                } finally {
                    setIsLoadingModules(false);
                }
            };
            fetchModules();
        }
    }, [session, filteredModules]);

    // Compute final filtered modules list
    const finalFilteredModules = useMemo(() => {
        if (filteredModules) {
            // Use provided filteredModules (backward compatibility)
            return filteredModules;
        }
        
        if (allModules.length > 0) {
            // Filter out excluded modules (already assigned)
            const excludedIds = new Set(excludeModulesList.map(m => m.id));
            return allModules.filter(module => !excludedIds.has(module.id));
        }
        
        return [];
    }, [filteredModules, allModules, excludeModulesList]);

    const handleModuleChange = (selectedOptions: MultiValue<ModuleOption>) => {
        const values = (selectedOptions || []).map((opt) => opt.value);
        if (values.includes('all')) {
            const allModuleIds = finalFilteredModules.map(module => module.id.toString());
            setSelectedModules(allModuleIds);
        } else {
            setSelectedModules(values);
        }
    };

    const moduleOptions = useMemo(() => {
        return [
            { value: 'all', label: 'All Modules' },
            ...finalFilteredModules.map((module) => ({
                value: module.id.toString(),
                label: `${module.name}`
            }))
        ];
    }, [finalFilteredModules]);

    const moduleValue = useMemo(() => {
        const allModuleIds = finalFilteredModules.map(module => module.id.toString());
        const isAllSelected = allModuleIds.length > 0 && allModuleIds.every(id => selectedModules.includes(id));

        if (isAllSelected) {
            return [{ value: 'all', label: 'All Modules' }];
        } else {
            return finalFilteredModules
                .filter((m) => selectedModules.includes(m.id.toString()))
                .map((m) => ({ value: m.id.toString(), label: `${m.name}` }));
        }
    }, [finalFilteredModules, selectedModules]);

    const isAllSelected = useMemo(() => {
        const allModuleIds = finalFilteredModules.map(module => module.id.toString());
        return allModuleIds.length > 0 && allModuleIds.every(id => selectedModules.includes(id));
    }, [finalFilteredModules, selectedModules]);

    const resetModules = () => {
        setSelectedModules([]);
    };

    return {
        selectedModules,
        handleModuleChange,
        moduleOptions,
        moduleValue,
        resetModules,
        isAllSelected,
        ...(session ? { isLoadingModules } : {})
    };
};

