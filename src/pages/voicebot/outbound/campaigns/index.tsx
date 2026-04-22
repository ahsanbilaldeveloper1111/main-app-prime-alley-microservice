import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getCampaigns,
  getCampaign,
  deleteCampaign,
  postCampaignDispatch,
  postCampaignPause,
  postCampaignResume,
  postCampaignStop,
  postCampaignRedispatch,
  getCampaignStatus,
  type ListCampaignsParams,
} from "@utils/voicebot/outbound";
import { safeDisplayString } from "@utils/voicebot/formDisplay";
import { GetCompanies } from "@utils/users";
import { normalizeCompaniesResponse, type CompanyOption } from "@utils/companyOptions";
import { Row, Col, Button, Modal, Form, Spinner, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, Play, Pause, RotateCw, Square, Activity, ClipboardList, Megaphone, Bot, Phone, Timer, Layers, Check, RefreshCw } from "lucide-react";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { formatDateForTable } from "@utils/Helper";
import "@assets/scss/common.scss";

interface CampaignRow {
  id?: number | string;
  campaign_id?: number | string;
  company_id?: string;
  name: string;
  description?: string;
  voicebot_id?: number;
  trunk_id?: string;
  caller_id?: string;
  target_list?: string[];
  schedule_start?: string;
  schedule_end?: string;
  retry_attempts?: number;
  retry_interval_minutes?: number;
  status?: string;
  [key: string]: unknown;
}

function getDispatchStatusVariant(status: string): "warning" | "success" | "secondary" {
  if (status === "draft") return "warning";
  if (status === "active" || status === "running") return "success";
  return "secondary";
}

function getCampaignStatusBadgeVariant(status: string): "success" | "warning" | "primary" | "secondary" {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  if (status === "running") return "primary";
  if (status === "completed") return "success";
  if (status === "stopped") return "secondary";
  return "secondary";
}

interface CampaignRowActionsCellProps {
  row: CampaignRow;
  campaignRowId: string;
  status: string;
  effectiveCompanyId: string;
  loadingKey: string | null;
  onOpenDispatch: (row: CampaignRow, campaignRowId: string) => void;
  onPause: (row: CampaignRow) => void;
  onResume: (row: CampaignRow) => void;
  onStop: (row: CampaignRow) => void;
  onLoadStatus: (row: CampaignRow) => void;
  onOpenRedispatch: (row: CampaignRow) => void;
  onDelete: (row: CampaignRow) => void;
}

function campaignDraftDispatchControl(
  row: CampaignRow,
  id: string,
  status: string,
  loadingKey: string | null,
  onOpenDispatch: (r: CampaignRow, campaignRowId: string) => void
): React.ReactElement | null {
  if (status !== "draft") {
    return null;
  }
  return (
    <Button
      size="sm"
      variant="outline-success"
      className="icon-action-btn icon-dispatch-btn"
      onClick={() => onOpenDispatch(row, id)}
      disabled={!!loadingKey}
      title="Dispatch campaign"
    >
      {loadingKey === `dispatch-${id}` ? <Spinner animation="border" size="sm" /> : <Play size={12} />}
    </Button>
  );
}

function campaignActiveControls(
  row: CampaignRow,
  id: string,
  status: string,
  loadingKey: string | null,
  onPause: (r: CampaignRow) => void,
  onStop: (r: CampaignRow) => void
): React.ReactElement | null {
  if (status !== "active") {
    return null;
  }
  return (
    <>
      <Button size="sm" title="Pause campaign" variant="outline-warning" className="icon-action-btn icon-pause-btn" onClick={() => onPause(row)} disabled={!!loadingKey}>
        {loadingKey === `pause-${id}` ? <Spinner animation="border" size="sm" /> : <Pause size={12} />}
      </Button>
      <Button title="Stop campaign" size="sm" variant="outline-danger" className="icon-action-btn icon-stop-btn" onClick={() => onStop(row)} disabled={!!loadingKey}>
        {loadingKey === `stop-${id}` ? <Spinner animation="border" size="sm" /> : <Square size={12} />}
      </Button>
    </>
  );
}

