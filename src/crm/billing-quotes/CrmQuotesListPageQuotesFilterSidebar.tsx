import React from "react";
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import { crmListPageReactSelectStyles as customSelectStyles } from "@utils/crmListPageReactSelectStyles";
import { buildCrmQuotesListFiltersFromProspectsSidebar } from "@crm/billing-quotes/crmQuotesListPageBuildProspectSidebarFilters";
import { crmQuotesListExtensionToSelectValue } from "@crm/billing-quotes/crmQuotesListPageExtensionSelectOption";

export type CrmQuotesListPageQuotesFilterSidebarProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  prospectsSearch: string;
  setProspectsSearch: (v: string) => void;
  prospectsFilters: Record<string, any>;
  setProspectsFilters: React.Dispatch<React.SetStateAction<any>>;
  extensions: any[];
  setActiveFilter: (id: string) => void;
  handleFiltersChange: (patch: Record<string, any>) => void;
  setPagination: React.Dispatch<React.SetStateAction<any>>;
  setRefreshKey: (fn: (prev: number) => number) => void;
  setShowFiltersSidebar: (v: boolean) => void;
  setCurrentFilters: React.Dispatch<React.SetStateAction<any>>;
}>;

export function CrmQuotesListPageQuotesFilterSidebar({
  isOpen,
  onClose,
  prospectsSearch,
  setProspectsSearch,
  prospectsFilters,
  setProspectsFilters,
  extensions,
  setActiveFilter,
  handleFiltersChange,
  setPagination,
  setRefreshKey,
  setShowFiltersSidebar,
  setCurrentFilters,
}: Readonly<CrmQuotesListPageQuotesFilterSidebarProps>) {
  return (
    <GenericFilterSidebar
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      subtitle="Filter quotes by various criteria"
      width="400px"
      filters={[
        {
          id: "search",
          label: "Search",
          type: "text",
          value: prospectsSearch,
          onChange: (value) => setProspectsSearch(value),
          placeholder: "Search by quote title...",
        },
        {
          id: "assignedTo",
          label: "Owner",
          type: "select",
          value: crmQuotesListExtensionToSelectValue(
            prospectsFilters.assignedTo,
            extensions,
          ),
          onChange: (selected) => {
            const assignedToValue = selected ? selected.value : null;
            setProspectsFilters((prev: any) => ({
              ...prev,
              assignedTo: assignedToValue,
            }));
            setActiveFilter("all");
          },
          options: extensions.map((ext: any) => ({
            value: ext.id || ext.extension,
            label: ext.display_name || ext.name || ext.id || ext.extension,
          })),
          placeholder: "Search and select owner...",
          isClearable: true,
          styles: customSelectStyles,
        },
        {
          id: "quote_status",
          label: "Quote Status",
          type: "select",
          value: prospectsFilters.campaigns
            ? {
                value: prospectsFilters.campaigns,
                label: prospectsFilters.campaigns,
              }
            : null,
          onChange: (selected) => {
            const statusValue = selected ? selected.value : null;
            setProspectsFilters((prev: any) => ({
              ...prev,
              campaigns: statusValue,
            }));
            setActiveFilter("all");
          },
          options: [
            { value: "Draft", label: "Draft" },
            { value: "Published", label: "Published" },
            { value: "Signed", label: "Signed" },
          ],
          placeholder: "Select status...",
          isClearable: true,
          styles: customSelectStyles,
        },
        {
          id: "last_activity_date",
          label: "Last Activity Date",
          type: "date",
          value: prospectsFilters.nextCallDateFrom || "",
          onChange: (value) => {
            setProspectsFilters((prev: any) => ({
              ...prev,
              nextCallDateFrom: value,
            }));
          },
          placeholder: "Filter by last activity date",
        },
        {
          id: "quote_owner",
          label: "Quote Owner",
          type: "select",
          value: crmQuotesListExtensionToSelectValue(
            prospectsFilters.sourceFile,
            extensions,
          ),
          onChange: (selected) => {
            const ownerValue = selected ? selected.value : null;
            setProspectsFilters((prev: any) => ({
              ...prev,
              sourceFile: ownerValue,
            }));
            setActiveFilter("all");
          },
          options: extensions.map((ext: any) => ({
            value: ext.id || ext.extension,
            label: ext.display_name || ext.name || ext.id || ext.extension,
          })),
          placeholder: "Select quote owner...",
          isClearable: true,
          styles: customSelectStyles,
        },
        {
          id: "signing_status",
          label: "Signing Status",
          type: "select",
          value: prospectsFilters.tags
            ? { value: prospectsFilters.tags, label: prospectsFilters.tags }
            : null,
          onChange: (selected) => {
            const signingValue = selected ? selected.value : null;
            setProspectsFilters((prev: any) => ({
              ...prev,
              tags: signingValue,
            }));
            setActiveFilter("all");
          },
          options: [
            { value: "Pending", label: "Pending" },
            { value: "Viewed", label: "Viewed" },
            { value: "Signed", label: "Signed" },
          ],
          placeholder: "Select signing status...",
          isClearable: true,
          styles: customSelectStyles,
        },
      ]}
      onApply={() => {
        const filtersToApply = buildCrmQuotesListFiltersFromProspectsSidebar(
          prospectsSearch,
          prospectsFilters,
        );
        handleFiltersChange(filtersToApply);
        setPagination((prev: any) => ({
          ...prev,
          currentPage: 1,
        }));
        setRefreshKey((prev: number) => prev + 1);
        setShowFiltersSidebar(false);
      }}
      onReset={() => {
        setProspectsSearch("");
        setProspectsFilters({
          assignedTo: null,
          campaigns: null,
          nextCallDateFrom: null,
          nextCallDateTo: null,
          sourceFile: null,
          tags: null,
        });
        handleFiltersChange({});
        setCurrentFilters({});
        setActiveFilter("all");
        setPagination((prev: any) => ({
          ...prev,
          currentPage: 1,
        }));
        setRefreshKey((prev) => prev + 1);
      }}
    />
  );
}
