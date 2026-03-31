import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import {
  createProductCategory,
  deleteProductCategory,
  getProductCategoriesList,
  type ProductCategoryData,
  updateProductCategory,
} from "@utils/accounts";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";

type ProductCategoryRow = ProductCategoryData & {
  is_active?: boolean;
};

const ManageCategories = () => {

  const requestIdRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategoryRow[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [addCategoryPayload, setAddCategoryPayload] = useState<{
    name: string;
    description: string;
    is_active: boolean;
  }>({
    name: "",
    description: "",
    is_active: true,
  });
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);

  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategoryRow | null>(
    null,
  );
  const [editCategoryPayload, setEditCategoryPayload] = useState<{
    name: string;
    description: string;
    is_active: boolean;
  }>({
    name: "",
    description: "",
    is_active: true,
  });
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [editCategoryError, setEditCategoryError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategoryRow | null>(
    null,
  );
  const [deletingCategory, setDeletingCategory] = useState(false);

  const fetchCategories = useCallback(async () => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setLoading(true);
    setError(null);
    try {
      const response = await getProductCategoriesList({ search: searchValue });

      if (currentRequestId !== requestIdRef.current) return;

      console.log("Product categories response:", response);
      setCategories(Array.isArray(response) ? response : []);
    } catch (e: any) {
      if (currentRequestId !== requestIdRef.current) return;

      console.error("Failed to fetch product categories:", e);
      setError(e?.message || "Failed to fetch product categories");
      setCategories([]);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [searchValue]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAddCategoryModal = useCallback(() => {
    setAddCategoryPayload({
      name: "",
      description: "",
      is_active: true,
    });
    setAddCategoryError(null);
    setShowAddCategoryModal(true);
  }, []);

  const openEditCategoryModal = useCallback((category: ProductCategoryRow) => {
    setEditingCategory(category);
    setEditCategoryPayload({
      name: category.name ?? "",
      description: category.description ?? "",
      is_active: category.is_active ?? true,
    });
    setEditCategoryError(null);
    setShowEditCategoryModal(true);
  }, []);

  const openDeleteCategoryModal = useCallback((category: ProductCategoryRow) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  }, []);

  const submitAddCategory = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const name = addCategoryPayload.name.trim();
      if (!name) {
        setAddCategoryError("Name is mandatory");
        return;
      }

      setCreatingCategory(true);
      setAddCategoryError(null);
      try {
        const payload = {
          name,
          description: addCategoryPayload.description,
          is_active: addCategoryPayload.is_active,
        };
        const created = await createProductCategory(payload);
        console.log("Created product category:", created);
        setShowAddCategoryModal(false);
        await fetchCategories();
      } catch (err: any) {
        console.error("Failed to create product category:", err);
        setAddCategoryError(err?.message || "Failed to create product category");
      } finally {
        setCreatingCategory(false);
      }
    },
    [addCategoryPayload, fetchCategories],
  );

  const submitEditCategory = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingCategory) return;

      const name = editCategoryPayload.name.trim();
      if (!name) {
        setEditCategoryError("Name is mandatory");
        return;
      }

      setUpdatingCategory(true);
      setEditCategoryError(null);
      try {
        const payload = {
          name,
          description: editCategoryPayload.description ?? "",
          is_active: editCategoryPayload.is_active,
        };
        const updated = await updateProductCategory(editingCategory.id, payload);
        console.log("Updated product category:", updated);
        setShowEditCategoryModal(false);
        setEditingCategory(null);
        await fetchCategories();
      } catch (err: any) {
        console.error("Failed to update product category:", err);
        setEditCategoryError(err?.message || "Failed to update product category");
      } finally {
        setUpdatingCategory(false);
      }
    },
    [editCategoryPayload, editingCategory, fetchCategories],
  );

  const confirmDeleteCategory = useCallback(async () => {
    if (!categoryToDelete) return;
    setDeletingCategory(true);
    try {
      await deleteProductCategory(categoryToDelete.id);
      console.log("Deleted product category:", categoryToDelete);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      await fetchCategories();
    } catch (err: any) {
      console.error("Failed to delete product category:", err);
    } finally {
      setDeletingCategory(false);
    }
  }, [categoryToDelete, fetchCategories]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Manage Categories" />

      <PageHeader
        title="Manage Categories"
        showSearch={true}
        searchPlaceholder="Search categories..."
        searchValue={searchValue}
        onSearchChange={(value) => setSearchValue(value)}
        buttons={
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={openAddCategoryModal}>
              Add Category
            </Button>
            
          </div>
        }
      />

      <Row className="mt-3">
        <Col xs={12}>
          <Card>
            <Card.Body>
              {error ? (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              ) : null}

              {loading ? (
                <div className="d-flex align-items-center gap-2">
                  <Spinner size="sm" />
                  <span>Loading categories…</span>
                </div>
              ) : (
                <Table responsive bordered hover className="mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>ID</th>
                      <th>Name</th>
                      <th style={{ width: 140 }}>Description</th>
                      <th style={{ width: 140 }}>Active</th>
                      <th style={{ width: 170 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length ? (
                      categories.map((c) => (
                        <tr key={c.id}>
                          <td>{c.id}</td>
                          <td>{c.name}</td>
                          <td>{c.description ?? "-"}</td>
                          <td>{c.is_active === false ? "Inactive" : "Active"}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => openEditCategoryModal(c)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => openDeleteCategoryModal(c)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">
                          No categories found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal
        show={showAddCategoryModal}
        onHide={() => {
          if (!creatingCategory) setShowAddCategoryModal(false);
        }}
        centered
      >
        <Form onSubmit={submitAddCategory}>
          <Modal.Header closeButton>
            <Modal.Title>Add Category</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {addCategoryError ? (
              <Alert variant="danger" className="mb-3">
                {addCategoryError}
              </Alert>
            ) : null}

            <Form.Group className="mb-3" controlId="categoryName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={addCategoryPayload.name}
                onChange={(e) =>
                  setAddCategoryPayload((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Category name"
                required
                disabled={creatingCategory}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="categoryDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={addCategoryPayload.description}
                onChange={(e) =>
                  setAddCategoryPayload((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description"
                disabled={creatingCategory}
              />
            </Form.Group>

            <Form.Group controlId="categoryIsActive">
              <Form.Check
                type="checkbox"
                label="Active"
                checked={addCategoryPayload.is_active}
                onChange={(e) =>
                  setAddCategoryPayload((p) => ({
                    ...p,
                    is_active: e.target.checked,
                  }))
                }
                disabled={creatingCategory}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAddCategoryModal(false)}
              disabled={creatingCategory}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={creatingCategory}>
              {creatingCategory ? "Saving..." : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showEditCategoryModal}
        onHide={() => {
          if (!updatingCategory) setShowEditCategoryModal(false);
        }}
        centered
      >
        <Form onSubmit={submitEditCategory}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Category</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editCategoryError ? (
              <Alert variant="danger" className="mb-3">
                {editCategoryError}
              </Alert>
            ) : null}

            <Form.Group className="mb-3" controlId="editCategoryName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={editCategoryPayload.name}
                onChange={(e) =>
                  setEditCategoryPayload((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Category name"
                required
                disabled={updatingCategory}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="editCategoryDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editCategoryPayload.description}
                onChange={(e) =>
                  setEditCategoryPayload((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description"
                disabled={updatingCategory}
              />
            </Form.Group>

            <Form.Group controlId="editCategoryIsActive">
              <Form.Check
                type="checkbox"
                label="Active"
                checked={editCategoryPayload.is_active}
                onChange={(e) =>
                  setEditCategoryPayload((p) => ({
                    ...p,
                    is_active: e.target.checked,
                  }))
                }
                disabled={updatingCategory}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowEditCategoryModal(false)}
              disabled={updatingCategory}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={updatingCategory}>
              {updatingCategory ? "Saving..." : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          if (!deletingCategory) setShowDeleteModal(false);
        }}
        onConfirm={() => {
          confirmDeleteCategory().then(() => undefined);
        }}
        itemType="category"
        itemName={categoryToDelete?.name}
        loading={deletingCategory}
      />
    </React.Fragment>
  );
};

ManageCategories.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ManageCategories;
