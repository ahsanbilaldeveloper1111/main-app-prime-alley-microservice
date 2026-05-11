import React, { ReactElement, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

const CampaignDetail = () => {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      // Redirect to campaigns list with a message
      toast.info("Campaign details are now available in the campaigns list. Use the 'View' action to see details.");
      router.push("/crm/campaigns");
    }
  }, [id, router]);

  return null;
};

CampaignDetail.getLayout = (page: ReactElement) => {
  return page;
};

export default CampaignDetail;
