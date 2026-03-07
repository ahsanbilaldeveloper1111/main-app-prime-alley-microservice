import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getCompanies,
  postCompanies,
  getCompany,
  putCompany,
  deleteCompany,
  activateCompany,
  deactivateCompany,
  type CreateCompanyPayload,
  type UpdateCompanyPayload,
} from "@utils/voicebot/inbound";
import { Row, Col, Button, Modal, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { Plus, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import "@assets/scss/common.scss";

interface CompanyRow {
  id?: string;
  company_id?: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  is_active?: boolean;
  subscription_tier?: string;
  max_bots?: number;
  max_calls_per_month?: number;
  [key: string]: unknown;
}

const CompaniesPage = () => {
  const router = useRouter();
  const [data, setData] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CompanyRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<CreateCompanyPayload>({
    name: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    subscription_tier: "",
    max_bots: undefined,
    max_calls_per_month: undefined,
  });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCompanies({ show_inactive: showInactive });
      const list = Array.isArray(res) ? res : (res as any)?.results ?? (res as any)?.data ?? [];
      setData(Array.isArray(list) ? list : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to load companies");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const companyId = (row: CompanyRow) => row.company_id ?? row.id ?? "";

  const columns: TableColumn<CompanyRow>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "company_id", label: "Company ID", sortable: true, render: (r) => companyId(r) || "—" },
    { key: "email", label: "Email", sortable: true, render: (r) => r.email || "—" },
    { key: "phone", label: "Phone", sortable: true, render: (r) => r.phone || "—" },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (r) =>
        r.is_active === true ? (
          <span className="status-badge success">Active</span>
        ) : (
          <span className="status-badge danger">Inactive</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => {
              setSelectedRow(row);
              setShowEditModal(true);
              setForm({
                name: row.name ?? "",
                description: (row.description as string) ?? "",
                email: (row.email as string) ?? "",
                phone: (row.phone as string) ?? "",
                website: (row.website as string) ?? "",
                subscription_tier: (row.subscription_tier as string) ?? "",
                max_bots: row.max_bots as number | undefined,
                max_calls_per_month: row.max_calls_per_month as number | undefined,
              });
            }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-success"
            onClick={async () => {
              try {
                await activateCompany(companyId(row));
                toast.success("Company activated");
                fetchCompanies();
              } catch (e: any) {
                toast.error(e?.response?.data?.detail || "Activate failed");
              }
            }}
            disabled={row.is_active === true}
          >
            <Power size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-warning"
            onClick={async () => {
              try {
                await deactivateCompany(companyId(row));
                toast.success("Company deactivated");
                fetchCompanies();
              } catch (e: any) {
                toast.error(e?.response?.data?.detail || "Deactivate failed");
              }
            }}
            disabled={row.is_active === false}
          >
            <PowerOff size={14} />
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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await postCompanies({
        ...form,
        company_id: form.company_id || undefined,
      } as CreateCompanyPayload);
      toast.success("Company created");
      setShowAddModal(false);
      setForm({ name: "", description: "", email: "", phone: "", website: "", subscription_tier: "", max_bots: undefined, max_calls_per_month: undefined });
      fetchCompanies();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Create failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow) return;
    setFormLoading(true);
    try {
      const payload: UpdateCompanyPayload = {
        name: form.name,
        description: form.description || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        website: form.website || undefined,
        subscription_tier: form.subscription_tier || undefined,
        max_bots: form.max_bots,
        max_calls_per_month: form.max_calls_per_month,
      };
      await putCompany(companyId(selectedRow), payload);
      toast.success("Company updated");
      setShowEditModal(false);
      setSelectedRow(null);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Update failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    setDeleteLoading(true);
    try {
      await deleteCompany(companyId(selectedRow));
      toast.success("Company deleted");
      setShowDeleteModal(false);
      setSelectedRow(null);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formFields = (
    <>
      <Form.Group className="mb-2">
        <Form.Label>Name *</Form.Label>
        <Form.Control
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          placeholder="Company name"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.description || ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Description"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          value={form.email || ""}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="contact@company.com"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Phone</Form.Label>
        <Form.Control
          value={form.phone || ""}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+1-555-0123"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Website</Form.Label>
        <Form.Control
          value={form.website || ""}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          placeholder="https://company.com"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Subscription tier</Form.Label>
        <Form.Control
          value={form.subscription_tier || ""}
          onChange={(e) => setForm((f) => ({ ...f, subscription_tier: e.target.value }))}
          placeholder="e.g. enterprise"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Max bots</Form.Label>
        <Form.Control
          type="number"
          value={form.max_bots ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, max_bots: e.target.value ? Number(e.target.value) : undefined }))}
          placeholder="50"
        />
      </Form.Group>
      <Form.Group className="mb-2">
        <Form.Label>Max calls per month</Form.Label>
        <Form.Control
          type="number"
          value={form.max_calls_per_month ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, max_calls_per_month: e.target.value ? Number(e.target.value) : undefined }))}
          placeholder="10000"
        />
      </Form.Group>
    </>
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Inbound - Companies" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <Button variant="link" className="p-0" onClick={() => router.push("/voicebot/inbound")}>
                ← Back
              </Button>
              <h2 className="mb-0">Companies</h2>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Form.Check
                type="switch"
                id="show-inactive"
                label="Show inactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                <Plus size={18} className="me-1" /> Add Company
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <GenericTable<CompanyRow>
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="No companies found."
        loadingMessage="Loading companies..."
        pagination={{
          currentPage: 1,
          rowsPerPage: 10,
          totalRows: data.length,
          pageSizeOptions: [10, 25, 50],
        }}
        uniqueKey="company_id"
        hover
        striped={false}
      />

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Company</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>{formFields}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading || !form.name}>
              {formLoading ? <Spinner animation="border" size="sm" /> : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setSelectedRow(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Company</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>{formFields}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedRow(null); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading || !form.name}>
              {formLoading ? <Spinner animation="border" size="sm" /> : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setSelectedRow(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedRow?.name}
        itemType="company"
        loading={deleteLoading}
      />
    </React.Fragment>
  );
};

CompaniesPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default CompaniesPage;
