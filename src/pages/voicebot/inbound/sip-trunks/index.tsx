import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getSipTrunks,
  getCompanies,
  deleteSipTrunk,
  type SipTrunkListItem,
} from "@utils/voicebot/inbound";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import {
  normalizeCompaniesResponse,
  type CompanyOption,
} from "@utils/companyOptions";
import { safeDisplayString } from "@utils/voicebot/formDisplay";
import { Row, Col, Button, Modal, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Eye, Plus, RefreshCw, Trash2 } from "lucide-react";
import "@assets/scss/common.scss";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

type TrunkRow = SipTrunkListItem & { _rowKey: string };

/**
 * GET /sip-trunks/ expects `company_id` to be the company identifier (TMS/slug), not a numeric
 * id. Match create/bots: prefer `identifier` on the option when set.
 */
function companyIdentifierParamForSipTrunks(
  companies: CompanyOption[],
  selectedCompanyValue: string,
): string {
  const t = selectedCompanyValue.trim();
  if (!t) return "";
  const c = companies.find(
    (x) => x.id === t || x.identifier === t || x.company_id === t,
  );
  if (c?.identifier?.trim()) return c.identifier.trim();
  return t;
}

function getUserCompanyIdForVoicebot(
  user:
    | { company_id?: string | null; company_identifier?: string | null }
    | undefined,
): string {
  const fromId = String(user?.company_id ?? "").trim();
  if (fromId) return fromId;
  return String(user?.company_identifier ?? "").trim();
}

function listFromSipTrunksResponse(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  const o = res as { data?: unknown; results?: unknown } | null | undefined;
  const inner = o?.data ?? o?.results;
  return Array.isArray(inner) ? inner : [];
}

function callerIdsFromRow(row: TrunkRow): string {
  const raw: unknown = row.caller_ids;
  if (raw == null) return "";
  if (Array.isArray(raw)) {
    return raw
      .map((x) =>
        typeof x === "string" || typeof x === "number" ? String(x) : "",
      )
      .map((s: string) => s.trim())
      .filter((s) => s.length > 0)
      .join(", ");
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/[,\n]/)
      .map((s: string) => s.trim())
      .filter((s) => s.length > 0)
      .join(", ");
  }
  return "";
}

function trunkIdFromRow(row: TrunkRow): string {
  const t = row.sip_trunk_id ?? row.id ?? row.trunk_id;
  if (typeof t === "string") return t;
  if (typeof t === "number") return String(t);
  return "";
}

/** Prefer nested / API `company_name`, else match `company_id` to loaded company options or session. */
function companyLabelForTrunkRow(
  r: TrunkRow,
  companyOptions: CompanyOption[],
  session: {
    user?: {
      company_id?: string | null;
      company_identifier?: string | null;
      company_name?: string | null;
    };
  } | null,
): string {
  const co = r.company;
  if (co && typeof co === "object" && co !== null) {
    const n = (co as { name?: string }).name;
    if (typeof n === "string" && n.trim()) return n.trim();
  }
  const top = r.company_name;
  if (typeof top === "string" && top.trim()) return top.trim();

  const raw = String(r.company_id ?? "").trim();
  if (!raw) return "—";

  const opt = companyOptions.find(
    (x) => x.id === raw || x.identifier === raw || x.company_id === raw,
  );
  if (opt?.name?.trim()) return opt.name.trim();

  const u = session?.user;
  if (u) {
    const uid = String(u.company_id ?? "").trim();
    const uident = String(u.company_identifier ?? "").trim();
    const uname = String(u.company_name ?? "").trim();
    if (uname && (raw === uid || raw === uident)) return uname;
  }

  return raw;
}

const addTrunkButtonStyle: React.CSSProperties = {
  cursor: "pointer",
  transition: "150ms ease-out",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  background: "#141414",
  borderColor: "rgba(20, 20, 20, 0)",
  color: "rgb(255, 255, 255)",
  textDecoration: "none",
  borderRadius: "4px",
  borderWidth: "1px",
  borderStyle: "solid",
  paddingBlock: "8px",
  paddingInline: "16px",
  fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
  fontSize: "12px",
  fontWeight: 300,
  lineHeight: "14px",
  WebkitFontSmoothing: "antialiased",
};

const SipTrunksPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { PERMISSIONS } = HEADER_CONSTANTS;
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const permissions = session?.user?.permissions ?? [];
  const canCreateTrunks = permissions.includes(
    PERMISSIONS.CREATE_INBOUND_TRUNK_INBOUND,
  );
  const canDeleteTrunks = permissions.includes(
    PERMISSIONS.DELETE_INBOUND_TRUNK_INBOUND,
  );
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [data, setData] = useState<TrunkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRow, setViewRow] = useState<TrunkRow | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TrunkRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await getCompanies({ show_inactive: false });
      setCompanies(normalizeCompaniesResponse(res));
    } catch {
      setCompanies([]);
    }
  }, []);

  const effectiveCompanyId = useMemo(() => {
    if (isAdmin) {
      if (!companyFilter) return undefined;
      return companyIdentifierParamForSipTrunks(companies, companyFilter);
    }
    return getUserCompanyIdForVoicebot(session?.user);
  }, [isAdmin, companyFilter, companies, session?.user]);

  const fetchTrunks = useCallback(async () => {
    if (!isAdmin && !effectiveCompanyId) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const params: { company_id?: string } = {};
      if (effectiveCompanyId) params.company_id = effectiveCompanyId;
      const res = await getSipTrunks(
        Object.keys(params).length > 0 ? params : undefined,
      );
      const list = listFromSipTrunksResponse(res) as Record<string, unknown>[];
      const rows: TrunkRow[] = list.map((raw, i) => {
        const r = { ...raw } as TrunkRow;
        const id = trunkIdFromRow(r) || `row-${i}`;
        r._rowKey = `${id}-${i}`;
        return r;
      });
      setData(rows);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } }; message?: string })
          ?.response?.data?.detail ||
        (err as { message?: string })?.message ||
        "Failed to load SIP trunks";
      toast.error(message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, effectiveCompanyId]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchTrunks();
  }, [fetchTrunks]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const id = trunkIdFromRow(deleteTarget).trim();
    if (!id) {
      toast.error("Cannot delete: missing trunk id on this row.");
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteSipTrunk(id);
      toast.success("SIP trunk deleted");
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchTrunks();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } }; message?: string })
          ?.response?.data?.detail ||
        (err as { message?: string })?.message ||
        "Failed to delete SIP trunk";
      toast.error(String(message));
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, fetchTrunks]);

  const toolbarRightActions = useMemo(
    () => (
      <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
        {isAdmin && (
          <Form.Select
            style={{ width: "200px", padding: "7px", borderRadius: "3px" }}
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            aria-label="Filter by company"
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        )}
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          className="d-inline-flex align-items-center gap-1"
          onClick={() => fetchTrunks()}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
        {canCreateTrunks && (
          <Button
            type="button"
            onClick={() => router.push("/voicebot/inbound/sip-trunks/create")}
            className="border-0"
            style={addTrunkButtonStyle}
          >
            <Plus size={16} />
            <span>Create trunk</span>
          </Button>
        )}
      </div>
    ),
    [
      canCreateTrunks,
      isAdmin,
      companyFilter,
      companies,
      fetchTrunks,
      loading,
      router,
    ],
  );

  const tableToolbar = useMemo(
    () => ({
      showTabs: true,
      tabs: [
        {
          id: "all",
          label: "All trunks",
          count: data.length,
          removable: false,
        },
      ],
      activeTab: "all",
      onTabChange: () => {},
      rightActions: toolbarRightActions,
    }),
    [data.length, toolbarRightActions],
  );

  const columns: TableColumn<TrunkRow>[] = [
    {
      key: "sip_trunk_id",
      label: "SIP Trunk ID",
      sortable: true,
      render: (r) => safeDisplayString(trunkIdFromRow(r) || undefined),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (r) => safeDisplayString(r.name),
    },
    {
      key: "caller_ids",
      label: "Caller IDs",
      sortable: false,
      render: (r) => (
        <span className="text-break small">{callerIdsFromRow(r) || "—"}</span>
      ),
    },
    {
      key: "company_id",
      label: "Company",
      sortable: true,
      render: (r) =>
        safeDisplayString(
          companyLabelForTrunkRow(r, companies, session) || undefined,
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        const tid = trunkIdFromRow(row).trim();
        return (
          <div className="d-flex gap-1">
            <Button
              title="View details"
              size="sm"
              variant="outline-secondary"
              onClick={() => {
                setViewRow(row);
                setShowViewModal(true);
              }}
            >
              <Eye size={14} />
            </Button>
            {canDeleteTrunks && (
              <Button
                title="Delete trunk"
                size="sm"
                variant="outline-danger"
                disabled={!tid}
                onClick={() => {
                  setDeleteTarget(row);
                  setShowDeleteModal(true);
                }}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Voicebot Inbound - SIP trunks"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex align-items-center flex-wrap gap-2">
            <h2 className="mb-0">SIP trunks</h2>
          </div>
        </Col>
      </Row>

      <GenericTable<TrunkRow>
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="No SIP trunks found for this company."
        loadingMessage="Loading SIP trunks…"
        showToolbar
        toolbar={tableToolbar}
        showToolbarActions={false}
        pagination={{
          currentPage: 1,
          rowsPerPage: 10,
          totalRows: data.length,
          pageSizeOptions: [10, 25, 50],
        }}
        uniqueKey="_rowKey"
        hover
        striped={false}
      />

      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>SIP trunk</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewRow ? (
            <div
              className="mb-0 small"
              style={{ maxHeight: "420px", overflow: "auto" }}
            >
              <table className="table table-sm table-bordered">
                <tbody>
                  {Object.entries(viewRow)
                    .filter(([k]) => k !== "_rowKey")
                    .map(([k, v]) => (
                      <tr key={k}>
                        <th className="text-muted" style={{ width: "200px" }}>
                          {k}
                        </th>
                        <td className="text-break">
                          {v != null && typeof v === "object" ? (
                            <pre className="mb-0 small">
                              {JSON.stringify(v, null, 2)}
                            </pre>
                          ) : (
                            safeDisplayString(
                              v as string | number | boolean | null | undefined,
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          if (deleteLoading) return;
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={
          deleteTarget
            ? safeDisplayString(
                (deleteTarget.name as string | undefined) ||
                  trunkIdFromRow(deleteTarget) ||
                  undefined,
              )
            : undefined
        }
        itemType="SIP trunk"
        loading={deleteLoading}
        additionalInfo={
          deleteTarget ? (
            <span className="text-muted small">
              Trunk id: <code>{trunkIdFromRow(deleteTarget) || "—"}</code>
            </span>
          ) : undefined
        }
      />
    </>
  );
};

SipTrunksPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SipTrunksPage;
