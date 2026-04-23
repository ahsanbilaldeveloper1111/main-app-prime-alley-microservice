import type { FilterPill } from '@components/GenericTable';
import {
    buildExtensionMultiSelectPillOption,
    createDateTimeDropdownContent,
    formatDateTimePillLabel,
    hierarchyItemIdString,
    hierarchyItemLabel,
    isExtensionFilterAllSelected,
} from './communicationsDateExtensionFilters';

type HierarchyListItem = { id: unknown; name?: unknown };

/** `useHierarchyData` types these arrays as `string[]` at compile time, but the API returns objects. */
type HierarchyListSource = ReadonlyArray<unknown>;

function asStringish(value: unknown, fallback: string): string {
    if (value == null) return fallback;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return fallback;
}

export function callDirectionActiveLabel(value: string): string {
    if (value === 'OUTGOING') return 'Outgoing';
    if (value === 'INCOMING') return 'Incoming';
    if (value === 'Both') return 'Both';
    return '';
}

export function callStatusActiveLabel(value: string): string {
    if (value === 'Answered') return 'Answered';
    if (value === 'Not Answered') return 'Not Answered';
    if (value === 'Both') return 'Both';
    return '';
}

export function buildCallDirectionFilterPill(
    currentFilters: Record<string, unknown>,
    applyFilters: (f: Record<string, unknown>) => void,
): FilterPill {
    return {
        id: 'call_direction',
        label: 'Call Direction',
        showDropdown: true,
        active: Boolean(currentFilters.call_direction),
        activeLabel: callDirectionActiveLabel(
            asStringish(currentFilters.call_direction, ''),
        ),
        onClear: () => applyFilters({ ...currentFilters, call_direction: '' }),
        dropdownOptions: [
            { label: 'Outgoing', value: 'OUTGOING', onClick: () => applyFilters({ ...currentFilters, call_direction: 'OUTGOING' }) },
            { label: 'Incoming', value: 'INCOMING', onClick: () => applyFilters({ ...currentFilters, call_direction: 'INCOMING' }) },
            { label: 'Both', value: 'Both', onClick: () => applyFilters({ ...currentFilters, call_direction: 'Both' }) },
        ],
    };
}

export function buildCallStatusFilterPill(
    currentFilters: Record<string, unknown>,
    applyFilters: (f: Record<string, unknown>) => void,
): FilterPill {
    return {
        id: 'call_status',
        label: 'Call Status',
        showDropdown: true,
        active: Boolean(currentFilters.call_status),
        activeLabel: callStatusActiveLabel(
            asStringish(currentFilters.call_status, ''),
        ),
        onClear: () => applyFilters({ ...currentFilters, call_status: '' }),
        dropdownOptions: [
            { label: 'Answered', value: 'Answered', onClick: () => applyFilters({ ...currentFilters, call_status: 'Answered' }) },
            { label: 'Not Answered', value: 'Not Answered', onClick: () => applyFilters({ ...currentFilters, call_status: 'Not Answered' }) },
            { label: 'Both', value: 'Both', onClick: () => applyFilters({ ...currentFilters, call_status: 'Both' }) },
        ],
    };
}

export function buildExtensionNumberMultiSelectFilterPill(
    extensionAllIds: string[],
    hierarchyDataExtensions: HierarchyListSource,
    currentFilters: Record<string, unknown>,
    applyFilters: (f: Record<string, unknown>) => void,
): FilterPill {
    return {
        id: 'extension_number',
        label: 'Extension',
        showDropdown: true,
        searchable: true,
        multiSelect: true,
        onSelectAll: () => {
            const allSelected = isExtensionFilterAllSelected(
                extensionAllIds,
                currentFilters.extension_number,
            );
            applyFilters({
                ...currentFilters,
                extension_number: allSelected ? [] : extensionAllIds,
            });
        },
        selectAllLabel: isExtensionFilterAllSelected(
            extensionAllIds,
            currentFilters.extension_number,
        )
            ? 'Deselect all'
            : 'Select all',
        active: Array.isArray(currentFilters.extension_number) && currentFilters.extension_number.length > 0,
        activeLabel: Array.isArray(currentFilters.extension_number) && currentFilters.extension_number.length > 0
            ? `${(currentFilters.extension_number as string[]).length} selected`
            : undefined,
        onClear: () => applyFilters({ ...currentFilters, extension_number: [] }),
        dropdownOptions: hierarchyDataExtensions.map((ext) =>
            buildExtensionMultiSelectPillOption(
                ext as HierarchyListItem,
                currentFilters,
                applyFilters,
            ),
        ),
    };
}

export function buildDepartmentFilterPill(
    hierarchyDataDepartments: HierarchyListSource,
    currentFilters: Record<string, unknown>,
    applyFilters: (f: Record<string, unknown>) => void,
): FilterPill {
    return {
        id: 'department',
        label: 'Department',
        showDropdown: true,
        searchable: true,
        active: Array.isArray(currentFilters.department) && currentFilters.department.length > 0,
        activeLabel: Array.isArray(currentFilters.department) && currentFilters.department.length > 0
            ? `${(currentFilters.department as string[]).length} selected`
            : undefined,
        onClear: () => applyFilters({ ...currentFilters, department: [] }),
        dropdownOptions: hierarchyDataDepartments.map((dept) => {
            const row = dept as HierarchyListItem;
            const idVal = hierarchyItemIdString(row);
            return {
                label: hierarchyItemLabel(row),
                value: idVal,
                onClick: () => applyFilters({
                    ...currentFilters,
                    department: [idVal],
                }),
            };
        }),
    };
}

type StartKey = 'start_datetime' | 'start_date';
type EndKey = 'end_datetime' | 'end_date';

export function buildStartDateTimeFilterPill(
    filterKey: StartKey,
    currentFilters: Record<string, unknown>,
    setCurrentFilters: (f: Record<string, unknown>) => void,
    applyFilters: (f: Record<string, unknown>) => void,
): FilterPill {
    const raw = currentFilters[filterKey] as string | undefined;
    return {
        id: filterKey,
        label: 'Start Date & Time',
        showDropdown: true,
        active: Boolean(currentFilters[filterKey]),
        activeLabel: formatDateTimePillLabel(raw, 'start'),
        activeLabelOnly: true,
        onClear: () => applyFilters({ ...currentFilters, [filterKey]: '' }),
        dropdownContent: createDateTimeDropdownContent(
            raw ?? '',
            (v) => setCurrentFilters({ ...currentFilters, [filterKey]: v }),
            (v) => applyFilters({ ...currentFilters, [filterKey]: v }),
            'start',
        ),
    };
}

export function buildEndDateTimeFilterPill(
    filterKey: EndKey,
    currentFilters: Record<string, unknown>,
    setCurrentFilters: (f: Record<string, unknown>) => void,
    applyFilters: (f: Record<string, unknown>) => void,
): FilterPill {
    const raw = currentFilters[filterKey] as string | undefined;
    return {
        id: filterKey,
        label: 'End Date & Time',
        showDropdown: true,
        active: Boolean(currentFilters[filterKey]),
        activeLabel: formatDateTimePillLabel(raw, 'end'),
        activeLabelOnly: true,
        onClear: () => applyFilters({ ...currentFilters, [filterKey]: '' }),
        dropdownContent: createDateTimeDropdownContent(
            raw ?? '',
            (v) => setCurrentFilters({ ...currentFilters, [filterKey]: v }),
            (v) => applyFilters({ ...currentFilters, [filterKey]: v }),
            'end',
        ),
    };
}
