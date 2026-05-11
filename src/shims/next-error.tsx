/**
 * `next/error` shim — renders a minimal error page identical to Next's.
 */

interface ErrorProps {
  statusCode?: number;
  title?: string;
  withDarkMode?: boolean;
}

export default function NextError({ statusCode, title }: ErrorProps) {
  const heading = title ?? (statusCode ? `Error ${statusCode}` : "An error occurred");
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "3rem", margin: 0 }}>{statusCode ?? "Error"}</h1>
      <p style={{ marginTop: "0.5rem" }}>{heading}</p>
    </div>
  );
}