function campaignPausedResumeControl(
  row: CampaignRow,
  id: string,
  status: string,
  loadingKey: string | null,
  onResume: (r: CampaignRow) => void
): React.ReactElement | null {
  if (status !== "paused") {
    return null;
  }
  return (
    <Button size="sm" title="Resume campaign" variant="outline-info" className="icon-action-btn icon-resume-btn" onClick={() => onResume(row)} disabled={!!loadingKey}>
      {loadingKey === `resume-${id}` ? <Spinner animation="border" size="sm" /> : <RotateCw size={12} />}
    </Button>
  );
}

/** Redispatch is only available for stopped or completed campaigns (API). */
function campaignRedispatchButton(
  row: CampaignRow,
  id: string,
  status: string,
  loadingKey: string | null,
  onOpenRedispatch: (r: CampaignRow) => void,
): React.ReactElement | null {
  if (status !== "stopped" && status !== "completed") {
    return null;
  }
  return (
    <Button
      size="sm"
      title="Redispatch: reset campaign and call all numbers from scratch"
      variant="outline-primary"
      className="icon-action-btn icon-redispatch-btn"
      onClick={() => onOpenRedispatch(row)}
      disabled={!!loadingKey}
    >
      {loadingKey === `redispatch-${id}` ? <Spinner animation="border" size="sm" /> : <RefreshCw size={12} />}
    </Button>
  );
}

type CampaignLifecycleContext = Readonly<{
  isCompleted: boolean;
  row: CampaignRow;
  id: string;
  status: string;
  loadingKey: string | null;
  onOpenDispatch: (r: CampaignRow, campaignRowId: string) => void;
  onPause: (r: CampaignRow) => void;
  onResume: (r: CampaignRow) => void;
  onStop: (r: CampaignRow) => void;
}>;

function campaignRowLifecycleActions(ctx: CampaignLifecycleContext): React.ReactElement | null {
  if (ctx.isCompleted) {
    return null;
  }
  const { row, id, status, loadingKey, onOpenDispatch, onPause, onResume, onStop } = ctx;
  return (
    <>
      {campaignDraftDispatchControl(row, id, status, loadingKey, onOpenDispatch)}
      {campaignActiveControls(row, id, status, loadingKey, onPause, onStop)}
      {campaignPausedResumeControl(row, id, status, loadingKey, onResume)}
    </>
  );
}

function CampaignRowActionsCell(props: Readonly<CampaignRowActionsCellProps>) {
  const {
    row,
    campaignRowId: id,
    status,
    effectiveCompanyId,
    loadingKey,
    onOpenDispatch,
    onPause,
    onResume,
    onStop,
    onLoadStatus,
    onOpenRedispatch,
    onDelete,
  } = props;
  const isCompleted = status === "completed";
  const editCompanyParam = encodeURIComponent(String(row.company_id ?? effectiveCompanyId ?? ""));

  return (
    <div className="action-icons-wrap">
      <Link href={`/voicebot/outbound/campaigns/edit/${id}?company_id=${editCompanyParam}`}>
        <Button size="sm" variant="outline-primary" className="icon-action-btn icon-edit-btn" title="Edit campaign">
          <Pencil size={12} />
        </Button>
      </Link>
      {campaignRowLifecycleActions({
        isCompleted,
        row,
        id,
        status,
        loadingKey,
        onOpenDispatch,
        onPause,
        onResume,
        onStop,
      })}
      {campaignRedispatchButton(row, id, status, loadingKey, onOpenRedispatch)}
      <Button size="sm" variant="outline-secondary" className="icon-action-btn icon-status-btn" onClick={() => onLoadStatus(row)} title="Campaign status">
        <Activity size={12} />
      </Button>
      <Button title="Delete campaign" size="sm" variant="outline-danger" className="icon-action-btn icon-delete-btn" onClick={() => onDelete(row)}>
        <Trash2 size={12} />
      </Button>
    </div>
  );
}

