import "@components/billings/customer/billingCustomerDatatableCommonTabsStyles";
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Alert,
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import { Edit, PlusCircle, Trash2 } from "lucide-react";

import GenericTable, {
  type FilterPill,
  type TableAction,
  type TableColumn,
  type ToolbarConfig,
} from "@components/GenericTable";
import {
  createProductCategory,
  deleteProductCategory,
  getAccountsAxiosErrorMessage,
  getProductCategoriesList,
  type ProductCategoryData,
  updateProductCategory,
} from "@utils/accounts";
import { billingCustomerRoutes } from "@utils/billingCustomerRoutes";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import PageHeader from "@components/PageHeader";
import { GENERIC_TABLE_PAGE_SIZE_OPTIONS } from "@constants/genericTable";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

const CATEGORY_NAME_MAX_LENGTH = 150;
const CATEGORY_DESCRIPTION_MAX_LENGTH = 500;

type ProductCategoryRow = ProductCategoryData & {
  is_active?: boolean;
};

type CategoryStatusFilter = "all" | "active" | "inactive";

function categoryStatusActiveLabel(
  filter: CategoryStatusFilter,
): string | undefined {
  if (filter === "active") return "Active";
  if (filter === "inactive") return "Inactive";
  return undefined;
}

function categorySortComparableValue(
  row: ProductCategoryRow,
  column: string,
): string {
  switch (column) {
    case "description":
      return row.description?.trim() ?? "";
    case "is_active":
      return row.is_active === false ? "inactive" : "active";
    default: {
      const cell = row[column as keyof ProductCategoryRow];
      if (cell == null) {
        return "";
      }
      if (
        typeof cell === "string" ||
        typeof cell === "number" ||
        typeof cell === "boolean" ||
        typeof cell === "bigint"
      ) {
        return String(cell);
      }
      return "";
    }
  }
}

