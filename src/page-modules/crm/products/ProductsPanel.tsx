import ProductsManagement from "@page-modules/crm/products/ProductsManagement";
import { useSmartCrmPanelChrome } from "@page-modules/crm/shared/useSmartCrmPanelChrome";

const ProductsPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink } = useSmartCrmPanelChrome("products");

  return (
    <ProductsManagement
      hideBreadcrumb={!showBreadcrumb}
      breadcrumbMainLink={breadcrumbMainLink}
    />
  );
};

export default ProductsPanel;
