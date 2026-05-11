import React, { type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { FilterPill } from "@components/GenericTable";
import { journeyUsersPillLabel } from "./journeyDomain";

export interface BuildJourneyFilterPillsParams {
  selectedEmploymentType: string;
  appliedEmploymentType: string;
  setSelectedEmploymentType: Dispatch<SetStateAction<string>>;
  setAppliedEmploymentType: Dispatch<SetStateAction<string>>;
  selectedContract: string;
  appliedContract: string;
  setSelectedContract: Dispatch<SetStateAction<string>>;
  setAppliedContract: Dispatch<SetStateAction<string>>;
  selectedDepartment: string;
  appliedDepartment: string;
  departmentPillActiveLabel: string | undefined;
  setSelectedDepartment: Dispatch<SetStateAction<string>>;
  setAppliedDepartment: Dispatch<SetStateAction<string>>;
  selectedUserIds: string[];
  appliedUserIds: string[];
  setSelectedUserIds: Dispatch<SetStateAction<string[]>>;
  setAppliedUserIds: Dispatch<SetStateAction<string[]>>;
  selectedStatus: string;
  appliedStatus: string;
  statusPillActiveLabel: string | undefined;
  setSelectedStatus: Dispatch<SetStateAction<string>>;
  setAppliedStatus: Dispatch<SetStateAction<string>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  employmentFilterOptions: {
    label: string;
    value: string;
    onClick: () => void;
  }[];
  contractFilterOptions: {
    label: string;
    value: string;
    onClick: () => void;
  }[];
  departmentFilterOptions: {
    label: string;
    value: string;
    onClick: () => void;
  }[];
  statusFilterOptions: {
    label: string;
    value: string;
    onClick: () => void;
  }[];
  usersDropdownContent: ReactNode;
}

export function buildJourneyFilterPills(params: Readonly<BuildJourneyFilterPillsParams>): FilterPill[] {
  const {
    selectedEmploymentType,
    appliedEmploymentType,
    setSelectedEmploymentType,
    setAppliedEmploymentType,
    selectedContract,
    appliedContract,
    setSelectedContract,
    setAppliedContract,
    selectedDepartment,
    appliedDepartment,
    departmentPillActiveLabel,
    setSelectedDepartment,
    setAppliedDepartment,
    selectedUserIds,
    appliedUserIds,
    setSelectedUserIds,
    setAppliedUserIds,
    selectedStatus,
    appliedStatus,
    statusPillActiveLabel,
    setSelectedStatus,
    setAppliedStatus,
    setCurrentPage,
    employmentFilterOptions,
    contractFilterOptions,
    departmentFilterOptions,
    statusFilterOptions,
    usersDropdownContent,
  } = params;

  return [
    {
      id: "journey-employment",
      label: "Employment",
      showDropdown: true,
      searchable: true,
      active: Boolean(selectedEmploymentType || appliedEmploymentType),
      activeLabel: selectedEmploymentType || appliedEmploymentType || undefined,
      onClear:
        selectedEmploymentType || appliedEmploymentType
          ? () => {
              setSelectedEmploymentType("");
              setAppliedEmploymentType("");
              setCurrentPage(1);
            }
          : undefined,
      dropdownOptions: employmentFilterOptions,
    },
    {
      id: "journey-contract",
      label: "Contract",
      showDropdown: true,
      searchable: true,
      active: Boolean(selectedContract || appliedContract),
      activeLabel: selectedContract || appliedContract || undefined,
      onClear:
        selectedContract || appliedContract
          ? () => {
              setSelectedContract("");
              setAppliedContract("");
              setCurrentPage(1);
            }
          : undefined,
      dropdownOptions: contractFilterOptions,
    },
    {
      id: "journey-department",
      label: "Department",
      showDropdown: true,
      searchable: true,
      active: Boolean(selectedDepartment || appliedDepartment),
      activeLabel: departmentPillActiveLabel,
      onClear:
        selectedDepartment || appliedDepartment
          ? () => {
              setSelectedDepartment("");
              setAppliedDepartment("");
              setCurrentPage(1);
            }
          : undefined,
      dropdownOptions: departmentFilterOptions,
    },
    {
      id: "journey-users",
      label: "Users",
      showDropdown: true,
      active: selectedUserIds.length > 0 || appliedUserIds.length > 0,
      activeLabel: journeyUsersPillLabel(selectedUserIds.length, appliedUserIds.length),
      onClear:
        selectedUserIds.length > 0 || appliedUserIds.length > 0
          ? () => {
              setSelectedUserIds([]);
              setAppliedUserIds([]);
              setCurrentPage(1);
            }
          : undefined,
      dropdownContent: usersDropdownContent,
    },
    {
      id: "journey-status",
      label: "Status",
      showDropdown: true,
      searchable: true,
      active: Boolean(selectedStatus || appliedStatus),
      activeLabel: statusPillActiveLabel,
      onClear:
        selectedStatus || appliedStatus
          ? () => {
              setSelectedStatus("");
              setAppliedStatus("");
              setCurrentPage(1);
            }
          : undefined,
      dropdownOptions: statusFilterOptions,
    },
  ];
}
