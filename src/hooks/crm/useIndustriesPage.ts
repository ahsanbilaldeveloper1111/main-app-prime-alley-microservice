import { useCrmSettingsTableState } from "@hooks/useCrmSettingsTableState";
import { useDebouncedSearchInput } from "@hooks/useDebouncedSearchInput";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  createIndustry,
  createProduct,
  deleteIndustry,
  deleteProduct,
  getCrmProducts,
  getIndustries,
  updateIndustry,
  updateProduct,
  type CreateIndustryPayload,
  type CreateProductPayload,
  type CrmProduct,
  type IndustryData,
  type UpdateIndustryPayload,
  type UpdateProductPayload,
} from "@utils/crm";
import { normalizeSearchQuery } from "@utils/Helper";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import {
  DEFAULT_INDUSTRIES_TABLE_COLUMNS,
  EMPTY_INDUSTRY_FORM,
  EMPTY_PRODUCT_FORM,
  INDUSTRIES_TABLE_COLUMN_STORAGE_KEY,
  INDUSTRIES_TABLE_SELECTABLE_KEYS,
  type IndustryFormData,
  type ProductFormData,
} from "@page-modules/crm/industries/industriesPageModel";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const { PERMISSIONS } = HEADER_CONSTANTS;

function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "IndustriesPage" });
}

