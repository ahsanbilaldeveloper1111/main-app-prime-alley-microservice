import CrmCampaignsManagement from "@page-modules/crm/campaigns/CrmCampaignsManagement";
import { useSmartCrmPanelChrome } from "@page-modules/crm/shared/useSmartCrmPanelChrome";

const CrmCampaignsPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink } = useSmartCrmPanelChrome("campaigns");

  return (
    <CrmCampaignsManagement
      hideBreadcrumb={!showBreadcrumb}
      breadcrumbMainLink={breadcrumbMainLink}
    />
  );
};

export default CrmCampaignsPanel;
