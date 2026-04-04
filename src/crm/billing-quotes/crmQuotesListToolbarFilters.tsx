import React from "react";
import moment from "moment";
import { Button, Form } from "react-bootstrap";
import { FiCalendar, FiTarget } from "react-icons/fi";
import { Users } from "lucide-react";
import Select from "react-select";
import type { SingleValue, StylesConfig } from "react-select";
import type { CrmFilterBarQuickFilter } from "@components/crm/CrmListPageUi";
import type { FilterPill } from "@components/GenericTable";

/** Memoize at call site: `useMemo(() => getCrmQuotesListProspectQuickFilters(), [])`. */
export function getCrmQuotesListProspectQuickFilters(): CrmFilterBarQuickFilter[] {
  return [
    {
      id: "all",
      label: "All Prospects",
      color: "#0d6efd",
      icon: <Users size={16} />,
    },
    {
      id: "scheduled",
      label: "Scheduled",
      color: "#20c997",
      icon: <FiCalendar size={16} />,
    },
    {
      id: "has_leads",
      label: "Converted to Leads",
      color: "#0dcaf0",
      icon: <FiTarget size={16} />,
    },
  ];
}

type StringSelectOption = { value: string; label: string };
type OwnerSelectOption = { value: string | number; label: string };

function formatLastActivityPillLabel(raw: string): string | undefined {
  if (!raw) {
    return undefined;
  }
  const parsed = moment(raw);
  return parsed.isValid() ? parsed.format("MMM D, YYYY") : raw;
}

export type BuildCrmQuotesListQuoteToolbarFilterPillsParams = Readonly<{
  currentFilters: Record<string, any>;
  applyTableFiltersPatch: (patch: Record<string, any>) => void;
  customSelectStyles: StylesConfig<any, boolean, any>;
  extensions: readonly any[];
}>;

/** Quote Status, Last Activity, Quote Owner, Signing Status pills (billing + CRM quotes). */
export function buildCrmQuotesListQuoteToolbarFilterPills(
  params: BuildCrmQuotesListQuoteToolbarFilterPillsParams,
): FilterPill[] {
  const { currentFilters, applyTableFiltersPatch, customSelectStyles, extensions } =
    params;

  const quoteStatusValue = currentFilters.status ?? null;
  const lastActivityDate = currentFilters.last_activity_date ?? "";
  const quoteOwnerValue = currentFilters.quote_owner ?? null;
  const signingStatusValue = currentFilters.signing_status ?? null;

  return [
    {
      id: "quote_status",
      label: "Quote Status",
      showDropdown: true,
      active: !!quoteStatusValue,
      activeLabel: quoteStatusValue ? String(quoteStatusValue) : undefined,
      onClear: () => {
        applyTableFiltersPatch({ status: undefined });
      },
      dropdownContent: (
        <div style={{ minWidth: 280 }}>
          <Select
            options={[
              { value: "Draft", label: "Draft" },
              { value: "Published", label: "Published" },
              { value: "Signed", label: "Signed" },
            ]}
            value={
              quoteStatusValue
                ? { value: quoteStatusValue, label: String(quoteStatusValue) }
                : null
            }
            onChange={(selected: SingleValue<StringSelectOption>) => {
              applyTableFiltersPatch({
                status: selected?.value ?? undefined,
              });
            }}
            placeholder="Select status..."
            styles={customSelectStyles}
            isClearable
          />
          <div className="d-flex justify-content-end mt-2">
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => {
                applyTableFiltersPatch({ status: undefined });
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "last_activity_date",
      label: "Last Activity Date",
      showDropdown: true,
      active: !!lastActivityDate,
      activeLabel: formatLastActivityPillLabel(String(lastActivityDate)),
      onClear: () => {
        applyTableFiltersPatch({ last_activity_date: undefined });
      },
      dropdownContent: (
        <div style={{ minWidth: 280 }}>
          <Form.Label className="small fw-bold mb-1">
            Last Activity Date
          </Form.Label>
          <Form.Control
            type="date"
            value={lastActivityDate || ""}
            onChange={(e) => {
              const v = e.target.value || null;
              applyTableFiltersPatch({ last_activity_date: v });
            }}
          />
          <div className="d-flex justify-content-end mt-2">
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => {
                applyTableFiltersPatch({ last_activity_date: undefined });
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "quote_owner",
      label: "Quote Owner",
      showDropdown: true,
      active: !!quoteOwnerValue,
      activeLabel: quoteOwnerValue
        ? (() => {
            const ext = extensions.find(
              (e: any) => (e.id || e.extension) === quoteOwnerValue,
            );
            return ext
              ? ext.display_name || ext.name || String(quoteOwnerValue)
              : String(quoteOwnerValue);
          })()
        : undefined,
      onClear: () => {
        applyTableFiltersPatch({ quote_owner: undefined });
      },
      dropdownContent: (
        <div style={{ minWidth: 280 }}>
          <Select
            options={extensions.map((ext: any) => ({
              value: ext.id || ext.extension,
              label: ext.display_name || ext.name || ext.id || ext.extension,
            }))}
            value={
              quoteOwnerValue
                ? (() => {
                    const ext = extensions.find(
                      (e: any) => (e.id || e.extension) === quoteOwnerValue,
                    );
                    return ext
                      ? {
                          value: quoteOwnerValue,
                          label:
                            ext.display_name ||
                            ext.name ||
                            String(quoteOwnerValue),
                        }
                      : {
                          value: quoteOwnerValue,
                          label: String(quoteOwnerValue),
                        };
                  })()
                : null
            }
            onChange={(selected: SingleValue<OwnerSelectOption>) => {
              applyTableFiltersPatch({
                quote_owner: selected?.value ?? undefined,
              });
            }}
            placeholder="Select owner..."
            styles={customSelectStyles}
            isClearable
          />
          <div className="d-flex justify-content-end mt-2">
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => {
                applyTableFiltersPatch({ quote_owner: undefined });
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "signing_status",
      label: "Signing Status",
      showDropdown: true,
      active: !!signingStatusValue,
      activeLabel: signingStatusValue
        ? String(signingStatusValue)
        : undefined,
      onClear: () => {
        applyTableFiltersPatch({ signing_status: undefined });
      },
      dropdownContent: (
        <div style={{ minWidth: 280 }}>
          <Select
            options={[
              { value: "Pending", label: "Pending" },
              { value: "Viewed", label: "Viewed" },
              { value: "Signed", label: "Signed" },
            ]}
            value={
              signingStatusValue
                ? {
                    value: signingStatusValue,
                    label: String(signingStatusValue),
                  }
                : null
            }
            onChange={(selected: SingleValue<StringSelectOption>) => {
              applyTableFiltersPatch({
                signing_status: selected?.value ?? undefined,
              });
            }}
            placeholder="Select signing status..."
            styles={customSelectStyles}
            isClearable
          />
          <div className="d-flex justify-content-end mt-2">
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => {
                applyTableFiltersPatch({ signing_status: undefined });
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      ),
    },
  ];
}
