import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Row, Col, Card } from "react-bootstrap";
import { useRouter } from "next/router";
import { Building2, Bot, Phone } from "lucide-react";
import "@assets/scss/common.scss";

const VoicebotInbound = () => {
  const router = useRouter();

  const sections = [
    {
      title: "Companies",
      description: "Manage voicebot companies",
      icon: Building2,
      path: "/voicebot/inbound/companies",
      color: "#3B82F6",
    },
    {
      title: "Bots",
      description: "Manage inbound voice bots",
      icon: Bot,
      path: "/voicebot/inbound/bots",
      color: "#8B5CF6",
    },
    {
      title: "Calls",
      description: "View call logs and statistics",
      icon: Phone,
      path: "/voicebot/inbound/calls",
      color: "#10B981",
    },
  ];

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
