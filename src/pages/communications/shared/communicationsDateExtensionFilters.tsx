import React from 'react';
import { Button, Form } from 'react-bootstrap';
import moment from 'moment';

/**
 * `datetime-local` needs `YYYY-MM-DDTHH:mm` (or with seconds, trimmed to minutes for the control).
 * Accepts date-only, ISO strings, and existing local values from filter state.
 */
export function toDateTimeLocalInputValue(
    raw: string | undefined,
    variant: 'start' | 'end',
): string {
    if (raw == null || String(raw).trim() === '') return '';
    const t = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)) {
        return t;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(t)) {
        return t.slice(0, 16);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
        return variant === 'end' ? `${t}T23:59` : `${t}T00:00`;
    }
    const m = moment(t);
    return m.isValid() ? m.format('YYYY-MM-DDTHH:mm') : '';
}

export function formatDateTimePillLabel(
    raw: string | undefined,
    variant: 'start' | 'end',
): string | undefined {
    if (raw == null || String(raw).trim() === '') return undefined;
    const local = toDateTimeLocalInputValue(raw, variant);
    if (!local) {
        const m = moment(String(raw).trim());
        return m.isValid() ? m.format('MMM D, YYYY h:mm A') : undefined;
    }
    return moment(local, 'YYYY-MM-DDTHH:mm').format('MMM D, YYYY h:mm A');
}

/** Normalize UI datetime-local / date-only value to UTC `YYYY-MM-DDTHH:mm:ssZ` for API start bounds. */
export function formatStartDateValueForApi(value: string): string {
    let startMoment = moment(value);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
        startMoment = moment(`${value}:00`);
    } else if (!value.includes('T')) {
        startMoment = moment(value).startOf('day');
    }
    return startMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
}

/** Normalize UI datetime-local / date-only value to UTC `YYYY-MM-DDTHH:mm:ssZ` for API end bounds. */
export function formatEndDateValueForApi(value: string): string {
    let endMoment = moment(value);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
        const timePart = value.split('T')[1];
        if (timePart === '23:59') {
            endMoment = moment(`${value}:59`);
        } else {
            endMoment = moment(`${value}:00`);
        }
    } else if (!value.includes('T')) {
        endMoment = moment(value).endOf('day');
    }
    return endMoment.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
}

export interface DateTimeFilterMenuProps {
    value: string;
    onChange: (value: string) => void;
    onApply: (value: string) => void;
    closeMenu: () => void;
    /** 'start' = date-only maps to 00:00, 'end' = date-only maps to 23:59 (legacy). */
    variant: 'start' | 'end';
}

export const DateTimeFilterMenu: React.FC<DateTimeFilterMenuProps> = ({
    value,
    onChange,
    onApply,
    closeMenu,
    variant,
}) => {
    const inputValue = toDateTimeLocalInputValue(value, variant);
    return (
        <div className="d-flex flex-column gap-2" style={{ minWidth: 280 }}>
            <Form.Control
                size="sm"
                type="datetime-local"
                step={60}
                value={inputValue}
                onChange={(e) => onChange(e.target.value)}
            />
            <div className="d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" size="sm" onClick={closeMenu}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                        onApply(inputValue);
                        closeMenu();
                    }}
                >
                    Apply
                </Button>
            </div>
        </div>
    );
};

export function createDateTimeDropdownContent(
    value: string,
    onChange: (value: string) => void,
    onApply: (value: string) => void,
    variant: 'start' | 'end',
) {
    return function DateTimeDropdownRender({ closeMenu }: { closeMenu: () => void }) {
        return (
            <DateTimeFilterMenu
                value={value}
                onChange={onChange}
                onApply={onApply}
                closeMenu={closeMenu}
                variant={variant}
            />
        );
    };
}

type ExtensionEntity = { id: unknown; name?: unknown };

function primitiveString(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return null;
}

/** Display label for hierarchy rows (departments, extensions in simple dropdowns, etc.). */
export function hierarchyItemLabel(item: { id: unknown; name?: unknown }): string {
    return primitiveString(item.name) ?? primitiveString(item.id) ?? '';
}

export function hierarchyItemIdString(item: { id: unknown }): string {
    return primitiveString(item.id) ?? '';
}

function extensionPillId(ext: ExtensionEntity): string {
    return primitiveString(ext.id) ?? '';
}

function extensionPillLabel(ext: ExtensionEntity): string {
    return primitiveString(ext.name) ?? primitiveString(ext.id) ?? '';
}

export function buildExtensionMultiSelectPillOption(
    ext: ExtensionEntity,
    currentFilters: Record<string, unknown>,
    applyFilters: (f: Record<string, unknown>) => void,
) {
    const idStr = extensionPillId(ext);
    const selectedIds = Array.isArray(currentFilters.extension_number)
        ? (currentFilters.extension_number as string[]).map(String)
        : [];
    const isSelected = selectedIds.includes(idStr);
    return {
        label: extensionPillLabel(ext),
        value: idStr,
        selected: isSelected,
        onClick: () => {
            const next = isSelected
                ? selectedIds.filter((x) => x !== idStr)
                : [...selectedIds, idStr];
            applyFilters({ ...currentFilters, extension_number: next });
        },
    };
}

/** True when `extensionFilter` contains exactly every id in `allIds` (set equality). */
export function isExtensionFilterAllSelected(allIds: string[], extensionFilter: unknown): boolean {
    if (allIds.length === 0) return false;
    if (!Array.isArray(extensionFilter) || extensionFilter.length !== allIds.length) {
        return false;
    }
    const selected = new Set((extensionFilter as string[]).map(String));
    return allIds.every((id) => selected.has(id));
}
