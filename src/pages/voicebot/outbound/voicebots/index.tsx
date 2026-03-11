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
import { Row, Col, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import "@assets/scss/common.scss";
import { useSession } from "next-auth/react";

interface CompanyOption {
  id: string;
  company_id?: string;
  name: string;
}

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

const VoicebotsPage = () => {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const router = useRouter();
  const [data, setData] = useState<VoicebotRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<VoicebotRow | null>(null);
  const [trunks, setTrunks] = useState<Array<{ id: string; trunk_id?: string; name?: string }>>([]);
  const [trunksFetched, setTrunksFetched] = useState(false);

  const fetchTrunks = useCallback(async () => {
    try {
      const res = await getTrunks();
      const list = Array.isArray(res) ? res : (res as { results?: { trunk_id?: string; id?: string; name?: string }[] })?.results ?? (res as { data?: { trunk_id?: string; id?: string; name?: string }[] })?.data ?? [];
      const rows = (Array.isArray(list) ? list : []).map((r, i) => ({
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
      if (res === false) {
        setCompanies([]);
        return;
      }
      const list = Array.isArray(res) ? res : (res as { results?: { company_id?: string; id?: string; identifier?: string; name?: string }[] })?.results ?? (res as { data?: { company_id?: string; id?: string; identifier?: string; name?: string }[] })?.data ?? [];
      const opts = (Array.isArray(list) ? list : []).map((c) => {
        const item = c as { company_id?: string; id?: string; identifier?: string; name?: string };
        const id = item.identifier ?? item.company_id ?? item.id ?? "";
        return { id, company_id: item.identifier ?? item.company_id ?? item.id, name: item.name ?? "" };
      });
      setCompanies(opts);
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
      const list = Array.isArray(res) ? res : (res as { results?: VoicebotRow[] })?.results ?? (res as { data?: VoicebotRow[] })?.data ?? [];
      const rawList = Array.isArray(list) ? list : [];
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
        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => router.push(`/voicebot/outbound/voicebots/edit?id=${encodeURIComponent(botId(row))}&company_id=${encodeURIComponent(String(row.company_id ?? ""))}`)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => {
              setSelectedRow(row);
              setShowDeleteModal(true);
            }}
          >
            <Trash2 size={14} />
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
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound - Voice Bots" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <h2 className="mb-0">Voice Bots</h2>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* <Form.Control
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "200px" }}
              /> */}
              <Form.Select
                style={{ width: "220px" }}
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="">All companies</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
             
              <Form.Select
                style={{ width: "150px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
              <Button variant="primary" onClick={() => router.push("/voicebot/outbound/voicebots/create")}>
                <Plus size={18} className="me-1" /> Add Voice Bot
              </Button>
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

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setSelectedRow(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedRow?.name}
        itemType="voice bot"
        loading={deleteLoading}
      />
    </React.Fragment>
  );
};

VoicebotsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default VoicebotsPage;
