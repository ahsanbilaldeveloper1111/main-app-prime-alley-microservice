import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import TrunkCreateSidebar from "@components/TrunkCreateSidebar";
import { getTrunks, deleteTrunk } from "@utils/voicebot/outbound";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { Plus, Trash2 } from "lucide-react";
import "@assets/scss/common.scss";

interface TrunkRow {
  id?: string;
  trunk_id?: string;
  name: string;
  address?: string;
  transport?: string;
  caller_ids?: string[];
  status?: string;
  [key: string]: unknown;
}

function listFromResponse<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const r = res as { results?: unknown; data?: unknown } | null | undefined;
  const list = r?.results ?? r?.data;
  return Array.isArray(list) ? (list as T[]) : [];
}

const TRANSPORT_LABEL: Record<string, string> = {
  "0": "UDP",
  "1": "TCP",
  "2": "TLS",
  "3": "WSS",
};

function formatTransport(v: unknown): string {
  if (v == null || v === "") return "—";
  const s = typeof v === "string" || typeof v === "number" ? String(v) : "";
  if (!s) return "—";
  const label = TRANSPORT_LABEL[s];
  return label ? `${label} (${s})` : s;
}

const TrunksPage = () => {
  const [data, setData] = useState<TrunkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TrunkRow | null>(null);

  const fetchTrunks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTrunks();
      const raw = listFromResponse<TrunkRow>(res);
      if (
        res &&
        typeof res === "object" &&
        "status" in res &&
        (res as { status?: boolean }).status === false
      ) {
        const msg =
          (res as { detail?: string; message?: string }).detail ||
          (res as { message?: string }).message ||
          "Failed to load trunks";
        toast.error(msg);
        setData([]);
        setTotalRows(0);
        return;
      }
      const rows = raw.map((r, i) => ({
        ...r,
        id: r.trunk_id ?? r.id ?? `trunk-${i}`,
      }));
      setData(rows);
      setTotalRows((res as { count?: number })?.count ?? rows.length);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || String(e?.message ?? "Failed to load trunks"));
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrunks();
  }, [fetchTrunks]);

  const trunkId = (row: TrunkRow) => row.trunk_id ?? row.id ?? "";

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    const id = trunkId(selectedRow);
    if (!id) {
      toast.error("Cannot delete: missing trunk id");
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteTrunk(id);
      toast.success("Trunk deleted");
      setShowDeleteModal(false);
      setSelectedRow(null);
      await fetchTrunks();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || String(e?.message ?? "Delete failed"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: TableColumn<TrunkRow>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "trunk_id", label: "Trunk ID", sortable: true, render: (r) => trunkId(r) || "—" },
    { key: "address", label: "Address", sortable: true, render: (r) => (typeof r.address === "string" ? r.address : "—") },
    {
      key: "transport",
      label: "Transport",
      sortable: true,
      render: (r) => formatTransport(r.transport),
    },
    {
      key: "caller_ids",
      label: "Caller IDs",
      sortable: false,
      render: (r) => {
        const ids = r.caller_ids;
        if (!ids || !Array.isArray(ids)) return "—";
        return ids.length ? ids.join(", ") : "—";
      },
    },
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
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="action-icons-wrap">
          <Button
            size="sm"
            variant="outline-danger"
            className="icon-action-btn"
            onClick={() => {
              setSelectedRow(row);
              setShowDeleteModal(true);
            }}
            title="Delete trunk"
            aria-label="Delete trunk"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <React.Fragment>
      <style jsx global>{`
        .voicebot-page .add-trunk-btn {
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
        .voicebot-page .generic-table-card {
          border: none !important;
        }
        .voicebot-page .generic-table-responsive {
          width: 98% !important;
          border-radius: 0 !important;
          margin: 0 auto !important;
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
          color: #dc3545 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .voicebot-page .icon-action-btn:hover,
        .voicebot-page .icon-action-btn:focus,
        .voicebot-page .icon-action-btn:active {
          background: #fee2e2 !important;
          color: #b91c1c !important;
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
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound - Trunks" />
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
                  Trunks
                </h1>
                <button
                  type="button"
                  className="add-trunk-btn"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus size={18} />
                  Add Trunk
                </button>
              </div>
            </Col>
          </Row>

          <GenericTable<TrunkRow>
            data={data}
            columns={columns}
            loading={loading}
            emptyMessage="No trunks found."
            loadingMessage="Loading trunks..."
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

      <TrunkCreateSidebar
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          fetchTrunks().catch(() => undefined);
        }}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedRow(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedRow?.name}
        itemType="trunk"
        loading={deleteLoading}
      />
    </React.Fragment>
  );
};

TrunksPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default TrunksPage;
