import BusinessTypesManagement from "@page-modules/crm/business-types/BusinessTypesManagement";
import { useSmartCrmPanelChrome } from "@page-modules/crm/shared/useSmartCrmPanelChrome";

const BusinessTypesPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink } = useSmartCrmPanelChrome("business-types");

  return (
    <BusinessTypesManagement
      hideBreadcrumb={!showBreadcrumb}
      breadcrumbMainLink={breadcrumbMainLink}
    />
  );
};

export default BusinessTypesPanel;
