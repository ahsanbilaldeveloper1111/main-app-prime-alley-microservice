import React from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import Link from "next/link";
import { useRouter } from "next/router";
import CampaignCreatePage from "../create";

const CampaignEditPage = () => {
  const router = useRouter();
  const { id } = router.query;

  let campaignId = "";
  if (typeof id === "string") campaignId = id;
  else if (Array.isArray(id) && id[0]) campaignId = id[0];

  if (!campaignId) {
    return (
      <Layout>
        <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound - Campaigns - Edit" />
        <PageHeader title="Edit Campaign" showSearch={false} />
        <p className="text-muted">Invalid campaign id.</p>
        <Link href="/voicebot/outbound/campaigns">Back to Campaigns</Link>
      </Layout>
    );
  }

  return (
    <Layout>
      <CampaignCreatePage editCampaignId={campaignId} />
    </Layout>
  );
};

export default CampaignEditPage;
