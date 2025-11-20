import { useState, useCallback, useMemo } from 'react';
import { getAllUsers } from '@utils/users';
import { Column } from '@components/CustomDataTable';
import { SummaryCard } from '@components/PageSummaryGrid';

interface Summary {
    users: number;
    departments: number;
    ranks: number;
    groups: number;
    activeUsers: number;
}

export const useUsersData = (session: any, initialBaseColumns: Column[]) => {
    const [customFieldColumns, setCustomFieldColumns] = useState<Column[]>([]);
    const [currentFilters, setCurrentFilters] = useState({});
    const [summary, setSummary] = useState<Summary>({
        users: 0,
        departments: 0,
        ranks: 0,
        groups: 0,
        activeUsers: 0
    });

    const fetchUsers = useCallback(
        async (page = 1, perPage = 15, search = "") => {
            const response = await getAllUsers({ page, perPage, search, filters: currentFilters });
            
            // Derive dynamic custom-field columns from the returned rows
            try {
                const rows = response?.dataList || [];
                
                if (Array.isArray(rows)) { 
                    const baseKeysLower = new Set(initialBaseColumns.map((c: Column) => c.key.toLowerCase()));
                    const seen = new Set<string>();
                    const dynamicCols: Column[] = [];

                    rows.forEach((row: any) => {
                        const fields = Array.isArray(row?.custom_fields) ? row.custom_fields : [];
                        fields.forEach((f: any) => {
                            const fieldNameRaw = f?.field_name;
                            const fieldName = typeof fieldNameRaw === 'string' ? fieldNameRaw.trim() : '';
                            if (!fieldName) return;
                            const normalized = fieldName.toLowerCase();
                            if (baseKeysLower.has(normalized)) return;
                            if (seen.has(normalized)) return;
                            seen.add(normalized);

                            dynamicCols.push({
                                key: fieldName,
                                name: fieldName,
                                sortable: true,
                                selector: (r: any) => {
                                    const cf = (Array.isArray(r?.custom_fields) ? r.custom_fields : []).find((x: any) => String(x?.field_name).trim() === fieldName);
                                    return cf?.field_value ?? '';
                                },
                            });
                        });
                    });

                    setCustomFieldColumns(dynamicCols);
                } else {
                    setCustomFieldColumns([]);
                }
            } catch (error) {
                setCustomFieldColumns([]);
            }

            setSummary({
                users: response?.summary?.users,
                departments: response?.summary?.departments,
                ranks: response?.summary?.ranks,
                groups: response?.summary?.groups,
                activeUsers: response?.summary?.activeUserPercentage
            });
            return response;
        },
        [session, currentFilters, initialBaseColumns]
    );

    const handleFiltersChange = (filters: any) => {
        setCurrentFilters(filters);
    };

    // Create cards data for PageSummaryGrid
    const summaryCards: SummaryCard[] = useMemo(() => [
        {
            id: 'total-users',
            title: 'Total Users',
            value: summary?.users || 0,
            description: 'Total users currently in the system',
            delay: 0.1,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'departments',
            title: 'Departments',
            value: summary?.departments || 0,
            description: 'Total departments currently in the system',
            delay: 0.3,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'ranks',
            title: 'Ranks',
            value: summary?.ranks || 0,
            description: 'The ranks were created by you within the system',
            delay: 0.5,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        },
        {
            id: 'groups',
            title: 'Groups',
            value: summary?.groups || 0,
            description: 'The groups were created by you within the system',
            delay: 0.7,
            showAnimatedNumber: true,
            animationDuration: 1000,
            fontStyle: 'style-2'
        }
    ], [summary]);

    return {
        customFieldColumns,
        currentFilters,
        summary,
        fetchUsers,
        handleFiltersChange,
        summaryCards
    };
};

