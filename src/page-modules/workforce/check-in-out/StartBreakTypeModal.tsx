import { useBreakTypesQuery } from "@page-modules/workforce/company-config/useBreakTypesQuery";
import {
  filterSelectableBreakTypes,
  formatBreakTypeOptionMeta,
  formatBreakTypeOptionTitle,
} from "@page-modules/workforce/check-in-out/checkInOutDomain";
import type { AttendanceBreakType } from "@utils/staffManagement";
import { Coffee } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";

export type StartBreakTypeModalProps = Readonly<{
  show: boolean;
  tenantId: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (breakTypeId: number) => void;
}>;

function BreakTypeOption({
  row,
  selected,
  disabled,
  onSelect,
}: Readonly<{
  row: AttendanceBreakType;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}>) {
  const meta = formatBreakTypeOptionMeta(row);
  const className = [
    "start-break-modal__option",
    selected ? "start-break-modal__option--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="start-break-modal__option-radio" aria-hidden />
      <span className="start-break-modal__option-content">
        <span className="start-break-modal__option-title">{formatBreakTypeOptionTitle(row)}</span>
        {meta ? <span className="start-break-modal__option-meta">{meta}</span> : null}
      </span>
    </button>
  );
}

export function StartBreakTypeModal({
  show,
  tenantId,
  isSubmitting,
  onClose,
  onConfirm,
}: StartBreakTypeModalProps) {
  const [selectedBreakTypeId, setSelectedBreakTypeId] = useState<number | null>(null);

  const breakTypesQuery = useBreakTypesQuery({
    tenantId,
    enabled: show && Boolean(tenantId),
  });

  const breakTypeOptions = useMemo(
    () => filterSelectableBreakTypes(breakTypesQuery.data?.data ?? []),
    [breakTypesQuery.data?.data],
  );

  useEffect(() => {
    if (!show) {
      setSelectedBreakTypeId(null);
      return;
    }
    if (breakTypeOptions.length === 1) {
      setSelectedBreakTypeId(breakTypeOptions[0].id);
    }
  }, [breakTypeOptions, show]);

  const canConfirm =
    selectedBreakTypeId != null &&
    Number.isFinite(selectedBreakTypeId) &&
    !isSubmitting &&
    !breakTypesQuery.isFetching;

  const handleConfirm = () => {
    if (selectedBreakTypeId == null || !Number.isFinite(selectedBreakTypeId)) {
      return;
    }
    onConfirm(selectedBreakTypeId);
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      className="start-break-modal"
      backdrop={isSubmitting ? "static" : true}
      keyboard={!isSubmitting}
    >
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title className="start-break-modal__title">
          <Coffee size={20} aria-hidden />
          Start break
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="start-break-modal__intro">
          Select a break type before starting your break.
        </p>

        {breakTypesQuery.isFetching ? (
          <div className="start-break-modal__loading">
            <output className="d-flex align-items-center gap-2 mb-0">
              <Spinner animation="border" size="sm" aria-hidden />
              <span>Loading break types…</span>
            </output>
          </div>
        ) : null}

        {!breakTypesQuery.isFetching && breakTypesQuery.isError ? (
          <p className="start-break-modal__empty">Failed to load break types. Please try again.</p>
        ) : null}

        {!breakTypesQuery.isFetching &&
        !breakTypesQuery.isError &&
        breakTypeOptions.length === 0 ? (
          <p className="start-break-modal__empty">
            No active break types are configured for your company. Contact your administrator.
          </p>
        ) : null}

        {!breakTypesQuery.isFetching && breakTypeOptions.length > 0 ? (
          <div className="start-break-modal__options" role="radiogroup" aria-label="Break type">
            {breakTypeOptions.map((row) => (
              <BreakTypeOption
                key={row.id}
                row={row}
                selected={selectedBreakTypeId === row.id}
                disabled={isSubmitting}
                onSelect={() => setSelectedBreakTypeId(row.id)}
              />
            ))}
          </div>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" type="button" disabled={isSubmitting} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="button"
          className="start-break-modal__confirm-btn"
          disabled={!canConfirm}
          onClick={handleConfirm}
        >
          {isSubmitting ? "Starting…" : "Start break"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
