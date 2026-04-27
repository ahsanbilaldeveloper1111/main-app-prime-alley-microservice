import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { useSession } from "next-auth/react";
import {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  type Location,
  type LocationPayload,
} from "@utils/staffManagement";
import { toast } from "react-toastify";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { ChevronLeft, ChevronRight, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

const ITEMS_PER_PAGE = 15;
const { PERMISSIONS } = HEADER_CONSTANTS;

const emptyForm: Partial<LocationPayload> = {
  name: "",
  zip_code: "",
  city: "",
  country: "",
  address: "",
};

const Locations = () => {
  const { data: session } = useSession();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    last_page: number;
  } | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [createForm, setCreateForm] = useState<Partial<LocationPayload>>(emptyForm);
  const [editForm, setEditForm] = useState<Partial<LocationPayload>>(emptyForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadLocations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data, pagination: p } = await getLocations({
        page,
        limit: ITEMS_PER_PAGE,
      });
      setLocations(data ?? []);
      if (p) {
        setPagination({
          page: p.page,
          limit: p.limit,
          total: p.total,
          last_page: p.last_page,
        });
      } else {
        setPagination(null);
      }
    } catch {
      setLocations([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations(currentPage);
  }, [currentPage, loadLocations]);

  const openCreateModal = () => {
    setCreateForm(emptyForm);
    setShowCreateModal(true);
  };

  const openEditModal = async (loc: Location) => {
    setEditingLocation(loc);
    setEditForm(emptyForm);
    setShowEditModal(true);
    try {
      const detail = await getLocation(loc.id);
      setEditForm({
        name: detail.name ?? "",
        zip_code: detail.zip_code ?? "",
        city: detail.city ?? "",
        country: detail.country ?? "",
        address: detail.address ?? "",
      });
    } catch {
      setEditForm({
        name: loc.name ?? "",
        zip_code: loc.zip_code ?? "",
        city: loc.city ?? "",
        country: loc.country ?? "",
        address: loc.address ?? "",
      });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = createForm.name?.toString().trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    setCreateSubmitting(true);
    try {
      await createLocation({
        name: name || undefined,
        zip_code: createForm.zip_code?.toString().trim() || undefined,
        city: createForm.city?.toString().trim() || undefined,
        country: createForm.country?.toString().trim() || undefined,
        address: createForm.address?.toString().trim() || undefined,
      });
      toast.success("Location created");
      setShowCreateModal(false);
      setCreateForm(emptyForm);
      await loadLocations(currentPage);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;
    const name = editForm.name?.toString().trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    setEditSubmitting(true);
    try {
      await updateLocation(editingLocation.id, {
        name: name || undefined,
        zip_code: editForm.zip_code?.toString().trim() || undefined,
        city: editForm.city?.toString().trim() || undefined,
        country: editForm.country?.toString().trim() || undefined,
        address: editForm.address?.toString().trim() || undefined,
      });
      toast.success("Location updated");
      setShowEditModal(false);
      setEditingLocation(null);
      setEditForm(emptyForm);
      await loadLocations(currentPage);
    } finally {
      setEditSubmitting(false);
    }
  };

  const openDeleteModal = (loc: Location) => {
    setLocationToDelete(loc);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!locationToDelete) return;
    setDeleting(true);
    try {
      await deleteLocation(locationToDelete.id);
      toast.success("Location deleted");
      setShowDeleteModal(false);
      setLocationToDelete(null);
      await loadLocations(currentPage);
    } finally {
      setDeleting(false);
    }
  };

  const truncate = (s: string | undefined, max: number) => {
    if (!s) return "—";
    return s.length <= max ? s : s.slice(0, max) + "…";
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Locations" />

      {/* <PageHeader title="Locations" showSearch={false} /> */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#1f2937", margin: 0 }}>
            Locations
          </h2>
          {pagination != null && (
            <span
              style={{
                padding: "4px 12px",
                backgroundColor: "#e5e7eb",
                borderRadius: "16px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              {pagination.total}
            </span>
          )}
        </div>

        {session?.user?.permissions?.includes(PERMISSIONS.ADD_LOCATION_STAFF_MANAGEMENT) && (
        <Button
          variant="primary"
          size="sm"
          onClick={openCreateModal}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: "600",
            padding: "8px 16px",
            borderRadius: "8px",
          }}
        >
          <Plus size={18} />
          Add Location
        </Button>
        )}
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={14} />
                    Name
                  </span>
                </th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  City
                </th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Country
                </th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Address
                </th>
                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", width: 120 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "48px 24px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <Spinner animation="border" size="sm" style={{ color: "#6366f1" }} />
                      <span style={{ fontSize: "14px", color: "#6b7280" }}>Loading locations…</span>
                    </div>
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "48px 24px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <div style={{ padding: "16px", backgroundColor: "#f3f4f6", borderRadius: "12px" }}>
                        <MapPin size={32} style={{ color: "#9ca3af" }} />
                      </div>
                      <span style={{ fontSize: "15px", fontWeight: "500", color: "#374151" }}>No locations</span>
                      
                    </div>
                  </td>
                </tr>
              ) : (
                locations.map((loc, index) => (
                  <tr
                    key={loc.id}
                    style={{
                      borderBottom: index < locations.length - 1 ? "1px solid #f3f4f6" : "none",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    <td style={{ padding: "16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                        <MapPin size={16} style={{ color: "#9ca3af", flexShrink: 0 }} />
                        {loc.name ?? "—"}
                      </span>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                      {loc.city ?? "—"}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                      {loc.country ?? "—"}
                    </td>
                    <td style={{ padding: "16px", fontSize: "13px", color: "#4b5563", maxWidth: 280 }}>
                      {truncate(loc.address, 60)}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                       
                        {session?.user?.permissions?.includes(PERMISSIONS.UPDATE_LOCATION_STAFF_MANAGEMENT) && (
                        <button
                          type="button"
                          onClick={() => openEditModal(loc)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "8px",
                            color: "#6b7280",
                            borderRadius: "8px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background-color 0.15s ease, color 0.15s ease",
                          }}
                          title="Edit"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f3f4f6";
                            e.currentTarget.style.color = "#6366f1";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#6b7280";
                          }}
                        >
                          <Pencil size={18} />
                        </button>
                        )}
                        {session?.user?.permissions?.includes(PERMISSIONS.DELETE_LOCATION_STAFF_MANAGEMENT) && (
                        
                        <button
                          type="button"
                          onClick={() => openDeleteModal(loc)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "8px",
                            color: "#6b7280",
                            borderRadius: "8px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background-color 0.15s ease, color 0.15s ease",
                          }}
                          title="Delete"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#fef2f2";
                            e.currentTarget.style.color = "#dc2626";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#6b7280";
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                        )}
                      
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.last_page > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              padding: "14px 20px",
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#fafafa",
            }}
          >
            <span style={{ fontSize: "13px", color: "#6b7280" }}>
              Showing page {pagination.page} of {pagination.last_page}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ minWidth: 36 }}
              >
                <ChevronLeft size={16} />
              </Button>
              <span style={{ padding: "6px 14px", fontSize: "13px", fontWeight: "600", color: "#374151", minWidth: 72, textAlign: "center" }}>
                {pagination.page} / {pagination.last_page}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.page >= pagination.last_page || loading}
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                style={{ minWidth: 36 }}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Location</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                value={createForm.name ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Head Office"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Zip / Postal Code</Form.Label>
              <Form.Control
                value={createForm.zip_code ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, zip_code: e.target.value }))}
                placeholder="Zip / Postal Code"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control
                value={createForm.city ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="City"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Country</Form.Label>
              <Form.Control
                value={createForm.country ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="Country"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={createForm.address ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street address"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createSubmitting}>
              {createSubmitting ? "Creating…" : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setEditingLocation(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Location</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                value={editForm.name ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Head Office"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Zip / Postal Code</Form.Label>
              <Form.Control
                value={editForm.zip_code ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, zip_code: e.target.value }))}
                placeholder="Zip / Postal Code"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control
                value={editForm.city ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="City"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Country</Form.Label>
              <Form.Control
                value={editForm.country ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="Country"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={editForm.address ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street address"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingLocation(null); }} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={editSubmitting}>
              {editSubmitting ? "Saving…" : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setLocationToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        itemName={locationToDelete?.name ? `"${locationToDelete.name}"` : locationToDelete ? `location #${locationToDelete.id}` : undefined}
        itemType="location"
        loading={deleting}
      />
    </React.Fragment>
  );
};

Locations.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Locations;
