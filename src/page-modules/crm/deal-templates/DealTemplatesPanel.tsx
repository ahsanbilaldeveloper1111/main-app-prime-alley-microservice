import DealTemplatesManagement from "@page-modules/crm/deal-templates/DealTemplatesManagement";
import { useSmartCrmPanelChrome } from "@page-modules/crm/shared/useSmartCrmPanelChrome";

const DealTemplatesPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink } = useSmartCrmPanelChrome("deal-templates");

  return (
    <DealTemplatesManagement
      hideBreadcrumb={!showBreadcrumb}
      breadcrumbMainLink={breadcrumbMainLink}
    />
  );
};

export default DealTemplatesPanel;
