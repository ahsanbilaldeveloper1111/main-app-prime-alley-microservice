import React from "react";
import { Badge } from "react-bootstrap";
import { formatDateForTable } from "@utils/Helper";
import { CrmPhoneDisplay as PhoneDisplay } from "@components/crm/CrmListPageUi";
import {
  Building2,
  Calendar,
  User,
} from "lucide-react";
import {
  extensionDisplayName,
  leadPotentialBadgeVariant,
} from "./orderViewModalUtils";
import {
  OrderViewCard,
  OrderViewField,
  OrderViewGrid,
  OrderViewSection,
} from "./OrderViewModalShared";

function renderStageBadge(stage: { color?: string; name?: string } | null | undefined) {
  return (
    <Badge
      style={{
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: stage?.color || "#6c757d",
      }}
    >
      {stage?.name || "Not assigned"}
    </Badge>
  );
}

function renderAssignee(extensions: any[], assignee: unknown) {
  return (
    <>
      <User size={14} style={{ color: "#f59e0b", marginRight: "6px", display: "inline" }} />
      {extensionDisplayName(extensions, assignee)}
    </>
  );
}

function DealSection(props: { readonly relatedDeal: any; readonly extensions: any[] }) {
  const { relatedDeal, extensions } = props;
  if (!relatedDeal) return null;
  return (
    <OrderViewSection title="Deal Information">
      <OrderViewCard>
        <OrderViewGrid>
          <OrderViewField label="Deal Name" value={relatedDeal.name || "N/A"} />
          {relatedDeal.stage ? (
            <OrderViewField label="Stage" value={renderStageBadge(relatedDeal.stage)} />
          ) : null}
          {relatedDeal.net_value ? (
            <OrderViewField
              label="Deal Value"
              value={`${relatedDeal.currency || "AED"} ${Number.parseFloat(
                String(relatedDeal.net_value || relatedDeal.grand_total || 0),
              ).toLocaleString()}`}
            />
          ) : null}
          {relatedDeal.assigned_to ? (
            <OrderViewField
              label="Assigned To"
              value={renderAssignee(extensions, relatedDeal.assigned_to)}
            />
          ) : null}
          {relatedDeal.created_at ? (
            <OrderViewField
              label="Created Date"
              value={
                <>
                  <Calendar
                    size={14}
                    style={{ color: "#f59e0b", marginRight: "6px", display: "inline" }}
                  />
                  {formatDateForTable(relatedDeal.created_at)}
                </>
              }
            />
          ) : null}
          {relatedDeal.company_name ? (
            <OrderViewField
              label="Company Name"
              fullWidth
              value={
                <>
                  <Building2
                    size={14}
                    style={{ color: "#f59e0b", marginRight: "6px", display: "inline" }}
                  />
                  {relatedDeal.company_name}
                </>
              }
            />
          ) : null}
        </OrderViewGrid>
      </OrderViewCard>
    </OrderViewSection>
  );
}

function LeadSection(props: { readonly relatedLead: any; readonly extensions: any[] }) {
  const { relatedLead, extensions } = props;
  if (!relatedLead) return null;
  return (
    <OrderViewSection title="Lead Information">
      <OrderViewCard>
        <OrderViewGrid>
          <OrderViewField label="Lead Name" value={relatedLead.name} />
          {relatedLead.stage ? (
            <OrderViewField label="Stage" value={renderStageBadge(relatedLead.stage)} />
          ) : null}
          {relatedLead.lead_potential ? (
            <OrderViewField
              label="Lead Potential"
              value={
                <Badge
                  bg={leadPotentialBadgeVariant(relatedLead.lead_potential)}
                  style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px" }}
                >
                  {relatedLead.lead_potential}
                </Badge>
              }
            />
          ) : null}
          {relatedLead.user_extension ? (
            <OrderViewField
              label="Assigned To"
              value={renderAssignee(extensions, relatedLead.user_extension)}
            />
          ) : null}
        </OrderViewGrid>
      </OrderViewCard>
    </OrderViewSection>
  );
}

function CampaignSection(props: { readonly relatedLead: any }) {
  const { relatedLead } = props;
  if (!relatedLead?.campaign) return null;
  const fields = relatedLead.campaign_field_values ?? {};
  return (
    <OrderViewSection title="Campaign Information">
      <OrderViewCard>
        <OrderViewGrid>
          <OrderViewField label="Campaign Name" value={relatedLead.campaign.name} />
          {Object.entries(fields).map(([key, value]: [string, any]) => (
            <OrderViewField key={key} label={key} value={String(value)} />
          ))}
        </OrderViewGrid>
      </OrderViewCard>
    </OrderViewSection>
  );
}

function ProspectSection(props: { readonly relatedLead: any }) {
  const crmData = props.relatedLead?.crm_data;
  if (!crmData) return null;
  return (
    <OrderViewSection title="Prospect Information">
      <OrderViewCard>
        <OrderViewGrid>
          {crmData.id ? <OrderViewField label="CRM Data ID" value={`#${crmData.id}`} /> : null}
          <OrderViewField label="Name" value={crmData.name || crmData.data?.name || "N/A"} />
          <OrderViewField
            label="Phone"
            value={<PhoneDisplay phone={crmData.phone || crmData.data?.phone || ""} />}
          />
          {crmData.source_file ? (
            <OrderViewField label="Source File" value={crmData.source_file} />
          ) : null}
        </OrderViewGrid>
      </OrderViewCard>
    </OrderViewSection>
  );
}

export function OrderViewModalTabLeadDeal(props: {
  readonly relatedDeal: any;
  readonly relatedLead: any;
  readonly extensions: any[];
}): React.ReactElement {
  const { relatedDeal, relatedLead, extensions } = props;
  return (
    <div>
      <DealSection relatedDeal={relatedDeal} extensions={extensions} />
      <LeadSection relatedLead={relatedLead} extensions={extensions} />
      <CampaignSection relatedLead={relatedLead} />
      <ProspectSection relatedLead={relatedLead} />
    </div>
  );
}
