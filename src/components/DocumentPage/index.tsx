import { ExternalLink } from "lucide-react";

const font = "Lexend Deca, Helvetica, Arial, sans-serif";

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: font,
    color: "#141414",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    padding: "24px",
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: 300,
    fontFamily: font,
    color: "#141414",
    margin: "0 0 20px 0",
    lineHeight: "29px",
  },
  tableWrapper: {
    backgroundColor: "#fff",
    border: "1px solid rgb(204, 204, 204)",
    borderRadius: 8,
    boxShadow: "rgba(20, 20, 20, 0.08) 0px 1px 8px 0px",
    overflow: "hidden",
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontFamily: font,
  },
  thead: {
    backgroundColor: "#f5f5f5",
    borderBottom: "1px solid #e5e5e5",
  },
  th: {
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: font,
    color: "#141414",
    textAlign: "left" as const,
    whiteSpace: "nowrap" as const,
    letterSpacing: 0,
    lineHeight: "18px",
  },
  td: {
    padding: "16px 16px",
    fontSize: 14,
    fontFamily: font,
    color: "#141414",
    verticalAlign: "middle" as const,
    borderBottom: "1px solid #e5e5e5",
    lineHeight: "20px",
  },
  link: {
    fontWeight: 600,
    color: "rgb(0, 97, 98)",
    cursor: "pointer",
    textUnderlineOffset: "24%",
    textDecoration: "underline",
    fontFamily: font,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  },
};

const documents = [
  {
    id: 1,
    name: "UAE bank certificate",
    isExternal: false,
    updatedAt: "15 Jan 2026",
    type: "Bank certificate",
    status: "",
    actions: "",
  },
  {
    id: 2,
    name: "Terms of Service",
    isExternal: true,
    updatedAt: "",
    type: "",
    status: "",
    actions: "",
  },
];

export default function DocumentsPage() {
  return (
    <div style={s.page}>
      <h1 style={s.pageHeading}>Documents</h1>

      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead style={s.thead}>
            <tr>
              <th style={s.th}>Name</th>
              <th style={s.th}>Updated At</th>
              <th style={s.th}>Type</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, idx) => (
              <tr
                key={doc.id}
                style={{
                  backgroundColor: "#fff",
                  borderBottom: idx < documents.length - 1 ? "1px solid #e5e5e5" : "none",
                }}
              >
                <td style={s.td}>
                  <a style={s.link}>
                    {doc.name}
                    {doc.isExternal && <ExternalLink size={13} />}
                  </a>
                </td>
                <td style={{ ...s.td, color: "#141414" }}>{doc.updatedAt}</td>
                <td style={{ ...s.td, color: "#141414" }}>{doc.type}</td>
                <td style={s.td}>{doc.status}</td>
                <td style={s.td}>{doc.actions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
