import { Inbox } from "lucide-react";

export function ManageExtensionsEmptyState() {
  return (
    <div
      className="text-center py-5 px-4 rounded border"
      style={{ backgroundColor: "#f8fafc", minHeight: 200 }}
    >
      <Inbox size={48} className="text-secondary mb-3" style={{ opacity: 0.6 }} />
      <h6 className="text-dark mb-2 fw-semibold">No extension data yet</h6>
      <p className="text-muted small mb-0 mx-auto" style={{ maxWidth: 360 }}>
        Choose one or more imagicle nodes above, then click{" "}
        <strong>Fetch extensions</strong> to load and view extension data here.
      </p>
    </div>
  );
}
