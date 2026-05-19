import { useMemo, type Dispatch, type SetStateAction } from "react";
import moment from "moment";
import { Button, Form } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import type { FilterPill } from "@components/GenericTable";
import type { StylesConfig } from "react-select";
import { CRM_REACT_SELECT_MENU_PORTAL_Z_INDEX } from "@utils/crmReactSelectMenuPortalProps";

/** Sidebar filter slice advanced pills read/write (matches useCrmListFiltersMetricsHistoryState pageFilters). */
export type CrmListPageSidebarFilters = {
  assignedTo: string | null;
  campaigns: string[] | null;
  nextCallDateFrom: string | null;
  nextCallDateTo: string | null;
  sourceFile: string | null;
  tags: string[] | null;
};

type CampaignOption = { value: string; label: string };
type TagOption = { value: string; label: string };
type SourceOption = { value: string; label: string };

function normalizeIdList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value as string[];
  }
  if (value) {
    return [value as string];
  }
  return [];
}

function formatScheduleDay(value: string, longYear: boolean) {
  if (!moment(value).isValid()) {
    return String(value);
  }
  return longYear
    ? moment(value).format("MMM D, YYYY")
    : moment(value).format("MMM D");
}

function buildNextCallRangeLabel(nextFrom: string, nextTo: string): string | undefined {
  if (!nextFrom && !nextTo) return undefined;
  if (nextFrom && nextTo && nextFrom === nextTo) {
    return formatScheduleDay(nextFrom, true);
  }
  const fromLabel = nextFrom ? formatScheduleDay(nextFrom, false) : "…";
  const toLabel = nextTo ? formatScheduleDay(nextTo, false) : "…";
  return `${fromLabel} – ${toLabel}`;
}

export type UseCrmListAdvancedFilterPillsParams = {
  currentFilters: Record<string, any>;
  applyTableFiltersPatch: (patch: Record<string, any>) => void;
  setPageFilters: Dispatch<SetStateAction<CrmListPageSidebarFilters>>;
  availableCampaigns: CampaignOption[];
  availableTags: TagOption[];
  uniqueSources: readonly SourceOption[];
  /** Same object as `crmListPageReactSelectStyles` from list pages. */
  customSelectStyles: StylesConfig<unknown, boolean>;
};

const ADVANCED_FILTER_MENU_PORTAL =
  typeof document === "undefined" ? null : document.body;

function withMenuPortalStyles<T>(
  base: StylesConfig<unknown, boolean>,
): StylesConfig<T, boolean> {
  return {
    ...(base as StylesConfig<T, boolean>),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: CRM_REACT_SELECT_MENU_PORTAL_Z_INDEX,
    }),
  };
}

/**
 * Advanced filter toolbar pills (campaigns, source, tags, next call date) shared by CRM list pages.
 */
