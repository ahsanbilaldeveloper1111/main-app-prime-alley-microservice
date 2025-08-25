import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { createLead, getStages, StageData } from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import {
  Button,
  Row,
  Col,
  Form,
  Card,
} from "react-bootstrap";
import Select from 'react-select';
import {
  FiSave,
  FiArrowLeft,
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

const CreateLead = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    user_extension: null as string | null,
    type: "lead" as "lead" | "opportunity",
    description: "",
    stage_id: undefined as number | undefined,
  });

  const [stages, setStages] = useState<StageData[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch stages and extensions on component mount
  useEffect(() => {
    fetchStages();
    fetchExtensions();
  }, []);

  const fetchStages = async () => {
    try {
      const stagesData = await getStages();
      setStages(stagesData || []);
    } catch (error) {
      console.error("Failed to fetch stages:", error);
    }
  };

  const fetchExtensions = async () => {
    try {
      const hierarchyData = await GetHierarchyData();
      if (hierarchyData?.extensions) {
        setExtensions(hierarchyData.extensions);
      }
    } catch (error) {
      console.error("Failed to fetch extensions:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createLead(formData);
      toast.success("Lead created successfully!");
      router.push("/crm/leads");
    } catch (error) {
      toast.error("Failed to create lead");
      console.error("Create lead error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Create Lead"
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0">Create New Lead</h1>
                <p className="text-muted">Add a new lead to your CRM pipeline</p>
              </div>
              <div>
                <Link href="/crm/leads" className="btn btn-outline-secondary">
                  <FiArrowLeft className="me-2" />
                  Back to Leads
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Create Lead Form */}
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <Card.Header>
                <h5 className="mb-0">Lead Information</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Lead Name *</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Enter lead name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>User Extension</Form.Label>
                        <Select
                          value={
                            formData.user_extension
                              ? {
                                  value: formData.user_extension,
                                  label: extensions.find(
                                    (ext: any) =>
                                      ext.id.toString() === formData.user_extension?.toString()
                                  )?.display_name || "",
                                }
                              : null
                          }
                          onChange={(selectedOption: any) => {
                            handleInputChange("user_extension", selectedOption?.value || null);
                          }}
                          options={extensions.map((extension: any) => ({
                            value: extension.id,
                            label: extension.display_name,
                          }))}
                          placeholder="Select User Extension (Optional)"
                          isClearable
                          isSearchable
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Type *</Form.Label>
                        <Form.Select
                          value={formData.type}
                          onChange={(e) => handleInputChange("type", e.target.value)}
                          required
                        >
                          <option value="lead">Lead</option>
                          <option value="opportunity">Opportunity</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Stage</Form.Label>
                        <Form.Select
                          value={formData.stage_id || ""}
                          onChange={(e) => handleInputChange("stage_id", e.target.value ? Number(e.target.value) : undefined)}
                        >
                          <option value="">Select a stage</option>
                          {stages.map((stage) => (
                            <option key={stage.id} value={stage.id}>
                              {stage.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Enter lead description"
                    />
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? "Creating..." : (
                        <>
                          <FiSave className="me-2" />
                          Create Lead
                        </>
                      )}
                    </Button>
                    <Link href="/crm/leads" className="btn btn-outline-secondary">
                      Cancel
                    </Link>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

CreateLead.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CreateLead;
