import React, { useState, useEffect, useCallback } from "react";
import { Form, Spinner, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { X, Phone } from "lucide-react";
import { postTrunks, type CreateTrunkPayload } from "@utils/voicebot/outbound";
import { GetCompanies } from "@utils/users";
import { normalizeCompaniesResponse, type CompanyOption } from "@utils/companyOptions";
import { useSession } from "next-auth/react";

const sidebarStyles = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1050,
  },
  container: {
    position: "fixed" as const,
    top: 0,
    right: 0,
    width: "470px",
    height: "100vh",
    zIndex: 1051,
    display: "flex" as const,
    flexDirection: "column" as const,
    backgroundColor: "#f0f0f0",
    animation: "trunkCreateSlideIn 0.3s ease-out",
    boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
  },
  header: {
    padding: "20px 24px",
    border: "1px solid #cccccc",
    backgroundColor: "#ffffff",
    flexShrink: 0 as const,
    borderRadius: "10px 10px 0 0",
  },
  headerInner: {
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  title: {
    fontSize: "20px",
    fontWeight: 500 as const,
    color: "#141414",
    margin: 0,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    color: "#718096",
    borderRadius: "4px",
    transition: "all 0.2s",
  },
  scrollContent: {
    flex: 1,
    overflowY: "auto" as const,
    backgroundColor: "#f0f0f0",
    padding: "16px",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "20px",
    border: "1px solid #cccccc",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
  },
  footer: {
    padding: "16px 24px",
    backgroundColor: "#ffffff",
    borderTop: "1px solid #cccccc",
    display: "flex" as const,
    justifyContent: "flex-end" as const,
    gap: "10px",
    flexShrink: 0 as const,
  },
  label: {
    display: "block" as const,
    fontSize: "13px",
    fontWeight: 500 as const,
    color: "#6b7280",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#141414",
    backgroundColor: "#ffffff",
  },
};

export interface TrunkCreateSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const defaultForm = {
  company_id: "",
  name: "",
  address: "",
  callerIdsRaw: "",
};

const TrunkCreateSidebar: React.FC<TrunkCreateSidebarProps> = ({ isOpen, onClose, onCreated }) => {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const userCompanyIdentifier =
    (session?.user as { company_identifier?: string })?.company_identifier ?? "";
  const userCompanyName =
    (session?.user as { company_name?: string })?.company_name ?? userCompanyIdentifier;

  const [form, setForm] = useState(defaultForm);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const res = await GetCompanies();
      if (res === false) {
        setCompanies([]);
        return;
      }
      setCompanies(normalizeCompaniesResponse(res, { prefer: "company_id" }));
    } catch {
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCompanies().catch(() => undefined);
    }
  }, [isOpen, fetchCompanies]);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      company_id: isAdmin ? "" : userCompanyIdentifier,
      name: "",
      address: "",
      callerIdsRaw: "",
    });
  }, [isOpen, isAdmin, userCompanyIdentifier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const company_id = (isAdmin ? form.company_id : userCompanyIdentifier).trim();
    const name = form.name.trim();
    const address = form.address.trim();
    const caller_ids = form.callerIdsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!company_id) {
      toast.error("Company is required");
      return;
    }
    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (!address) {
      toast.error("Address is required");
      return;
    }
    if (caller_ids.length === 0) {
      toast.error("At least one caller ID is required");
      return;
    }

    const payload: CreateTrunkPayload = {
      company_id,
      name,
      address,
      caller_ids,
    };

    setSubmitting(true);
    postTrunks(payload)
      .then(() => {
        toast.success("Trunk created");
        onCreated?.();
        onClose();
      })
      .catch((err: { response?: { data?: { detail?: string } }; message?: string }) => {
        toast.error(err?.response?.data?.detail || err?.message || "Create failed");
      })
      .finally(() => setSubmitting(false));
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes trunkCreateSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .trunk-create-sidebar input:focus,
        .trunk-create-sidebar select:focus,
        .trunk-create-sidebar textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102,126,234,0.15);
        }
        .trunk-create-close-btn:hover {
          color: #2d3748 !important;
          background-color: #f7fafc !important;
        }
      `}</style>

      <button
        type="button"
        aria-label="Close"
        style={{ ...sidebarStyles.overlay, border: "none", padding: 0, cursor: "default" }}
        onClick={onClose}
      />

      <div style={sidebarStyles.container} className="trunk-create-sidebar">
        <div style={sidebarStyles.header}>
          <div style={sidebarStyles.headerInner}>
            <h2 style={sidebarStyles.title}>Create Trunk</h2>
            <button
              type="button"
              style={sidebarStyles.closeBtn}
              className="trunk-create-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="d-flex flex-column"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <div style={sidebarStyles.scrollContent} className="sidebar-scrollbar">
            <div style={sidebarStyles.formCard}>
              <h3
                className="d-flex align-items-center gap-2 mb-3"
                style={{ fontSize: "16px", fontWeight: 600, color: "#141414", margin: 0 }}
              >
                <Phone size={16} />
                Trunk details
              </h3>

              <Form.Group className="mb-3" controlId="trunk-company">
                <Form.Label style={sidebarStyles.label}>
                  Company <span style={{ color: "#ef4444" }}>*</span>
                </Form.Label>
                <Form.Select
                  value={isAdmin ? form.company_id : userCompanyIdentifier}
                  onChange={(e) => {
                    if (isAdmin) setForm((f) => ({ ...f, company_id: e.target.value }));
                  }}
                  disabled={loadingCompanies || !isAdmin}
                  style={sidebarStyles.input as React.CSSProperties}
                >
                  <option value="">{loadingCompanies ? "Loading…" : "Select company"}</option>
                  {isAdmin
                    ? companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.id}
                        </option>
                      ))
                    : (
                        <option value={userCompanyIdentifier}>{userCompanyName || userCompanyIdentifier}</option>
                      )}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3" controlId="trunk-name">
                <Form.Label style={sidebarStyles.label}>
                  Name <span style={{ color: "#ef4444" }}>*</span>
                </Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Main SIP Trunk"
                  required
                  style={sidebarStyles.input as React.CSSProperties}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="trunk-address">
                <Form.Label style={sidebarStyles.label}>
                  Address <span style={{ color: "#ef4444" }}>*</span>
                </Form.Label>
                <Form.Control
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="e.g. 90.250.8.96:5069"
                  required
                  style={sidebarStyles.input as React.CSSProperties}
                />
              </Form.Group>

              <Form.Group className="mb-0" controlId="trunk-caller-ids">
                <Form.Label style={sidebarStyles.label}>
                  Caller IDs <span style={{ color: "#ef4444" }}>*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.callerIdsRaw}
                  onChange={(e) => setForm((f) => ({ ...f, callerIdsRaw: e.target.value }))}
                  placeholder='Comma-separated, e.g. 598, 599'
                  style={sidebarStyles.input as React.CSSProperties}
                />
                <Form.Text className="text-muted" style={{ fontSize: "12px" }}>
                  At least one value required. Split multiple IDs with commas.
                </Form.Text>
              </Form.Group>
            </div>
          </div>

          <div style={sidebarStyles.footer}>
            <Button variant="light" onClick={onClose} type="button" disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting || loadingCompanies}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Creating…
                </>
              ) : (
                "Create Trunk"
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default TrunkCreateSidebar;