export function useCrmListAdvancedFilterPills({
  currentFilters,
  applyTableFiltersPatch,
  setPageFilters,
  availableCampaigns,
  availableTags,
  uniqueSources,
  customSelectStyles,
}: UseCrmListAdvancedFilterPillsParams): FilterPill[] {
  return useMemo(() => {
    const campaignIds = normalizeIdList(currentFilters.campaign_id);
    const selectedCampaignOptions = availableCampaigns.filter((c) =>
      campaignIds.includes(c.value),
    );

    const tagValues = normalizeIdList(currentFilters.tags);
    const selectedTagOptions = availableTags.filter((t) =>
      tagValues.includes(t.value),
    );

    const sourceValue = currentFilters.source_file ?? null;
    const nextFrom = currentFilters.scheduled_call_from ?? "";
    const nextTo = currentFilters.scheduled_call_to ?? "";
    const nextCallLabel = buildNextCallRangeLabel(nextFrom, nextTo);

    return [
      {
        id: "campaigns",
        label: "Campaigns",
        showDropdown: true,
        active: campaignIds.length > 0,
        activeLabel:
          campaignIds.length > 1
            ? `${campaignIds.length} selected`
            : selectedCampaignOptions[0]?.label,
        onClear: () => {
          setPageFilters((prev) => ({ ...prev, campaigns: null }));
          applyTableFiltersPatch({ campaign_id: undefined });
        },
        dropdownContent: (
          <div style={{ minWidth: 280 }}>
            <Select
              isMulti
              options={availableCampaigns}
              value={selectedCampaignOptions}
              onChange={(selected) => {
                const values = selected
                  ? (selected as CampaignOption[]).map((s) => s.value)
                  : null;
                setPageFilters((prev) => ({ ...prev, campaigns: values }));
                applyTableFiltersPatch({ campaign_id: values });
              }}
              placeholder="Select campaigns..."
              menuPosition="fixed"
              menuPortalTarget={ADVANCED_FILTER_MENU_PORTAL ?? undefined}
              styles={withMenuPortalStyles<CampaignOption>(
                customSelectStyles,
              ) as StylesConfig<CampaignOption, true>}
              isClearable
            />
            <div className="d-flex justify-content-end mt-2">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  setPageFilters((prev) => ({ ...prev, campaigns: null }));
                  applyTableFiltersPatch({ campaign_id: undefined });
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        ),
      },
      {
        id: "source_file",
        label: "Source",
        showDropdown: true,
        active: !!sourceValue,
        activeLabel: sourceValue ? String(sourceValue) : undefined,
        onClear: () => {
          setPageFilters((prev) => ({ ...prev, sourceFile: null }));
          applyTableFiltersPatch({ source_file: undefined });
        },
        dropdownContent: (
          <div style={{ minWidth: 280 }}>
            <CreatableSelect<SourceOption>
              options={[...uniqueSources]}
              value={
                sourceValue
                  ? { value: sourceValue, label: String(sourceValue) }
                  : null
              }
              onChange={(selected) => {
                const v = selected ? selected.value : null;
                setPageFilters((prev) => ({ ...prev, sourceFile: v }));
                applyTableFiltersPatch({ source_file: v });
              }}
              placeholder="Select or type a source..."
              menuPosition="fixed"
              menuPortalTarget={ADVANCED_FILTER_MENU_PORTAL ?? undefined}
              styles={withMenuPortalStyles<SourceOption>(
                customSelectStyles,
              ) as StylesConfig<SourceOption, false>}
              isClearable
            />
            <div className="d-flex justify-content-end mt-2">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  setPageFilters((prev) => ({ ...prev, sourceFile: null }));
                  applyTableFiltersPatch({ source_file: undefined });
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        ),
      },
      {
        id: "tags",
        label: "Tags",
        showDropdown: true,
        active: tagValues.length > 0,
        activeLabel:
          tagValues.length > 1
            ? `${tagValues.length} selected`
            : selectedTagOptions[0]?.label,
        onClear: () => {
          setPageFilters((prev) => ({ ...prev, tags: null }));
          applyTableFiltersPatch({ tags: undefined });
        },
        dropdownContent: (
          <div style={{ minWidth: 280 }}>
            <Select
              isMulti
              options={availableTags.map((t) => ({
                value: t.value,
                label: t.label,
              }))}
              value={selectedTagOptions.map((t) => ({
                value: t.value,
                label: t.label,
              }))}
              onChange={(selected) => {
                const values = selected
                  ? (selected as TagOption[]).map((s) => s.value)
                  : null;
                setPageFilters((prev) => ({ ...prev, tags: values }));
                applyTableFiltersPatch({ tags: values });
              }}
              placeholder="Select tags..."
              menuPosition="fixed"
              menuPortalTarget={ADVANCED_FILTER_MENU_PORTAL ?? undefined}
              styles={withMenuPortalStyles<TagOption>(
                customSelectStyles,
              ) as StylesConfig<TagOption, true>}
              isClearable
            />
            <div className="d-flex justify-content-end mt-2">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  setPageFilters((prev) => ({ ...prev, tags: null }));
                  applyTableFiltersPatch({ tags: undefined });
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        ),
      },
      {
        id: "next_call",
        label: "Next Call Date",
        showDropdown: true,
        active: !!nextFrom || !!nextTo,
        activeLabel: nextCallLabel,
        onClear: () => {
          setPageFilters((prev) => ({
            ...prev,
            nextCallDateFrom: null,
            nextCallDateTo: null,
          }));
          applyTableFiltersPatch({
            scheduled_call_from: undefined,
            scheduled_call_to: undefined,
          });
        },
        dropdownContent: (
          <div style={{ minWidth: 280 }}>
            <div className="d-flex gap-2">
              <div className="flex-grow-1">
                <Form.Label className="small fw-bold mb-1">From</Form.Label>
                <Form.Control
                  type="date"
                  value={currentFilters.scheduled_call_from || ""}
                  onChange={(e) => {
                    const v = e.target.value || null;
                    setPageFilters((prev) => ({
                      ...prev,
                      nextCallDateFrom: v,
                    }));
                    applyTableFiltersPatch({ scheduled_call_from: v });
                  }}
                />
              </div>
              <div className="flex-grow-1">
                <Form.Label className="small fw-bold mb-1">To</Form.Label>
                <Form.Control
                  type="date"
                  value={currentFilters.scheduled_call_to || ""}
                  onChange={(e) => {
                    const v = e.target.value || null;
                    setPageFilters((prev) => ({
                      ...prev,
                      nextCallDateTo: v,
                    }));
                    applyTableFiltersPatch({ scheduled_call_to: v });
                  }}
                />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-2">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  setPageFilters((prev) => ({
                    ...prev,
                    nextCallDateFrom: null,
                    nextCallDateTo: null,
                  }));
                  applyTableFiltersPatch({
                    scheduled_call_from: undefined,
                    scheduled_call_to: undefined,
                  });
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        ),
      },
    ];
  }, [
    applyTableFiltersPatch,
    availableCampaigns,
    availableTags,
    currentFilters,
    customSelectStyles,
    setPageFilters,
    uniqueSources,
  ]);
}
