import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Row, Col, Card } from "react-bootstrap";
import { useRouter } from "next/router";
import { Phone, Bot, Megaphone } from "lucide-react";
import "@assets/scss/common.scss";
import { useSession } from "next-auth/react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const VoicebotOutbound = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const permissions = session?.user?.permissions ?? [];
  const { PERMISSIONS } = HEADER_CONSTANTS;

  const sections = [
    {
      title: "Trunks",
      description: "Manage SIP trunks for outbound calling",
      icon: Phone,
      path: "/voicebot/outbound/trunks",
      color: "#3B82F6",
      permission: PERMISSIONS.VIEW_OUTBOUND_SIP_TRUNCK_OUTBOUND,
    },
    {
      title: "Voice Bots",
      description: "Manage outbound voice bots",
      icon: Bot,
      path: "/voicebot/outbound/voicebots",
      color: "#8B5CF6",
      permission: PERMISSIONS.VIEW_OUTBOUND_BOTS_OUTBOUND,
    },
    {
      title: "Campaigns",
      description: "Manage outbound campaigns",
      icon: Megaphone,
      path: "/voicebot/outbound/campaigns",
      color: "#10B981",
      permission: PERMISSIONS.VIEW_OUTBOUND_CONVERSATIONS_OUTBOUND,
    },
  ].filter((section) => permissions.includes(section.permission));

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Outbound" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <h2 className="mb-0">Voicebot Outbound</h2>
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

VoicebotOutbound.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default VoicebotOutbound;
