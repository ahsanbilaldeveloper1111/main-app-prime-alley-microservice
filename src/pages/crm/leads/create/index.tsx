import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { createLead, getStages, StageData, getCampaigns, getCampaignById, CampaignData, getCrmData, getCrmDataById, CrmDataItem } from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { Button, Row, Col, Form, Card, Alert, Badge } from "react-bootstrap";
import Select from "react-select";
import { FiSave, FiArrowLeft, FiDatabase, FiTarget, FiPlus } from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";


const CreateLead = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    user_extension: null as string | null,
    type: "lead" as "lead" | "opportunity",
    description: "",
    company_name: "",
    company_contact: "",
    company_description: "",
    stage_id: undefined as number | undefined,
    campaign_id: undefined as number | undefined,
    crm_data_id: undefined as number | undefined,
    campaign_field_values: {} as Record<string, any>,
  });

  const [stages, setStages] = useState<StageData[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [crmData, setCrmData] = useState<CrmDataItem[]>([]);
  const [selectedCrmData, setSelectedCrmData] = useState<CrmDataItem | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpportunity, setIsOpportunity] = useState(false);

  // Fetch stages and extensions on component mount
  useEffect(() => {
    fetchStages();
    fetchExtensions();
    fetchCampaigns();
    fetchCrmData();
  }, []);

  // Fetch specific CRM data record if crm_data_id is in URL
  useEffect(() => {
    if(router.query?.type === "opportunity") {
      setFormData(prev => ({
        ...prev,
        type: "opportunity",
      }));
    }
    setIsOpportunity(router.query?.type === "opportunity");
    const fetchCrmDataRecord = async () => {
      if (router.isReady && router.query.crm_data_id) {
        try {
          const crmDataId = Number(router.query.crm_data_id);
          const crmDataRecord = await getCrmDataById(crmDataId);
          console.log("ZE CRM DATA RECORD", crmDataRecord);
          setSelectedCrmData(crmDataRecord);
          
          // Pre-fill basic form fields
          setFormData(prev => ({
            ...prev,
            crm_data_id: crmDataId,
            campaign_id: Number(crmDataRecord.campaign_id) || undefined,
            name: crmDataRecord.data?.name || crmDataRecord.data?.full_name || crmDataRecord.data?.first_name || crmDataRecord.phone || '',
            description: crmDataRecord.data?.description || crmDataRecord.data?.notes || crmDataRecord.data?.comments || '',
            company_name: crmDataRecord.data?.company_name || crmDataRecord.data?.company || '',
            company_contact: crmDataRecord.data?.company_contact || crmDataRecord.data?.contact || crmDataRecord.phone || '',
            company_description: crmDataRecord.data?.company_description || crmDataRecord.data?.company_notes || '',
          }));
        } catch (error) {
          console.error("Failed to fetch CRM data record:", error);
        }
      }
    };

    fetchCrmDataRecord();
  }, [router.isReady, router.query.crm_data_id]);

  // Auto-select campaign and pre-fill fields when CRM data is available
  useEffect(() => {
    const fetchCampaignAndPreFill = async () => {
      if (selectedCrmData && selectedCrmData.campaign_id) {
        try {
          // Fetch campaign details with fields
          const campaign = await getCampaignById(selectedCrmData.campaign_id);
          console.log("ZE AUTO-SELECTED CAMPAIGN WITH FIELDS", campaign);
          
          setSelectedCampaign(campaign);
          
          // Pre-fill campaign fields with CRM data (excluding dropdown fields)
          const preFilledFields: Record<string, any> = {};
          
          if (campaign.fields && selectedCrmData.data) {
            campaign.fields.forEach((field) => {
              // Skip dropdown fields as requested
              if (field.field_type === 'dropdown') {
                return;
              }
              
              // Try to find matching CRM data field
              const crmDataValue = selectedCrmData.data[field.field_name] || 
                                 selectedCrmData.data[field.field_name.toLowerCase()] ||
                                 selectedCrmData.data[field.field_name.toUpperCase()];
              
              if (crmDataValue !== null && crmDataValue !== undefined && crmDataValue !== '') {
                preFilledFields[field.field_name] = String(crmDataValue);
              }
            });
          }
          
          setFormData(prev => ({
            ...prev,
            campaign_field_values: preFilledFields,
          }));
        } catch (error) {
          console.error("Failed to fetch campaign details for auto-selection:", error);
        }
      }
    };

    fetchCampaignAndPreFill();
  }, [selectedCrmData]);

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

  const fetchCampaigns = async () => {
    try {
      const campaignsData = await getCampaigns({ per_page: 100 });
      setCampaigns(campaignsData?.data || []);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    }
  };

  const fetchCrmData = async () => {
    try {
      const crmDataResponse = await getCrmData({ per_page: 100 });
      setCrmData(crmDataResponse?.data || []);
    } catch (error) {
      console.error("Failed to fetch CRM data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createLead(formData);
      toast.success("Lead created successfully!");
      if (formData.type === "lead") {
        router.push("/crm/leads");
      } else {
        router.push("/crm/opportunities");
      }
    } catch (error) {
      toast.error("Failed to create lead");
      console.error("Create lead error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCampaignChange = async (selectedOption: any) => {
    const campaignId = selectedOption?.value;
    
    if (!campaignId) {
      setSelectedCampaign(null);
      setFormData((prev) => ({
        ...prev,
        campaign_id: undefined,
        campaign_field_values: {},
      }));
      return;
    }
    
    try {
      // Fetch campaign details with fields
      const campaign = await getCampaignById(campaignId);
      console.log("ZE CAMPAIGN WITH FIELDS", campaign);
      
      // Pre-fill campaign fields with CRM data (excluding dropdown fields)
      const preFilledFields: Record<string, any> = {};
      
      if (campaign.fields && selectedCrmData?.data) {
        campaign.fields.forEach((field) => {
          // Skip dropdown fields as requested
          if (field.field_type === 'dropdown') {
            return;
          }
          
          // Try to find matching CRM data field
          const crmDataValue = selectedCrmData.data[field.field_name] || 
                             selectedCrmData.data[field.field_name.toLowerCase()] ||
                             selectedCrmData.data[field.field_name.toUpperCase()];
          
          if (crmDataValue !== null && crmDataValue !== undefined && crmDataValue !== '') {
            preFilledFields[field.field_name] = String(crmDataValue);
          }
        });
      }
      
      setFormData((prev) => ({
        ...prev,
        campaign_id: campaignId,
        campaign_field_values: preFilledFields, // Pre-fill with CRM data
      }));
      
      setSelectedCampaign(campaign);
    } catch (error) {
      console.error("Failed to fetch campaign details:", error);
      // Fallback to basic campaign from list
      const basicCampaign = campaigns.find(c => c.id === campaignId);
      setSelectedCampaign(basicCampaign || null);
    }
  };

  const handleCampaignFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      campaign_field_values: {
        ...prev.campaign_field_values,
        [fieldName]: value,
      },
    }));
  };

  const renderCampaignField = (field: any) => {
    const fieldValue = formData.campaign_field_values[field.field_name] || "";

    switch (field.field_type) {
      case "string":
      case "email":
        return (
          <Form.Control
            type={field.field_type === "email" ? "email" : "text"}
            value={fieldValue}
            onChange={(e) => handleCampaignFieldChange(field.field_name, e.target.value)}
            placeholder={`Enter ${field.field_name}`}
          />
        );
      
      case "text":
        return (
          <Form.Control
            as="textarea"
            rows={3}
            value={fieldValue}
            onChange={(e) => handleCampaignFieldChange(field.field_name, e.target.value)}
            placeholder={`Enter ${field.field_name}`}
          />
        );
      
      case "integer":
        return (
          <Form.Control
            type="number"
            value={fieldValue}
            onChange={(e) => handleCampaignFieldChange(field.field_name, e.target.value)}
            placeholder={`Enter ${field.field_name}`}
          />
        );
      
      case "date":
        return (
          <Form.Control
            type="date"
            value={fieldValue}
            onChange={(e) => handleCampaignFieldChange(field.field_name, e.target.value)}
          />
        );
      
      case "dropdown":
        return (
          <Form.Select
            value={fieldValue}
            onChange={(e) => handleCampaignFieldChange(field.field_name, e.target.value)}
          >
            <option value="">Select {field.field_name}</option>
            {field.field_options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </Form.Select>
        );
      
      default:
        return (
          <Form.Control
            type="text"
            value={fieldValue}
            onChange={(e) => handleCampaignFieldChange(field.field_name, e.target.value)}
            placeholder={`Enter ${field.field_name}`}
          />
        );
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle={isOpportunity ? "Create Opportunity" : "Create Lead"}
      />


      <PageHeader
        title={isOpportunity ? "Create Opportunity" : "Create Lead"}
        buttons={
          <Link href={isOpportunity ? "/crm/opportunities" : "/crm/leads"} 
          className="btn btn-primary">
          <FiArrowLeft className="me-2" />
          Back to {isOpportunity ? "Opportunities" : "Leads"}
        </Link>
        }
      />

      <div className="container-fluid">
       

        {/* Create Lead Form */}
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 app-heading">{isOpportunity ? "Opportunity" : "Lead"} Information</h4>
                  {selectedCrmData && (
                    <Badge bg="info" className="d-flex align-items-center">
                      <FiDatabase className="me-1" size={14} />
                      Pre-filled from CRM Data #{selectedCrmData.id}
                    </Badge>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>{isOpportunity ? "Opportunity" : "Lead"} Name *</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
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
                                  label:
                                    extensions.find(
                                      (ext: any) =>
                                        ext.id.toString() ===
                                        formData.user_extension?.toString()
                                    )?.display_name || "",
                                }
                              : null
                          }
                          onChange={(selectedOption: any) => {
                            handleInputChange(
                              "user_extension",
                              selectedOption?.value || null
                            );
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
                          onChange={(e) =>
                            handleInputChange("type", e.target.value)
                          }
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
                          onChange={(e) =>
                            handleInputChange(
                              "stage_id",
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
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

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Campaign</Form.Label>
                        <Select
                          value={
                            formData.campaign_id
                              ? {
                                  value: formData.campaign_id,
                                  label: campaigns.find(c => c.id === formData.campaign_id)?.name || "",
                                }
                              : null
                          }
                          onChange={handleCampaignChange}
                          options={campaigns.map((campaign) => ({
                            value: campaign.id,
                            label: campaign.name,
                          }))}
                          placeholder="Select a campaign (Optional)"
                          isClearable
                          isSearchable
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>CRM Data Attribution</Form.Label>
                        <Select
                          value={
                            formData.crm_data_id
                              ? {
                                  value: formData.crm_data_id,
                                  label: `#${formData.crm_data_id} - ${crmData.find(d => d.id === formData.crm_data_id)?.phone || 'No Phone'}`,
                                }
                              : null
                          }
                          onChange={(selectedOption: any) => {
                            handleInputChange("crm_data_id", selectedOption?.value || undefined);
                          }}
                          options={crmData.map((data) => ({
                            value: data.id,
                            label: `#${data.id} - ${data.phone || 'No Phone'}`,
                          }))}
                          placeholder="Select CRM data (Optional)"
                          isClearable
                          isSearchable
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="Enter lead description"
                    />
                  </Form.Group>

                  {/* Company Information Section */}
                  <div className="border-top pt-3 mt-4">
                    <h4 className="mb-3 app-heading">Company Information</h4>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.company_name}
                            onChange={(e) =>
                              handleInputChange("company_name", e.target.value)
                            }
                            placeholder="Enter company name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contact Information</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.company_contact}
                            onChange={(e) =>
                              handleInputChange("company_contact", e.target.value)
                            }
                            placeholder="Enter phone or email"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Additional Contact Information</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={formData.company_description}
                        onChange={(e) =>
                          handleInputChange("company_description", e.target.value)
                        }
                        placeholder="Enter additional company contact details"
                      />
                    </Form.Group>
                  </div>

                  {/* Campaign Custom Fields */}
                  {selectedCampaign && selectedCampaign.fields && selectedCampaign.fields.length > 0 && (
                    <div className="border-top pt-3 mt-4">
                      <div className="d-flex align-items-center mb-3">
                        <FiTarget className="me-2" />
                        <h6 className="mb-0">Campaign Fields: {selectedCampaign.name}</h6>
                        {selectedCrmData && (
                          <Badge bg="success" className="ms-2 small">
                            Auto-filled from CRM Data
                          </Badge>
                        )}
                      </div>
                      <Alert variant="info" className="mb-3">
                        <small>
                          Fill in the custom fields for the selected campaign. These fields will be stored with the lead/opportunity.
                          {selectedCrmData && (
                            <><br /><strong>Note:</strong> Fields have been automatically filled from the selected CRM data record. Dropdown fields are excluded from auto-fill.</>
                          )}
                        </small>
                      </Alert>
                      <Row>
                        {selectedCampaign.fields.map((field, index) => (
                          <Col md={6} key={index} className="mb-3">
                            <Form.Group>
                              <Form.Label>
                                {field.field_name}
                                {field.field_type === "email" && " (Email)"}
                                {field.field_type === "integer" && " (Number)"}
                                {field.field_type === "date" && " (Date)"}
                                {field.field_type === "dropdown" && " (Select)"}
                              </Form.Label>
                              {renderCampaignField(field)}
                            </Form.Group>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}

                  {/* CRM Data Preview */}
                  {selectedCrmData && (
                    <div className="border-top pt-3 mt-4">
                      <div className="d-flex align-items-center mb-3">
                        <FiDatabase className="me-2" />
                        <h6 className="mb-0">CRM Data Attribution Preview</h6>
                      </div>
                      <Alert variant="success" className="mb-3">
                        <small>
                          This lead/opportunity will be attributed to the selected CRM data record.
                        </small>
                      </Alert>
                      <Card className="bg-light">
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <strong>Record ID:</strong> #{selectedCrmData.id}
                            </Col>
                            <Col md={6}>
                              <strong>Phone:</strong> {selectedCrmData.phone || "N/A"}
                            </Col>
                            {Object.entries(selectedCrmData.data || {}).slice(0, 4).map(([key, value]) => (
                              <Col md={6} key={key} className="mt-2">
                                <strong>{key}:</strong> {String(value) || "N/A"}
                              </Col>
                            ))}
                            {Object.entries(selectedCrmData.data || {}).length > 4 && (
                              <Col md={12} className="mt-2">
                                <small className="text-muted">
                                  +{Object.entries(selectedCrmData.data || {}).length - 4} more fields
                                </small>
                              </Col>
                            )}
                          </Row>
                        </Card.Body>
                      </Card>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <Button type="submit" variant="primary" className="app-button" disabled={loading}>
                      {loading ? (
                        "Creating..."
                      ) : (
                        <>
                          <FiSave className="me-2" />
                          Create {isOpportunity ? "Opportunity" : "Lead"}
                        </>
                      )}
                    </Button>
                    <Link
                      href="/crm/leads"
                      className="btn btn-info app-button"
                    >
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
