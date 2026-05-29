import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import moment from "moment";
import {
  formatDateTimePillLabel,
  toDateTimeLocalInputValue,
} from "@utils/communications/communicationsDateExtensionFilters";
import type { CrmTicketAppliedFilters } from "@components/crm/tickets/crmTicketsListDomain";

type FiltersUpdater =
  | CrmTicketAppliedFilters
  | ((prev: CrmTicketAppliedFilters) => CrmTicketAppliedFilters);

type CreateDateRangePillMenuProps = {
  currentFilters: CrmTicketAppliedFilters;
  onFiltersChange: (update: FiltersUpdater) => void;
  closeMenu: () => void;
};

function CreateDateRangePillMenu({
  currentFilters,
  onFiltersChange,
  closeMenu,
}: Readonly<CreateDateRangePillMenuProps>) {
  const [startVal, setStartVal] = useState(() =>
    toDateTimeLocalInputValue(currentFilters.createDateFrom, "start"),
  );
  const [endVal, setEndVal] = useState(() =>
    toDateTimeLocalInputValue(currentFilters.createDateTo, "end"),
  );

  const maxDateTime = moment().format("YYYY-MM-DDTHH:mm");

  return (
    <div className="d-flex flex-column gap-2 px-2 py-2" style={{ minWidth: 280 }}>
      <Form.Group>
        <Form.Label className="small mb-1">Start date &amp; time</Form.Label>
        <Form.Control
          size="sm"
          type="datetime-local"
          step={60}
          value={startVal}
          max={maxDateTime}
          onChange={(e) => {
            const value = e.target.value;
            setStartVal(value);
            if (endVal && moment(value).isAfter(moment(endVal))) {
              setEndVal(value);
            }
          }}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label className="small mb-1">End date &amp; time</Form.Label>
        <Form.Control
          size="sm"
          type="datetime-local"
          step={60}
          value={endVal}
          min={startVal || undefined}
          max={maxDateTime}
          onChange={(e) => {
            const value = e.target.value;
            setEndVal(value);
            if (startVal && moment(value).isBefore(moment(startVal))) {
              setStartVal(value);
            }
          }}
        />
      </Form.Group>
      <div className="d-flex justify-content-end gap-2">
        <Button variant="outline-secondary" size="sm" onClick={closeMenu}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            onFiltersChange((prev) => ({
              ...prev,
              createDateFrom: startVal,
              createDateTo: endVal,
            }));
            closeMenu();
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

export function createCrmTicketsCreateDateFilterDropdown(
  currentFilters: CrmTicketAppliedFilters,
  onFiltersChange: (update: FiltersUpdater) => void,
) {
  return function CrmTicketsCreateDateFilterDropdown({
    closeMenu,
  }: {
    closeMenu: () => void;
  }) {
    return (
      <CreateDateRangePillMenu
        currentFilters={currentFilters}
        onFiltersChange={onFiltersChange}
        closeMenu={closeMenu}
      />
    );
  };
}

export function getCrmTicketsCreateDateFilterActiveLabel(
  from: string,
  to: string,
): string | undefined {
  if (!from && !to) {
    return undefined;
  }

  const fromLabel = formatDateTimePillLabel(from, "start");
  const toLabel = formatDateTimePillLabel(to, "end");

  if (fromLabel && toLabel) {
    return fromLabel === toLabel ? fromLabel : `${fromLabel} – ${toLabel}`;
  }
  return fromLabel ?? toLabel;
}
