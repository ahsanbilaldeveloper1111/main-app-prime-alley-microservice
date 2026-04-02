import React from "react";

interface CrmColorCellProps {
  color?: string | null;
}

const DEFAULT_COLOR = "#6c757d";

const CrmColorCell: React.FC<CrmColorCellProps> = ({ color }) => {
  const displayColor = color?.trim() || DEFAULT_COLOR;

  return (
    <div className="d-flex align-items-center">
      <span
        aria-label={`Color ${displayColor}`}
        title={displayColor}
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          backgroundColor: displayColor,
          border: "1px solid rgba(0, 0, 0, 0.15)",
          display: "inline-block",
        }}
      />
    </div>
  );
};

export default CrmColorCell;
