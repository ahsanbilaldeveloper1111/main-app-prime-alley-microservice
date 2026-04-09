import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getVoicebots,
  getTrunks,
  deleteVoicebot,
  type ListVoicebotsParams,
} from "@utils/voicebot/outbound";
import { GetCompanies } from "@utils/users";
import { normalizeCompaniesResponse, type CompanyOption } from "@utils/companyOptions";
import { Row, Col, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import VoicebotEditSidebar from "@components/VoiceBotEditSidebar";
import "@assets/scss/common.scss";
import { useSession } from "next-auth/react";

interface VoicebotRow {
  id?: number | string;
  bot_id?: number | string;
  company_id?: string;
  name: string;
  description?: string;
  status?: string;
  system_prompt?: string;
  first_message?: string;
  llm_model?: string;
  tts_model?: string;
  stt_model?: string;
  voice?: string;
  temperature?: number;
  max_tokens?: number;
  transfer_number?: string;
  enable_transfer?: boolean;
  idle_timeout_seconds?: number;
  max_call_duration_seconds?: number;
  [key: string]: unknown;
}

function listFromResponse<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const r = res as { results?: unknown; data?: unknown } | null | undefined;
  const list = r?.results ?? r?.data;
  return Array.isArray(list) ? (list as T[]) : [];
}

