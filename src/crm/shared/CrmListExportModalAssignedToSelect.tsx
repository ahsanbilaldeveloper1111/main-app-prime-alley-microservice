import React from "react";
import { Form } from "react-bootstrap";
import Select, {
  type GroupBase,
  type SingleValue,
  type StylesConfig,
} from "react-select";

export type CrmListExportExtensionLike = Readonly<{
  id?: string | number;
  extension?: string | number;
  display_name?: string;
  name?: string;
}>;

type OwnerOption = { value: string; label: string };

/**
 * Loose enough for each page’s existing `react-select` styles object; cast at `Select` boundary.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches various CRM list style configs
export type CrmListExportModalAssignedToStyles = StylesConfig<
  any,
  false,
  GroupBase<any>
>;

export type CrmListExportModalAssignedToSelectProps = Readonly<{
  extensions: readonly CrmListExportExtensionLike[];
  /** Current `user_extension_filter` owner filter (extension / user id as string). */
  value: string | undefined;
  setExportFilters: React.Dispatch<
    React.SetStateAction<Record<string, any>>
  >;
  styles: CrmListExportModalAssignedToStyles;
  label?: string;
  placeholder?: string;
}>;

/**
 * Shared "Owner" field for CRM list export modals (react-select + user_extension_filter).
 * Deduplicates the same block across deals, approvals, orders, etc.
 */
export function CrmListExportModalAssignedToSelect({
  extensions,
  value,
  setExportFilters,
  styles,
  label = "Owner",
  placeholder = "Select owner...",
}: CrmListExportModalAssignedToSelectProps) {
  const options: OwnerOption[] = [
    { value: "", label: "All owners" },
    ...extensions.map((ext) => ({
      value: String(ext.id ?? ext.extension ?? ""),
      label: String(
        ext.display_name ?? ext.name ?? ext.id ?? ext.extension ?? "",
      ),
    })),
  ];

  const selected: SingleValue<OwnerOption> = value
    ? (() => {
        const ext = extensions.find(
          (e) => String(e.id ?? e.extension) === String(value),
        );
        return {
          value: String(value),
          label: String(
            ext?.display_name ?? ext?.name ?? ext?.id ?? ext?.extension ?? value,
          ),
        };
      })()
    : null;

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>
      <Select<OwnerOption, false>
        options={options}
        value={selected}
        onChange={(choice: SingleValue<OwnerOption>) => {
          const v = choice?.value;
          setExportFilters((prev) => {
            const next = { ...prev };
            if (v) next.user_extension_filter = v;
            else delete next.user_extension_filter;
            return next;
          });
        }}
        placeholder={placeholder}
        isClearable
        isSearchable
        styles={
          styles as StylesConfig<
            OwnerOption,
            false,
            GroupBase<OwnerOption>
          >
        }
      />
    </Form.Group>
  );
}
