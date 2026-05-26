import React from "react";

interface CrmProfileField {
  label: string;
  value: string;
  link?: boolean;
}

interface CrmProfileSectionProps {
  title: string;
  fields: CrmProfileField[];
}

const CrmProfileSection: React.FC<CrmProfileSectionProps> = ({
  title,
  fields,
}) => {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #cccccc",
        borderRadius: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: "1px solid #eaf0f6",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#141414",
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {fields.map((field, index) => (
            <div key={index}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#666666",
                  marginBottom: "4px",
                }}
              >
                {field.label}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: field.link ? "#006162" : "#141414",
                  wordBreak: "break-word",
                }}
              >
                {field.link && field.value && field.value !== "--" ? (
                  <a
                    href={`mailto:${field.value}`}
                    style={{ color: "#006162", textDecoration: "none" }}
                  >
                    {field.value}
                  </a>
                ) : (
                  field.value
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export type { CrmProfileField, CrmProfileSectionProps };
export default CrmProfileSection;

