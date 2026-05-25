import IndustriesManagement from "@page-modules/crm/industries/IndustriesManagement";
import { useSmartCrmPanelChrome } from "@page-modules/crm/shared/useSmartCrmPanelChrome";

const IndustriesPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink } = useSmartCrmPanelChrome("industries");

  return (
    <IndustriesManagement
      hideBreadcrumb={!showBreadcrumb}
      breadcrumbMainLink={breadcrumbMainLink}
    />
  );
};

export default IndustriesPanel;