export function useIndustriesPage() {
  const { data: session } = useSession();
  const [industries, setIndustries] = useState<IndustryData[]>([]);
  const [totalIndustries, setTotalIndustries] = useState(0);
  const [loading, setLoading] = useState(true);
  const {
    pagination,
    setPagination,
    selectedColumns,
    setSelectedColumns,
    handlePaginationChange,
  } = useCrmSettingsTableState({
    defaultSelectedColumns: DEFAULT_INDUSTRIES_TABLE_COLUMNS,
    selectableColumnKeys: INDUSTRIES_TABLE_SELECTABLE_KEYS,
    columnStorageKey: INDUSTRIES_TABLE_COLUMN_STORAGE_KEY,
  });
  const {
    inputValue: searchInput,
    queryValue: search,
    handleInputChange: handleSearchChange,
    submitQuery: submitSearch,
  } = useDebouncedSearchInput({ normalize: normalizeSearchQuery });
  const [showModal, setShowModal] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<IndustryData | null>(null);
  const [deletingIndustry, setDeletingIndustry] = useState<IndustryData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingIndustryPending, setDeletingIndustryPending] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingIndustry, setViewingIndustry] = useState<IndustryData | null>(null);
  const [formData, setFormData] = useState<IndustryFormData>({ ...EMPTY_INDUSTRY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [industryProducts, setIndustryProducts] = useState<CrmProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CrmProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<CrmProduct | null>(null);
  const [showProductDeleteModal, setShowProductDeleteModal] = useState(false);
  const [deletingProductPending, setDeletingProductPending] = useState(false);
  const [showProductViewModal, setShowProductViewModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<CrmProduct | null>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    ...EMPTY_PRODUCT_FORM,
  });

  const fetchIndustries = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; per_page: number; search?: string } = {
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
      };
      if (search) params.search = search;
      const response = await getIndustries(params);
      setIndustries(response?.data || []);
      setTotalIndustries(response.total || 0);
    } catch {
      setIndustries([]);
      setTotalIndustries(0);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.rowsPerPage, search]);

  useEffect(() => {
    fetchIndustries().catch(() => undefined);
  }, [fetchIndustries]);

  useEffect(() => {
    setPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 },
    );
  }, [search, setPagination]);

  const handleOpenModal = useCallback((industry?: IndustryData) => {
    if (industry) {
      setEditingIndustry(industry);
      setFormData({
        name: industry.name || "",
        description: industry.description || "",
      });
    } else {
      setEditingIndustry(null);
      setFormData({ ...EMPTY_INDUSTRY_FORM });
    }
    setShowModal(true);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    const description = formData.description.trim() || undefined;
    try {
      setSubmitting(true);
      if (editingIndustry) {
        const payload: UpdateIndustryPayload = { name, description };
        await updateIndustry(editingIndustry.id, payload);
      } else {
        const payload: CreateIndustryPayload = { name, description };
        await createIndustry(payload);
      }
      setShowModal(false);
      setEditingIndustry(null);
      await fetchIndustries();
    } catch (error: unknown) {
      consumeHandledApiError(error, "IndustriesPage.handleSubmit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingIndustry) return;
    try {
      setDeletingIndustryPending(true);
      await deleteIndustry(deletingIndustry.id);
      setShowDeleteModal(false);
      setDeletingIndustry(null);
      await fetchIndustries();
    } catch (error: unknown) {
      consumeHandledApiError(error, "IndustriesPage.handleDelete");
    } finally {
      setDeletingIndustryPending(false);
    }
  };

  const fetchIndustryProducts = useCallback(async (industryId: number) => {
    setLoadingProducts(true);
    try {
      const response = await getCrmProducts({
        page: 1,
        per_page: 100,
        industry_id: industryId,
      });
      setIndustryProducts(response.data || []);
    } catch {
      setIndustryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const handleView = useCallback(
    async (industry: IndustryData) => {
      setViewingIndustry(industry);
      setShowViewModal(true);
      await fetchIndustryProducts(industry.id);
    },
    [fetchIndustryProducts],
  );

  const handleOpenProductModal = useCallback((product?: CrmProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        productName: product.name,
        sku: product.sku,
        price: product.price || "",
        currency: product.currency || "AED",
        category: product.category || "",
        brand: product.brand || "",
        isActive: product.active,
        description: product.description || "",
      });
    } else {
      setEditingProduct(null);
      setProductFormData({ ...EMPTY_PRODUCT_FORM });
    }
    setShowProductModal(true);
  }, []);

  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!viewingIndustry) return;

    try {
      setProductSubmitting(true);
      const name = productFormData.productName.trim();
      const description = productFormData.description.trim();
      const sku = productFormData.sku.trim();
      const category = productFormData.category.trim();
      const brand = productFormData.brand.trim();
      const price = Number.parseFloat(productFormData.price) || 0;
      const { isActive, currency } = productFormData;

      if (editingProduct) {
        const updatePayload: UpdateProductPayload = {
          id: editingProduct.id,
          name,
          description,
          sku,
          price,
          category,
          brand,
          active: isActive,
          currency,
        };
        await updateProduct({
          ...updatePayload,
          industry_id: viewingIndustry.id,
        } as UpdateProductPayload & { industry_id: number });
      } else {
        const createPayload: CreateProductPayload = {
          name,
          description: description || "",
          sku,
          price,
          category,
          brand,
          active: isActive,
          currency,
        };
        await createProduct({
          ...createPayload,
          industry_id: viewingIndustry.id,
        } as CreateProductPayload & { industry_id: number });
      }
      setShowProductModal(false);
      setEditingProduct(null);
      await fetchIndustryProducts(viewingIndustry.id);
    } catch (error: unknown) {
      consumeHandledApiError(error, "IndustriesPage.handleProductSubmit");
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct || !viewingIndustry) return;
    try {
      setDeletingProductPending(true);
      await deleteProduct(deletingProduct.id);
      setShowProductDeleteModal(false);
      setDeletingProduct(null);
      await fetchIndustryProducts(viewingIndustry.id);
    } catch (error: unknown) {
      consumeHandledApiError(error, "IndustriesPage.handleDeleteProduct");
    } finally {
      setDeletingProductPending(false);
    }
  };

  const requestDeleteIndustry = useCallback((ind: IndustryData) => {
    setDeletingIndustry(ind);
    setShowDeleteModal(true);
  }, []);

  const requestDeleteProduct = useCallback((product: CrmProduct) => {
    setDeletingProduct(product);
    setShowProductDeleteModal(true);
  }, []);

  const openProductView = useCallback((product: CrmProduct) => {
    setViewingProduct(product);
    setShowProductViewModal(true);
  }, []);

  return {
    session,
    PERMISSIONS,
    industries,
    totalIndustries,
    loading,
    pagination,
    setPagination,
    selectedColumns,
    setSelectedColumns,
    handlePaginationChange,
    searchInput,
    search,
    handleSearchChange,
    submitSearch,
    showModal,
    setShowModal,
    editingIndustry,
    deletingIndustry,
    showDeleteModal,
    setShowDeleteModal,
    setDeletingIndustry,
    deletingIndustryPending,
    showViewModal,
    setShowViewModal,
    viewingIndustry,
    formData,
    setFormData,
    submitting,
    industryProducts,
    loadingProducts,
    showProductModal,
    setShowProductModal,
    editingProduct,
    setEditingProduct,
    deletingProduct,
    showProductDeleteModal,
    setShowProductDeleteModal,
    setDeletingProduct,
    deletingProductPending,
    showProductViewModal,
    setShowProductViewModal,
    viewingProduct,
    setViewingProduct,
    productSubmitting,
    productFormData,
    setProductFormData,
    fetchIndustries,
    handleOpenModal,
    handleSubmit,
    handleDelete,
    handleView,
    handleOpenProductModal,
    handleProductSubmit,
    handleDeleteProduct,
    requestDeleteIndustry,
    requestDeleteProduct,
    openProductView,
  };
}
