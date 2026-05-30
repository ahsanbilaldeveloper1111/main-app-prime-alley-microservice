import StagesManagement from "@page-modules/crm/stages/StagesManagement";
import { useSmartCrmPanelChrome } from "@page-modules/crm/shared/useSmartCrmPanelChrome";

const StagesPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink } = useSmartCrmPanelChrome("stages");

  return (
    <StagesManagement
      hideBreadcrumb={!showBreadcrumb}
      breadcrumbMainLink={breadcrumbMainLink}
    />
  );
};

export default StagesPanel;