const CampaignsPage = () => {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const [data, setData] = useState<CampaignRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CampaignRow | null>(null);
  const [opLoading, setOpLoading] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchSummaryData, setDispatchSummaryData] = useState<Record<string, unknown> | null>(null);
  const [dispatchSummaryLoading, setDispatchSummaryLoading] = useState(false);
  const [rowToDispatch, setRowToDispatch] = useState<CampaignRow | null>(null);
  const [showRedispatchModal, setShowRedispatchModal] = useState(false);
  const [rowToRedispatch, setRowToRedispatch] = useState<CampaignRow | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await GetCompanies();
      setCompanies(normalizeCompaniesResponse(res, { prefer: "company_id" }));
    } catch {
      setCompanies([]);
    }
  }, []);

  const companyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier ?? "";
  const effectiveCompanyId = isAdmin ? companyFilter : companyIdentifier || companyFilter;

  const fetchCampaigns = useCallback(async () => {
    if (!isAdmin && !companyIdentifier) return;
    setLoading(true);
    try {
      const params: ListCampaignsParams = { page, page_size: pageSize };
      if (effectiveCompanyId) params.company_id = effectiveCompanyId;
      if (statusFilter) params.status = statusFilter;
      const res = await getCampaigns(params);
      const list = Array.isArray(res)
        ? res
        : (res as { results?: CampaignRow[] })?.results ?? (res as { data?: CampaignRow[] })?.data ?? [];
      const rawList = Array.isArray(list) ? list : [];
      setTotalRows((res as { count?: number })?.count ?? rawList.length);
      const rows = rawList.map((r, i) => ({
        ...r,
        id: r.campaign_id ?? r.id ?? `campaign-${i}`,
      }));
      setData(rows);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || String(e?.message ?? "Failed to load campaigns"));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId, companyIdentifier, isAdmin, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (companyIdentifier) {
      setCompanyFilter(companyIdentifier);
    }
  }, [companyIdentifier]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const campaignId = (row: CampaignRow) => String(row.campaign_id ?? row.id ?? "");
  const selectedCompanyId = selectedRow?.company_id ?? effectiveCompanyId;

  const handleRedispatchConfirm = async () => {
    if (!rowToRedispatch) return;
    const id = campaignId(rowToRedispatch);
    const companyId = String(rowToRedispatch.company_id ?? effectiveCompanyId ?? "");
    if (!id) {
      toast.error("Missing campaign id");
      return;
    }
    setOpLoading(`redispatch-${id}`);
    try {
      const payload = companyId ? { company_id: companyId } : undefined;
      await postCampaignRedispatch(id, payload);
      toast.success("Campaign redispatched");
      setShowRedispatchModal(false);
      setRowToRedispatch(null);
      fetchCampaigns();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || String(e?.message ?? "Redispatch failed"));
    } finally {
      setOpLoading(null);
    }
  };

  const handleOp = async (
    op: "dispatch" | "pause" | "resume" | "stop",
    row: CampaignRow
  ) => {
    const id = campaignId(row);
    const companyId = String(row.company_id ?? effectiveCompanyId ?? "");
    if (id) {
    setOpLoading(`${op}-${id}`);
    try {
      const payload = companyId ? { company_id: companyId } : undefined;
      if (op === "dispatch") await postCampaignDispatch(id, payload);
      else if (op === "pause") await postCampaignPause(id, payload);
      else if (op === "resume") await postCampaignResume(id, payload);
      else if (op === "stop") await postCampaignStop(id, payload);
      toast.success(`Campaign ${op} succeeded`);
      fetchCampaigns();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || String(e?.message ?? `${op} failed`));
    } finally {
      setOpLoading(null);
    }
    } else {
      toast.error("Missing campaign id");
    }
  };

  const openDispatchModal = useCallback(
    (row: CampaignRow, id: string) => {
      setRowToDispatch(row);
      setShowDispatchModal(true);
      setDispatchSummaryData(null);
      setDispatchSummaryLoading(true);
      const cid = String(row.company_id ?? effectiveCompanyId ?? "");
      if (cid) {
        getCampaign(id, { company_id: cid })
          .then((res: Record<string, unknown>) => {
            const detail = (res?.data ?? res) as Record<string, unknown>;
            setDispatchSummaryData(detail);
          })
          .catch(() => {
            toast.error("Failed to load campaign summary");
            setShowDispatchModal(false);
            setRowToDispatch(null);
          })
          .finally(() => setDispatchSummaryLoading(false));
      } else {
        setDispatchSummaryLoading(false);
      }
    },
    [effectiveCompanyId]
  );

  const loadStatus = useCallback(
    async (row: CampaignRow) => {
      const id = campaignId(row);
      const companyId = String(row.company_id ?? effectiveCompanyId ?? "");
      setStatusLoading(true);
      setStatusData(null);
      setSelectedRow(row);
      setShowStatusModal(true);
      try {
        const params = companyId ? { company_id: companyId } : undefined;
        const res = await getCampaignStatus(id, params);
        setStatusData(typeof res === "object" ? res : { data: res });
      } catch (err: unknown) {
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        toast.error(e?.response?.data?.detail || String(e?.message ?? "Failed to load status"));
      } finally {
        setStatusLoading(false);
      }
    },
    [companyFilter]
  );

  const columns: TableColumn<CampaignRow>[] = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) => {
        const s = String(r.status ?? "—");
        const variant = getCampaignStatusBadgeVariant(s);
        return <Badge className="status-badge text-capitalize" bg={variant}>{s}</Badge>;
      },
    },
    {
      key: "voicebot_name",
      label: "Bot",
      render: (r) => safeDisplayString(r.voicebot_name),
    },
    {
      key: "company_id",
      label: "Company",
      render: (r) => {
        const cid = r.company_id;
        if (cid) {
          const company = companies.find((c) => c.id === cid || c.company_id === cid);
          return company?.name ?? cid;
        }
        return "—";
      },
    },

    { key: "created_at", label: "Created At", render: (r) => formatDateForTable(r.created_at as string | undefined) || "—" },
    
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <CampaignRowActionsCell
          row={row}
          campaignRowId={campaignId(row)}
          status={String(row.status ?? "")}
          effectiveCompanyId={effectiveCompanyId}
          loadingKey={opLoading}
          onOpenDispatch={openDispatchModal}
          onPause={(r) => handleOp("pause", r)}
          onResume={(r) => handleOp("resume", r)}
          onStop={(r) => handleOp("stop", r)}
          onLoadStatus={loadStatus}
          onOpenRedispatch={(r) => {
            setRowToRedispatch(r);
            setShowRedispatchModal(true);
          }}
          onDelete={(r) => {
            setSelectedRow(r);
            setShowDeleteModal(true);
          }}
        />
      ),
    },
  ];

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    const id = campaignId(selectedRow);
    if (!id) {
      toast.error("Cannot delete: missing campaign id");
      return;
    }
    setDeleteLoading(true);
    try {
      const params = selectedCompanyId ? { company_id: selectedCompanyId } : undefined;
      await deleteCampaign(id, params);
      toast.success("Campaign deleted");
      setShowDeleteModal(false);
      setSelectedRow(null);
      fetchCampaigns();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || String(e?.message ?? "Delete failed"));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <React.Fragment>
      <style jsx global>{`
        .voicebot-campaign-page .add-campaign-btn {
          padding: 9px 13px !important;
          height: 38px !important;
          background-color: rgb(0, 0, 0) !important;
          color: rgb(255, 255, 255) !important;
          border: none !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
        }

        .voicebot-campaign-page .filter-select {
          height: 38px !important;
          border-radius: 4px !important;
          background-color: #ffffff !important;
          color: #141414 !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          padding-top: 10px;
        }

        .voicebot-campaign-page .icon-action-btn {
          width: 28px !important;
          height: 28px !important;
          min-width: 28px !important;
          min-height: 28px !important;
          padding: 0 !important;
          border: none !important;
          border-radius: 4px !important;
          background: transparent !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: none !important;
        }

        .voicebot-campaign-page .icon-edit-btn,
        .voicebot-campaign-page .icon-status-btn {
          color: #374151 !important;
        }

        .voicebot-campaign-page .icon-dispatch-btn,
        .voicebot-campaign-page .icon-resume-btn,
        .voicebot-campaign-page .icon-redispatch-btn {
          color: #047857 !important;
        }

        .voicebot-campaign-page .icon-pause-btn {
          color: #b45309 !important;
        }

        .voicebot-campaign-page .icon-stop-btn,
        .voicebot-campaign-page .icon-delete-btn {
          color: #b91c1c !important;
        }

        .voicebot-campaign-page .icon-action-btn:hover,
        .voicebot-campaign-page .icon-action-btn:focus,
        .voicebot-campaign-page .icon-action-btn:active {
          border: none !important;
          background: #f3f4f6 !important;
          box-shadow: none !important;
        }

        .voicebot-campaign-page .action-icons-wrap {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          flex-wrap: nowrap;
        }

        .voicebot-campaign-page .generic-table thead th:last-child,
        .voicebot-campaign-page .generic-table tbody td:last-child {
          width: 196px !important;
          min-width: 196px !important;
          max-width: 196px !important;
          white-space: nowrap;
        }

        .voicebot-campaign-page .generic-table thead th:last-child .th-content {
          justify-content: center !important;
        }

        .voicebot-campaign-page .generic-table tbody td:last-child {
          text-align: center;
        }

        .voicebot-campaign-page .generic-table-card {
          border: none !important;
        }

        .voicebot-campaign-page .generic-table-responsive {
          width: 98% !important;
          border-radius: 0 !important;
          margin: 0 auto !important;
        }
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound - Campaigns" />
      <div
        className="voicebot-campaign-page"
        style={{
          display: "flex",
          gap: "0",
          height: "calc(100vh)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            backgroundColor: "#ffffff",
            marginRight: "6px",
          }}
        >
          <Row className="mb-3">
            <Col md={12}>
              <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap ps-3 pe-3 gap-2">
                <h1 style={{ fontWeight: 300, color: "#141414", fontSize: "24px", margin: 0 }}>
                  Campaigns
                </h1>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {isAdmin && (
                    <Form.Select
                      className="filter-select"
                      style={{ width: "220px" }}
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                    >
                      <option value="">All companies</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                  <Form.Select
                    className="filter-select"
                    style={{ width: "150px" }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="running">Running</option>
                    <option value="stopped">Stopped</option>
                    <option value="completed">Completed</option>
                  </Form.Select>
                  <Link href="/voicebot/outbound/campaigns/create">
                    <button className="add-campaign-btn">
                      <Plus size={18} /> Add Campaign
                    </button>
                  </Link>
                </div>
              </div>
            </Col>
          </Row>

          <GenericTable<CampaignRow>
            data={data}
            columns={columns}
            loading={loading}
            emptyMessage="No campaigns found."
            loadingMessage="Loading campaigns..."
            pagination={{
              currentPage: page,
              rowsPerPage: pageSize,
              totalRows: totalRows || data.length,
              pageSizeOptions: [10, 25, 50],
            }}
            onPaginationChange={(newPage, newRowsPerPage) => {
              setPage(newPage);
              setPageSize(newRowsPerPage);
            }}
            uniqueKey="id"
            hover
            striped={false}
          />
        </div>
      </div>

      {/* Campaign Summary / Dispatch Modal */}
      <Modal show={showDispatchModal} onHide={() => { setShowDispatchModal(false); setRowToDispatch(null); setDispatchSummaryData(null); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <ClipboardList size={20} />
            Campaign Summary
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(() => {
            if (dispatchSummaryLoading) {
              return (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              );
            }
            if (dispatchSummaryData) {
              return (
            <>
              <Row>
                <Col md={6}>
                  <h6 className="d-flex align-items-center gap-2 mb-3" style={{ fontWeight: 600, color: "#1f2937" }}>
                    <Megaphone size={18} />
                    Campaign Details
                  </h6>
                  <p className="mb-1"><strong>Name:</strong> {String(dispatchSummaryData.name ?? "—")}</p>
                  <p className="mb-1">
                    <strong>Status:</strong>{" "}
                    <Badge bg={getDispatchStatusVariant(String(dispatchSummaryData.status ?? ""))}>
                      {String(dispatchSummaryData.status ?? "—")}
                    </Badge>
                  </p>
                  <p className="mb-1">
                    <strong>Total Numbers:</strong>{" "}
                    <span style={{ color: "#059669" }}>
                      {Array.isArray(dispatchSummaryData.target_numbers) ? dispatchSummaryData.target_numbers.length : Number(dispatchSummaryData.total_numbers ?? 0)}
                    </span>
                  </p>
                  {String(dispatchSummaryData.description ?? "").trim() ? (
                    <p className="mb-2 mt-2"><strong>Description:</strong> {String(dispatchSummaryData.description)}</p>
                  ) : null}
                </Col>
                <Col md={6}>
                  <h6 className="d-flex align-items-center gap-2 mb-3" style={{ fontWeight: 600, color: "#1f2937" }}>
                    <Bot size={18} />
                    VoiceBot Configuration
                  </h6>
                  {(() => {
                    const vb = dispatchSummaryData.voicebot as Record<string, unknown> | undefined;
                    if (!vb) return <p className="text-muted small">No VoiceBot linked.</p>;
                    return (
                      <>
                        <p className="mb-1"><strong>VoiceBot:</strong> {safeDisplayString(vb.name, safeDisplayString(dispatchSummaryData.voicebot_name))}</p>
                        <p className="mb-1"><strong>Voice Model:</strong> <span style={{ color: "#059669" }}>{safeDisplayString(vb.voice_model)}</span></p>
                        <p className="mb-1"><strong>Language:</strong> <span style={{ color: "#059669" }}>{safeDisplayString(vb.language)}</span></p>
                        <p className="mb-1"><strong>TTS Provider:</strong> <span style={{ color: "#059669" }}>{safeDisplayString(vb.tts_provider)}</span></p>
                      </>
                    );
                  })()}
                </Col>
              </Row>
              <Row className="mt-3">
                <Col xs={12} md={4}>
                  <div className="p-2 rounded bg-light d-flex align-items-center gap-2">
                    <Phone size={16} />
                    <div>
                      <small className="text-muted d-block">Trunk ID</small>
                      <span className="small">{safeDisplayString((dispatchSummaryData.voicebot as Record<string, unknown> | undefined)?.trunk_id)}</span>
                    </div>
                  </div>
                </Col>
                <Col xs={12} md={4}>
                  <div className="p-2 rounded bg-light d-flex align-items-center gap-2">
                    <Timer size={16} />
                    <div>
                      <small className="text-muted d-block">Max Duration</small>
                      <span className="small">
                        {(() => {
                          const vbRec = dispatchSummaryData.voicebot as Record<string, unknown> | undefined;
                          const sec = typeof vbRec?.max_call_duration === "number" ? vbRec.max_call_duration : undefined;
                          if (sec != null) {
                          const m = Math.floor(sec / 60);
                          const suffix = m > 0 ? " (" + m + "m)" : "";
                          return String(sec) + "s" + suffix;
                        }
                        return "—";
                        })()}
                      </span>
                    </div>
                  </div>
                </Col>
                <Col xs={12} md={4}>
                  <div className="p-2 rounded bg-light d-flex align-items-center gap-2">
                    <Layers size={16} />
                    <div>
                      <small className="text-muted d-block">Concurrency</small>
                      <span className="small">
                        {(() => {
                          const v = dispatchSummaryData.voicebot as Record<string, unknown> | undefined;
                          const limit = v?.concurrency_limit;
                          if (limit == null) return "—";
                          return safeDisplayString(limit, "—") + " calls";
                        })()}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
              <div className="mt-4 pt-3 border-top">
                <h6 className="d-flex align-items-center gap-2 mb-3" style={{ fontWeight: 600, color: "#1f2937" }}>
                  <Check size={18} color="#059669" />
                  Pre-Dispatch Validation
                </h6>
                <div className="d-flex flex-column gap-2">
                  {(() => {
                    const vb = dispatchSummaryData.voicebot as Record<string, unknown> | undefined;
                    const targetCount = Array.isArray(dispatchSummaryData.target_numbers) ? dispatchSummaryData.target_numbers.length : Number(dispatchSummaryData.total_numbers ?? 0);
                    const scriptOk = String(dispatchSummaryData.campaign_script ?? "").trim().length > 0;
                    const items = [
                      { ok: safeDisplayString(vb?.status, "") === "active", label: "VoiceBot is active" },
                      { ok: !!vb?.trunk_id, label: "Trunk is configured" },
                      { ok: targetCount > 0, label: `${targetCount} target number${targetCount === 1 ? "" : "s"} loaded` },
                      { ok: scriptOk, label: "Campaign script is configured" },
                    ];
                    return items.map((item) => (
                      <div
                        key={item.label}
                        className="d-flex align-items-center gap-2 px-3 py-2 rounded"
                        style={{
                          backgroundColor: item.ok ? "#d1fae5" : "#f3f4f6",
                          color: item.ok ? "#047857" : "#6b7280",
                        }}
                      >
                        
                        <span style={{ fontWeight: 500 }}>{item.ok ? "✓ " : ""}{item.label}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </>
              );
            }
            return <p className="text-muted mb-0">No campaign data to display.</p>;
          })()}
        </Modal.Body>
        {dispatchSummaryData && !dispatchSummaryLoading && (
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowDispatchModal(false); setRowToDispatch(null); setDispatchSummaryData(null); }}>
              Cancel
            </Button>
            <Button
              variant="success"
              disabled={!!opLoading}
              onClick={async () => {
                if (!rowToDispatch) return;
                await handleOp("dispatch", rowToDispatch);
                setShowDispatchModal(false);
                setRowToDispatch(null);
                setDispatchSummaryData(null);
              }}
            >
              {opLoading && rowToDispatch && opLoading === `dispatch-${campaignId(rowToDispatch)}` ? <Spinner animation="border" size="sm" className="me-1" /> : null}
              Confirm Dispatch
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      <Modal
        show={showRedispatchModal}
        onHide={() => {
          if (opLoading?.startsWith("redispatch-")) return;
          setShowRedispatchModal(false);
          setRowToRedispatch(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Redispatch campaign</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            This resets <strong>{rowToRedispatch?.name ?? "this campaign"}</strong> and calls all numbers again from scratch. Only use this for
            campaigns in <strong>stopped</strong> or <strong>completed</strong> state.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            disabled={!!opLoading && rowToRedispatch ? opLoading === `redispatch-${campaignId(rowToRedispatch)}` : false}
            onClick={() => {
              setShowRedispatchModal(false);
              setRowToRedispatch(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="success" onClick={() => void handleRedispatchConfirm()} disabled={!rowToRedispatch || !!opLoading}>
            {rowToRedispatch && opLoading === `redispatch-${campaignId(rowToRedispatch)}` ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Redispatching…
              </>
            ) : (
              "Confirm redispatch"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setSelectedRow(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedRow?.name}
        itemType="campaign"
        loading={deleteLoading}
      />

      {/* Campaign Status Modal */}
      <Modal show={showStatusModal} onHide={() => { setShowStatusModal(false); setStatusData(null); }} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Campaign Status {selectedRow?.name ? `— ${selectedRow.name}` : ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(() => {
            if (statusLoading) {
              return (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              );
            }
            if (statusData) {
            return (
            (() => {
              const data = (statusData.data ?? statusData) as Record<string, unknown>;
              const campaignStatus = safeDisplayString(data.campaign_status);
              const totalNumbers = Number(data.total_numbers ?? 0);
              const dispatched = Number(data.dispatched ?? 0);
              const inProgress = Number(data.in_progress ?? 0);
              const completed = Number(data.completed ?? 0);
              const failed = Number(data.failed ?? 0);
              const successRate = Number(data.success_rate ?? 0);
              const avgCallDuration = Number(data.avg_call_duration ?? 0);
              const totalCost = Number(data.total_cost ?? 0);
              const formatDuration = (sec: number) => (sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`);
              let statusVariant: "success" | "primary" | "secondary" = "secondary";
              if (campaignStatus === "completed") statusVariant = "success";
              else if (campaignStatus === "running" || campaignStatus === "active") statusVariant = "primary";

              const cards: { label: string; value: string; isStatus?: boolean }[] = [
                { label: "Campaign Status", value: campaignStatus, isStatus: true },
                { label: "Total Numbers", value: String(totalNumbers) },
                { label: "Dispatched", value: String(dispatched) },
                { label: "In Progress", value: String(inProgress) },
                { label: "Completed", value: String(completed) },
                { label: "Failed", value: String(failed) },
                { label: "Success Rate", value: `${Number(successRate).toFixed(1)}%` },
                { label: "Avg Call Duration", value: formatDuration(avgCallDuration) },
                { label: "Total Cost", value: String(totalCost) },
              ];
              return (
                <div className="row g-3">
                  {cards.map((card) => (
                    <div key={card.label} className="col-6 col-md-4">
                      <div className="card h-100 border rounded">
                        <div className="card-body py-3 px-3">
                          <div className="small text-muted mb-1">{card.label}</div>
                          <div className="fw-semibold">
                            {card.isStatus ? (
                              <Badge bg={statusVariant} className="text-capitalize">{card.value}</Badge>
                            ) : (
                              card.value
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })() );
            }
            return <p className="text-muted mb-0">No status data.</p>;
          })()}
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

CampaignsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default CampaignsPage;
