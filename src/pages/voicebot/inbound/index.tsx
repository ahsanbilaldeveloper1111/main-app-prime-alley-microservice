import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Row, Col, Card } from "react-bootstrap";
import { useRouter } from "next/router";
import { Building2, Bot, Phone, Server } from "lucide-react";
import "@assets/scss/common.scss";
import { useSession } from "next-auth/react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const VoicebotInbound = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const permissions = session?.user?.permissions ?? [];
  const { PERMISSIONS } = HEADER_CONSTANTS;

  const sections = [
    {
      title: "Companies",
      description: "Manage voicebot companies",
      icon: Building2,
      path: "/voicebot/inbound/companies",
      color: "#3B82F6",
      permission: PERMISSIONS.VIEW_INBOUND_DASHBOARD_INBOUND,
    },
    {
      title: "Bots",
      description: "Manage inbound voice bots",
      icon: Bot,
      path: "/voicebot/inbound/bots",
      color: "#8B5CF6",
      permission: PERMISSIONS.VIEW_INBOUND_BOTS_INBOUND,
    },
    {
      title: "SIP trunks",
      description: "List SIP trunks for inbound calling",
      icon: Server,
      path: "/voicebot/inbound/sip-trunks",
      color: "#6366F1",
      permission: PERMISSIONS.VIEW_INBOUND_TRUNK_INBOUND,
    },
    {
      title: "Calls",
      description: "View call logs and statistics",
      icon: Phone,
      path: "/voicebot/inbound/calls",
      color: "#10B981",
      permission: PERMISSIONS.VIEW_INBOUND_CAMPAIGNS_INBOUND,
    },
  ].filter((section) => permissions.includes(section.permission));

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Inbound" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <h2 className="mb-0">Voicebot Inbound</h2>
          </div>
        </Col>
      </Row>
      <Row>
        {sections.map(({ title, description, icon: Icon, path, color }) => (
          <Col key={path} md={4} className="mb-3">
            <Card
              className="h-100 cursor-pointer"
              style={{ cursor: "pointer" }}
              onClick={() => router.push(path)}
            >
              <Card.Body className="d-flex align-items-center gap-3">
                <div
                  className="rounded p-3"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  <Icon size={28} />
                </div>
                <div>
                  <Card.Title className="mb-1">{title}</Card.Title>
                  <Card.Text className="text-muted small mb-0">
                    {description}
                  </Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </React.Fragment>
  );
};

VoicebotInbound.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default VoicebotInbound;