const ManageCategories = () => {
  const { hasPermission } = usePermissions();
  const canViewBillingProducts = hasPermission(PERMISSIONS.VIEW_PRODUCTS_BILLING);
  const canManageProductCategories = hasPermission(
    PERMISSIONS.MANAGE_PRODUCT_CATEGORIES_BILLING,
  );

  const requestIdRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategoryRow[]>([]);
  const [categoriesTotal, setCategoriesTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 15,
  });
  const [sortState, setSortState] = useState<{
    column: string;
    direction: "asc" | "desc";
  }>({ column: "name", direction: "asc" });
  const [statusFilter, setStatusFilter] =
    useState<CategoryStatusFilter>("all");

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
      const trimmed = search.trim();
      const params: Record<string, string | boolean | number> = {
        page: pagination.currentPage,
        limit: pagination.perPage,
      };
      if (trimmed) {
        params.search = trimmed;
      }
      if (statusFilter === "active") {
        params.is_active = true;
      } else if (statusFilter === "inactive") {
        params.is_active = false;
      }
      const response = await getProductCategoriesList(params);

      if (currentRequestId !== requestIdRef.current) return;

      setCategories(Array.isArray(response.data) ? response.data : []);
      setCategoriesTotal(
        typeof response.pagination?.total === "number"
          ? response.pagination.total
          : response.data.length,
      );
    } catch (e: any) {
      if (currentRequestId !== requestIdRef.current) return;

      console.error("Failed to fetch product categories:", e);
      setError(
        getAccountsAxiosErrorMessage(e, "Failed to fetch product categories"),
      );
      setCategories([]);
      setCategoriesTotal(0);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [search, statusFilter, pagination.currentPage, pagination.perPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearchChange = useCallback((value: string) => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setSearch(value);
  }, []);

  const applyStatusFilter = useCallback((next: CategoryStatusFilter) => {
    setStatusFilter(next);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const openAddCategoryModal = useCallback(() => {
    if (!canManageProductCategories) return;
    setAddCategoryPayload({
      name: "",
      description: "",
      is_active: true,
    });
    setAddCategoryError(null);
    setShowAddCategoryModal(true);
  }, [canManageProductCategories]);

  const openEditCategoryModal = useCallback((category: ProductCategoryRow) => {
    if (!canManageProductCategories) return;
    setEditingCategory(category);
    const rawName = category.name ?? "";
    const rawDescription = category.description ?? "";
    setEditCategoryPayload({
      name: rawName.slice(0, CATEGORY_NAME_MAX_LENGTH),
      description: rawDescription.slice(0, CATEGORY_DESCRIPTION_MAX_LENGTH),
      is_active: category.is_active ?? true,
    });
    setEditCategoryError(null);
    setShowEditCategoryModal(true);
  }, [canManageProductCategories]);

  const openDeleteCategoryModal = useCallback((category: ProductCategoryRow) => {
    if (!canManageProductCategories) return;
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  }, [canManageProductCategories]);

  const submitAddCategory = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canManageProductCategories) return;
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
         await createProductCategory(payload);
        setShowAddCategoryModal(false);
        await fetchCategories();
      } catch (err: any) {
        console.error("Failed to create product category:", err);
        setAddCategoryError(
          getAccountsAxiosErrorMessage(err, "Failed to create product category"),
        );
      } finally {
        setCreatingCategory(false);
      }
    },
    [addCategoryPayload, fetchCategories, canManageProductCategories],
  );

  const submitEditCategory = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canManageProductCategories || !editingCategory) return;

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
        await updateProductCategory(editingCategory.id, payload);
        setShowEditCategoryModal(false);
        setEditingCategory(null);
        await fetchCategories();
      } catch (err: any) {
        console.error("Failed to update product category:", err);
        setEditCategoryError(
          getAccountsAxiosErrorMessage(err, "Failed to update product category"),
        );
      } finally {
        setUpdatingCategory(false);
      }
    },
    [editCategoryPayload, editingCategory, fetchCategories, canManageProductCategories],
  );

  const confirmDeleteCategory = useCallback(async () => {
    if (!canManageProductCategories || !categoryToDelete) return;
    setDeletingCategory(true);
    try {
      await deleteProductCategory(categoryToDelete.id);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      await fetchCategories();
    } catch (err: unknown) {
      console.error("Failed to delete product category:", err);
      setError(
        getAccountsAxiosErrorMessage(err, "Failed to delete product category"),
      );
    } finally {
      setDeletingCategory(false);
    }
  }, [categoryToDelete, fetchCategories, canManageProductCategories]);

  const categoryColumns: TableColumn<ProductCategoryRow>[] = useMemo(
    () => [
     
      {
        key: "name",
        label: "Name",
        sortable: true,
        type: "text",
        emptyValue: "—",
      },
      {
        key: "description",
        label: "Description",
        sortable: true,
        type: "text",
        width: "260px",
        emptyValue: "-",
        accessor: (row) => row.description?.trim() ?? "",
      },
      {
        key: "is_active",
        label: "Active",
        sortable: true,
        type: "badge",
        accessor: (row) => (row.is_active === false ? "Inactive" : "Active"),
        badge: {
          getVariant: (row) =>
            row.is_active === false ? "secondary" : "success",
        },
      },
    ],
    [],
  );

  const categoryActions: TableAction<ProductCategoryRow>[] = useMemo(
    () =>
      canManageProductCategories
        ? [
            {
              label: "Edit",
              icon: <Edit size={16} />,
              onClick: (row) => openEditCategoryModal(row),
              variant: "link" as const,
            },
            {
              label: "Delete",
              icon: <Trash2 size={16} />,
              onClick: (row) => openDeleteCategoryModal(row),
              variant: "link" as const,
              className: "text-danger",
            },
          ]
        : [],
    [openEditCategoryModal, openDeleteCategoryModal, canManageProductCategories],
  );

  const sortedCategories = useMemo(() => {
    const { column, direction } = sortState;
    return [...categories].sort((a, b) => {
      const aStr = categorySortComparableValue(a, column).toLowerCase();
      const bStr = categorySortComparableValue(b, column).toLowerCase();
      if (aStr < bStr) return direction === "asc" ? -1 : 1;
      if (aStr > bStr) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [categories, sortState]);

  const handleTableSort = useCallback((column: string, direction: "asc" | "desc") => {
    setSortState({ column, direction });
  }, []);

  const categoryStatusPills = useMemo<FilterPill[]>(
    () => [
      {
        id: "category-status",
        label: "Status",
        showDropdown: true,
        active: statusFilter !== "all",
        activeLabel: categoryStatusActiveLabel(statusFilter),
        onClear: () => applyStatusFilter("all"),
        dropdownOptions: [
          {
            label: "All",
            value: "all",
            onClick: () => applyStatusFilter("all"),
          },
          {
            label: "Active",
            value: "active",
            onClick: () => applyStatusFilter("active"),
          },
          {
            label: "Inactive",
            value: "inactive",
            onClick: () => applyStatusFilter("inactive"),
          },
        ],
      },
    ],
    [statusFilter, applyStatusFilter],
  );

  const categoriesToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: false,
      showFilterPills: true,
      showMoreFiltersButton: false,
      filterPills: categoryStatusPills,
      rightActions: canManageProductCategories ? (
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={openAddCategoryModal}
            className="d-flex align-items-center gap-2"
          >
            <PlusCircle size={16} aria-hidden />
            Add Category
          </Button>
        </div>
      ) : undefined,
    }),
    [openAddCategoryModal, categoryStatusPills, canManageProductCategories],
  );

  if (!canViewBillingProducts) {
    return null;
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Products"
        mainLink={billingCustomerRoutes.products()}
        subTitle="Manage Categories"
      />

      <PageHeader
        title="Manage Categories"
        showSearch
        searchPlaceholder="Search categories by name"
        searchValue={search}
        onSearchChange={handleSearchChange}
      />

      <div>
        {error ? (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        ) : null}

        <GenericTable<ProductCategoryRow>
          data={sortedCategories}
          columns={categoryColumns}
          actions={categoryActions}
          showActions={canManageProductCategories}
          sortable
          defaultSortBy={sortState.column}
          defaultSortOrder={sortState.direction}
          onSort={handleTableSort}
          showToolbar
          toolbar={categoriesToolbarConfig}
          showToolbarActions={false}
          pagination={{
            currentPage: pagination.currentPage,
            rowsPerPage: pagination.perPage,
            totalRows: categoriesTotal,
            pageSizeOptions: GENERIC_TABLE_PAGE_SIZE_OPTIONS,
          }}
          onPaginationChange={(page, rowsPerPage) => {
            setPagination({ currentPage: page, perPage: rowsPerPage });
          }}
          loading={loading}
          loadingMessage="Loading categories…"
          emptyMessage={
            <div className="text-center p-5">
              <p className="text-muted">No categories found</p>
            </div>
          }
          hover
          bordered
          uniqueKey="id"
        />
      </div>

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
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={addCategoryPayload.name}
                onChange={(e) =>
                  setAddCategoryPayload((p) => ({
                    ...p,
                    name: e.target.value.slice(0, CATEGORY_NAME_MAX_LENGTH),
                  }))
                }
                placeholder="Category name"
                maxLength={CATEGORY_NAME_MAX_LENGTH}
                required
                disabled={creatingCategory}
                aria-describedby="categoryNameCharHint"
              />
              <Form.Text
                id="categoryNameCharHint"
                className={`small ${addCategoryPayload.name.length >= CATEGORY_NAME_MAX_LENGTH ? "text-warning" : "text-muted"}`}
              >
                {addCategoryPayload.name.length} / {CATEGORY_NAME_MAX_LENGTH}{" "}
                characters
              </Form.Text>
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
                    description: e.target.value.slice(
                      0,
                      CATEGORY_DESCRIPTION_MAX_LENGTH,
                    ),
                  }))
                }
                placeholder="Optional description"
                maxLength={CATEGORY_DESCRIPTION_MAX_LENGTH}
                disabled={creatingCategory}
                aria-describedby="categoryDescriptionCharHint"
              />
              <Form.Text
                id="categoryDescriptionCharHint"
                className={`small ${addCategoryPayload.description.length >= CATEGORY_DESCRIPTION_MAX_LENGTH ? "text-warning" : "text-muted"}`}
              >
                {addCategoryPayload.description.length} /{" "}
                {CATEGORY_DESCRIPTION_MAX_LENGTH} characters
              </Form.Text>
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
            <Button
              type="submit"
              variant="primary"
              disabled={
                creatingCategory || !addCategoryPayload.name.trim()
              }
            >
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
                  setEditCategoryPayload((p) => ({
                    ...p,
                    name: e.target.value.slice(0, CATEGORY_NAME_MAX_LENGTH),
                  }))
                }
                placeholder="Category name"
                maxLength={CATEGORY_NAME_MAX_LENGTH}
                required
                disabled={updatingCategory}
                aria-describedby="editCategoryNameCharHint"
              />
              <Form.Text
                id="editCategoryNameCharHint"
                className={`small ${editCategoryPayload.name.length >= CATEGORY_NAME_MAX_LENGTH ? "text-warning" : "text-muted"}`}
              >
                {editCategoryPayload.name.length} / {CATEGORY_NAME_MAX_LENGTH}{" "}
                characters
              </Form.Text>
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
                    description: e.target.value.slice(
                      0,
                      CATEGORY_DESCRIPTION_MAX_LENGTH,
                    ),
                  }))
                }
                placeholder="Optional description"
                maxLength={CATEGORY_DESCRIPTION_MAX_LENGTH}
                disabled={updatingCategory}
                aria-describedby="editCategoryDescriptionCharHint"
              />
              <Form.Text
                id="editCategoryDescriptionCharHint"
                className={`small ${editCategoryPayload.description.length >= CATEGORY_DESCRIPTION_MAX_LENGTH ? "text-warning" : "text-muted"}`}
              >
                {editCategoryPayload.description.length} /{" "}
                {CATEGORY_DESCRIPTION_MAX_LENGTH} characters
              </Form.Text>
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
            <Button
              type="submit"
              variant="primary"
              disabled={
                updatingCategory || !editCategoryPayload.name.trim()
              }
            >
              {updatingCategory ? "Updating..." : "Update"}
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
