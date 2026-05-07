import React from "react";
import { useAppDispatch, useAppSelector } from "../../toolkit/hooks";
import { appendDialedDigit, setDialedNumber } from "../../toolkit/layoutUi/slice";

const DIALPAD_BUTTONS = [
  { num: "1" },
  { num: "2" },
  { num: "3" },
  { num: "4" },
  { num: "5" },
  { num: "6" },
  { num: "7" },
  { num: "8" },
  { num: "9" },
  { num: "*" },
  { num: "0" },
  { num: "#" },
];

export interface LayoutDialerPopupProps {
  dialerPosition: { top: number; right: number };
  isDeviceRegistered: boolean;
  isDialing: boolean;
  onDismiss: () => void;
  onDial: (numberToDial?: string) => void;
}

const LayoutDialerPopup: React.FC<Readonly<LayoutDialerPopupProps>> = ({
  dialerPosition,
  isDeviceRegistered,
  isDialing,
  onDismiss,
  onDial,
}) => {
  const dispatch = useAppDispatch();
  const dialedNumber = useAppSelector((s) => s.layoutUi.dialedNumber);

  return (
  <>
    <button
      type="button"
      aria-label="Close dialer"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1040,
        backgroundColor: "transparent",
        border: "none",
        padding: 0,
        cursor: "default",
      }}
      onClick={onDismiss}
    />
    <div
      className="bg-white rounded shadow"
      style={{
        position: "fixed",
        top: `${dialerPosition.top}px`,
        right: `${dialerPosition.right}px`,
        zIndex: 1050,
        width: "calc(100vw - 40px)",
        maxWidth: "320px",
        padding: "1rem",
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="mb-0" style={{ fontSize: "14px", fontWeight: 600 }}>
          Dialer
        </h6>
        <span
          className={`badge ${isDeviceRegistered ? "bg-success" : "bg-danger"}`}
          style={{ fontSize: "11px" }}
        >
          {isDeviceRegistered ? "Online" : "Offline"}
        </span>
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={dialedNumber}
          onChange={(e) => {
            let value = e.target.value;
            if (value.startsWith("+")) {
              const afterPlus = value.slice(1).replaceAll(/\D/g, "");
              value = "+" + afterPlus;
              if (afterPlus.length <= 15) {
                dispatch(setDialedNumber(value));
              }
            } else {
              const digitsOnly = value.replaceAll(/\D/g, "");
              if (digitsOnly.length <= 15) {
                dispatch(setDialedNumber(digitsOnly));
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && dialedNumber.trim()) {
              onDial();
            }
          }}
          disabled={!isDeviceRegistered}
          placeholder="Enter number"
          className="form-control"
          autoFocus
        />
      </div>

      <div className="mb-3">
        <div className="row g-2">
          {DIALPAD_BUTTONS.map((btn) => (
            <div key={btn.num} className="col-4">
              <button
                type="button"
                onClick={() => dispatch(appendDialedDigit(btn.num))}
                className="btn btn-outline-secondary w-100"
                disabled={!isDeviceRegistered}
                style={{
                  height: "48px",
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                {btn.num}
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDial()}
        disabled={!dialedNumber.trim() || isDialing || !isDeviceRegistered}
        className="btn btn-primary w-100"
      >
        {isDialing ? "Dialing..." : "Call"}
      </button>
    </div>
  </>
  );
};

export default LayoutDialerPopup;