const VoicebotsPage = () => {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const [data, setData] = useState<VoicebotRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<VoicebotRow | null>(null);
  const [editSidebarOpen, setEditSidebarOpen] = useState(false);
  const [editBotId, setEditBotId] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");
  const [trunks, setTrunks] = useState<Array<{ id: string; trunk_id?: string; name?: string }>>([]);
  const [trunksFetched, setTrunksFetched] = useState(false);

  const fetchTrunks = useCallback(async () => {
    try {
      const res = await getTrunks();
      const list = listFromResponse<{ trunk_id?: string; id?: string; name?: string }>(res);
      const rows = list.map((r, i) => ({
        id: r.trunk_id ?? r.id ?? `trunk-${i}`,
        trunk_id: r.trunk_id ?? r.id,
        name: (r as { name?: string }).name ?? r.trunk_id ?? r.id ?? "",
      }));
      setTrunks(rows);
    } catch {
      setTrunks([]);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await GetCompanies();
      setCompanies(normalizeCompaniesResponse(res));
    } catch {
      setCompanies([]);
    }
  }, []);

  const fetchVoicebots = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListVoicebotsParams = { page, page_size: pageSize };
      if (companyFilter) params.company_id = companyFilter;
      if (!companyFilter && session?.user?.company_identifier) params.company_id = session?.user?.company_identifier;
      if (statusFilter) params.status = statusFilter;
      if (search?.trim()) params.search = search.trim();
      const res = await getVoicebots(params);
      const rawList = listFromResponse<VoicebotRow>(res);
      setTotalRows((res as { count?: number })?.count ?? rawList.length);
      const rows = rawList.map((r, i) => ({
        ...r,
        id: r.bot_id ?? r.id ?? `bot-${i}`,
      }));
      setData(rows);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || String(e?.message ?? "Failed to load voicebots"));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [companyFilter, statusFilter, search, page, pageSize]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const companyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier;
    if (companyIdentifier) {
      setCompanyFilter(companyIdentifier);
    }
  }, [session?.user]);

  useEffect(() => {
    if (!trunksFetched) {
      fetchTrunks().then(() => setTrunksFetched(true));
    }
  }, [trunksFetched, fetchTrunks]);

  useEffect(() => {
    if (trunksFetched) {
      fetchVoicebots();
    }
  }, [trunksFetched, fetchVoicebots]);

  const botId = (row: VoicebotRow) => String(row.bot_id ?? row.id ?? "");
  const selectedCompanyId = selectedRow?.company_id ?? companyFilter;

  const columns: TableColumn<VoicebotRow>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "trunk_id", label: "Trunk", render: (r) => (trunks.find((t) => t.id === r.trunk_id || t.trunk_id === r.trunk_id)?.name) ?? (typeof r.trunk_id === "string" ? r.trunk_id : "—") },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) =>
        r.status === "active" ? (
          <span className="status-badge success">Active</span>
        ) : (
          <span className="status-badge secondary">{r.status || "—"}</span>
        ),
    },
    ...(isAdmin ? [{ key: "company_id" as const, label: "Company", render: (r: VoicebotRow) => (companies.find((c) => c.id === r.company_id || c.company_id === r.company_id)?.name) ?? String(r.company_id ?? "—") }] : []),
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="action-icons-wrap">
          <Button
            size="sm"
            variant="outline-primary"
            className="icon-action-btn"
            onClick={() => {
              setEditBotId(botId(row));
              setEditCompanyId(String(row.company_id ?? ""));
              setEditSidebarOpen(true);
            }}
          >
            <Pencil size={12} />
          </Button>
          <Button
            size="sm"
            variant="outline-danger"
            className="icon-action-btn"
            onClick={() => {
              setSelectedRow(row);
              setShowDeleteModal(true);
            }}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      ),
    },
  ];

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    const id = botId(selectedRow);
    if (!id) {
      toast.error("Cannot delete: missing bot id");
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteVoicebot(id,  { company_id: selectedCompanyId } );
      toast.success("Voicebot deleted");
      setShowDeleteModal(false);
      setSelectedRow(null);
      fetchVoicebots();
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
        .voicebot-page .add-voicebot-btn {
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

        .voicebot-page .filter-select {
          height: 38px !important;
          border-radius: 4px !important;
          background-color: #ffffff !important;
          color: #141414 !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          padding-top: 10px;
        }

        .voicebot-page .icon-action-btn {
          width: 28px !important;
          height: 28px !important;
          min-width: 28px !important;
          min-height: 28px !important;
          padding: 0 !important;
          border: none !important;
          border-radius: 4px !important;
          background: transparent !important;
          color: #141414 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .voicebot-page .icon-action-btn:hover,
        .voicebot-page .icon-action-btn:focus,
        .voicebot-page .icon-action-btn:active {
          border: none !important;
          background: #f3f4f6 !important;
          color: #141414 !important;
          box-shadow: none !important;
        }

        .voicebot-page .action-icons-wrap {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .voicebot-page .generic-table thead th:last-child,
        .voicebot-page .generic-table tbody td:last-child {
          width: 95px !important;
          min-width: 95px !important;
          max-width: 95px !important;
          white-space: nowrap;
        }

        .voicebot-page .generic-table thead th:last-child .th-content {
          justify-content: center !important;
        }

        .voicebot-page .generic-table tbody td:last-child {
          text-align: center;
        }

          .generic-table-card {
          border: none !important;
          }
          .generic-table-responsive {
    width: 98% !important;
   
    border-radius: 0 !important;
    margin: 0 auto !important;
}
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound - Voice Bots" />
      <div
        className="voicebot-page"
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
                  Voice Bots
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
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                  <button
                   
                    className="add-voicebot-btn"
                    onClick={() => {
                      setEditBotId("");
                      setEditCompanyId("");
                      setEditSidebarOpen(true);
                    }}
                  >
                    <Plus size={18} /> Add Voice Bot
                  </button>
                </div>
              </div>
            </Col>
          </Row>

          <GenericTable<VoicebotRow>
            data={data}
            columns={columns}
            loading={loading}
            emptyMessage="No voice bots found."
            loadingMessage="Loading voice bots..."
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

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setSelectedRow(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedRow?.name}
        itemType="voice bot"
        loading={deleteLoading}
      />

      <VoicebotEditSidebar
        isOpen={editSidebarOpen}
        onClose={() => setEditSidebarOpen(false)}
        botId={editBotId}
        companyId={editCompanyId}
        onSaved={() => fetchVoicebots()}
      />
    </React.Fragment>
  );
};

VoicebotsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default VoicebotsPage;
