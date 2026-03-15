import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getTrunks,
  postTrunks,
  deleteTrunk,
  type CreateTrunkPayload,
} from "@utils/voicebot/outbound";
import { Row, Col, Button, Modal, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import "@assets/scss/common.scss";

interface TrunkRow {
  id?: string;
  trunk_id?: string;
  name: string;
  address: string;
  caller_ids?: string[];
  [key: string]: unknown;
}

const TrunksPage = () => {
  const router = useRouter();
  const [data, setData] = useState<TrunkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TrunkRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    callerIdsRaw: "",
  });

  const fetchTrunks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTrunks();
      const list = Array.isArray(res) ? res : (res as { results?: TrunkRow[] })?.results ?? (res as { data?: TrunkRow[] })?.data ?? [];
      const rows = (Array.isArray(list) ? list : []).map((r, i) => ({
        ...r,
        id: r.trunk_id ?? r.id ?? `trunk-${i}`,
      }));
      setData(rows);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || String(e?.message ?? "Failed to load trunks"));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrunks();
  }, [fetchTrunks]);

  const trunkId = (row: TrunkRow) => row.trunk_id ?? row.id ?? "";

  const columns: TableColumn<TrunkRow>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "trunk_id", label: "Trunk ID", sortable: true, render: (r) => trunkId(r) || "—" },
    { key: "address", label: "Address", sortable: true, render: (r) => r.address || "—" },
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
    // {
    //   key: "actions",
    //   label: "Actions",
    //   render: (row) => (
    //     <div className="d-flex gap-1">
    //       <Button
    //         size="sm"
    //         variant="outline-danger"
    //         onClick={() => {
    //           setSelectedRow(row);
    //           setShowDeleteModal(true);
    //         }}
    //       >
    //         <Trash2 size={14} />
    //       </Button>
    //     </div>
    //   ),
    // },
  ];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const callerIds = form.callerIdsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload: CreateTrunkPayload = {
      name: form.name.trim(),
      address: form.address.trim(),
      caller_ids: callerIds,
    };
    if (!payload.name || !payload.address) {
      toast.error("Name and Address are required");
      return;
    }
    setFormLoading(true);
    try {
      await postTrunks(payload);
      toast.success("Trunk created");
      setShowAddModal(false);
      setForm({ name: "", address: "", callerIdsRaw: "" });
      fetchTrunks();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || String(e?.message ?? "Create failed"));
    } finally {
      setFormLoading(false);
    }
  };

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
      fetchTrunks();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || String(e?.message ?? "Delete failed"));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound - Trunks" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <Button variant="link" className="p-0" onClick={() => router.push("/voicebot/outbound")}>
                ← Back
              </Button>
              <h2 className="mb-0">Trunks</h2>
            </div>
            <div className="d-flex align-items-center gap-2">
             
            </div>
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
          currentPage: 1,
          rowsPerPage: 10,
          totalRows: data.length,
          pageSizeOptions: [10, 25, 50],
        }}
        uniqueKey="id"
        hover
        striped={false}
      />

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Trunk</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. Primary SIP Trunk"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address *</Form.Label>
              <Form.Control
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                required
                placeholder="e.g. sip.example.com"
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Caller IDs (comma-separated)</Form.Label>
              <Form.Control
                value={form.callerIdsRaw}
                onChange={(e) => setForm((f) => ({ ...f, callerIdsRaw: e.target.value }))}
                placeholder="e.g. +1234567890, +0987654321"
              />
              <Form.Text className="text-muted">Optional. One or more caller IDs separated by commas.</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading || !form.name.trim() || !form.address.trim()}>
              {formLoading ? <Spinner animation="border" size="sm" /> : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

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
