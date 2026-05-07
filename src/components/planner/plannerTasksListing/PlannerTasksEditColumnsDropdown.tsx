import React from "react";
import { Dropdown, Form } from "react-bootstrap";
import type { TableColumn } from "@components/GenericTable";
import type { Task } from "./plannerTasksListingDomain";
import "./plannerTasksListing.scss";

export type PlannerTasksEditColumnsDropdownProps = Readonly<{
  columns: Array<Pick<TableColumn<Task>, "key" | "label">>;
  visibleTaskColumnKeys: string[];
  toggleTaskColumnVisibility: (columnKey: string) => void;
  selectAllTaskColumns: () => void;
  resetTaskColumnsToDefault: () => void;
}>;

export function PlannerTasksEditColumnsDropdown({
  columns,
  visibleTaskColumnKeys,
  toggleTaskColumnVisibility,
  selectAllTaskColumns,
  resetTaskColumnsToDefault,
}: PlannerTasksEditColumnsDropdownProps) {
  return (
    <Dropdown align="end" autoClose="outside">
      <Dropdown.Toggle variant="outline-secondary" id="tasks-edit-columns-dropdown" className="ptl-edit-columns-toggle">
        Edit columns
      </Dropdown.Toggle>
      <Dropdown.Menu className="ptl-edit-columns-menu">
        {columns.map((col) => (
          <Dropdown.Item
            key={col.key}
            as="div"
            className="px-3 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Form.Check
              type="checkbox"
              id={`planner-task-col-${col.key}`}
              label={col.label || col.key}
              checked={visibleTaskColumnKeys.includes(col.key)}
              onChange={() => toggleTaskColumnVisibility(col.key)}
            />
          </Dropdown.Item>
        ))}
        <Dropdown.Divider />
        <Dropdown.Item as="button" type="button" onClick={selectAllTaskColumns}>
          Select all
        </Dropdown.Item>
        <Dropdown.Item as="button" type="button" onClick={resetTaskColumnsToDefault}>
          Reset to default
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
