import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useRef } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  createLead,
  getStages,
  StageData,
  getCampaigns,
  getCampaignById,
  CampaignData,
  getCrmData,
  getCrmDataById,
  CrmDataItem,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { Button, Row, Col, Form, Card, Alert, Badge } from "react-bootstrap";
import Select from "react-select";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import type { E164Number } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  FiSave,
  FiArrowLeft,
  FiDatabase,
  FiTarget,
  FiPlus,
} from "react-icons/fi";
import { CheckCircle, ChevronLeft, ChevronRight, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from "@components/PageSummaryGrid";
import DatatableActionButton from "@components/DatatableActionButton";
import { ModuleSlug } from '@utils/Helper';

const CreateLead = () => {
  const router = useRouter();
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    user_extension: null as string | null,
    type: "lead" as "lead" | "opportunity",
    description: "",
    source: "",
    company_name: "",
    company_contact: "",
    company_description: "",
    industry: "",
    business_type: "",
    company_country: "",
    company_province: "",
    company_city: "",
    company_location_other: "",
    company_size: "",
    contact_person_title: "",
    contact_person_name: "",
    contact_phone_country_code: "",
    contact_phone: "",
    stage_id: undefined as number | undefined,
    campaign_id: undefined as number | undefined,
    crm_data_id: undefined as number | undefined,
    lead_potential: "",
    other_information: {} as Record<string, any>,
    campaign_field_values: {} as Record<string, any>,
    contact_persons: [] as Array<{
      title: string;
      name: string;
      phone_country_code: string;
      phone: string;
      email: string;
    }>,
  });

  const [stages, setStages] = useState<StageData[]>([]);


  const [extensions, setExtensions] = useState<any[]>([]);
  const [extensionsOpportunities, setExtensionsOpportunities] = useState<any[]>([]);


  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [crmData, setCrmData] = useState<CrmDataItem[]>([]);
  const [selectedCrmData, setSelectedCrmData] = useState<CrmDataItem | null>(
    null
  );
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [isOpportunity, setIsOpportunity] = useState(false);
  const isInitialLoad = useRef(true);

  // Utility function to parse phone number in format "+92 3200654656" and extract country code
  const parsePhoneNumberFormat = (phone: string): { countryCode: string; phoneNumber: string } => {
    if (!phone) return { countryCode: "", phoneNumber: "" };
    
    // Match pattern: +country_code space rest_of_number
    const match = phone.match(/^(\+\d{1,4})\s+(.+)$/);
    if (match) {
      return {
        countryCode: match[1], // e.g., "+92"
        phoneNumber: match[2],  // e.g., "3200654656"
      };
    }
    
    // If no match, return original phone as phoneNumber
    return { countryCode: "", phoneNumber: phone };
  };

  // Fetch stages and extensions on component mount
  useEffect(() => {
    fetchExtensions();
    fetchCampaigns();
    fetchCrmData();
  }, []);

  // Set initial type and fetch stages when router is ready
  useEffect(() => {
    if (router.isReady) {
      const isOpportunity = router.query?.type === "opportunity";
      setIsOpportunity(isOpportunity);

      setFormData((prev) => ({
        ...prev,
        type: isOpportunity ? "opportunity" : "lead",
      }));

      // Fetch stages with the correct type
      fetchStages(isOpportunity ? "opportunity" : "lead");
      isInitialLoad.current = false;
    }
  }, [router.isReady, router.query?.type]);

  // Refetch stages when type changes (but not on initial load)
  useEffect(() => {
    // Only refetch if this is not the initial load
    if (!isInitialLoad.current) {
      fetchStages(formData.type);
      // Clear selected stage when type changes as it might not be valid for new type
      setFormData((prev) => ({
        ...prev,
        stage_id: undefined,
      }));
    }
  }, [formData.type]);

  // Fetch specific CRM data record if crm_data_id is in URL
  useEffect(() => {
    const fetchCrmDataRecord = async () => {
      if (router.isReady && router.query.crm_data_id) {
        try {
          const crmDataId = Number(router.query.crm_data_id);
          const crmDataRecord = await getCrmDataById(crmDataId);
          console.log("ZE CRM DATA RECORD", crmDataRecord);
          setSelectedCrmData(crmDataRecord);

          // Extract prospect name for lead name
          const prospectName =
            crmDataRecord.data?.name ||
            crmDataRecord.data?.full_name ||
            crmDataRecord.data?.first_name ||
            crmDataRecord.name ||
            crmDataRecord.phone ||
            "";

          // Extract contact person name
          const contactPersonName =
            crmDataRecord.data?.contact_person_name ||
            crmDataRecord.data?.contact_name ||
            crmDataRecord.data?.name ||
            crmDataRecord.data?.full_name ||
            crmDataRecord.data?.first_name ||
            crmDataRecord.name ||
            "";

          // Extract email
          const email =
            crmDataRecord.data?.email ||
            crmDataRecord.data?.contact_email ||
            crmDataRecord.data?.email_address ||
            "";

          // Extract phone
          const phone = crmDataRecord.phone || crmDataRecord.data?.phone || "";
          
          // Parse phone number to extract country code if in format "+92 3200654656"
          const parsedPhone = parsePhoneNumberFormat(phone);
          const phoneCountryCode = parsedPhone.countryCode || crmDataRecord.data?.phone_country_code || "";
          const phoneNumber = parsedPhone.phoneNumber || phone;

          // Pre-fill basic form fields
          setFormData((prev) => ({
            ...prev,
            crm_data_id: crmDataId,
            campaign_id: Number(crmDataRecord.campaign_id) || undefined,
            name: prospectName,
            description:
              crmDataRecord.data?.description ||
              crmDataRecord.data?.notes ||
              crmDataRecord.data?.comments ||
              "",
            company_name:
              crmDataRecord.data?.company_name ||
              crmDataRecord.data?.company ||
              "",
            company_contact:
              crmDataRecord.data?.company_contact ||
              crmDataRecord.data?.contact ||
              phone ||
              "",
            company_description:
              crmDataRecord.data?.company_description ||
              crmDataRecord.data?.company_notes ||
              "",
            // Pre-fill contact person fields
            contact_person_name: contactPersonName,
            contact_phone: phoneNumber,
            contact_phone_country_code: phoneCountryCode,
            // Add contact person to contact_persons array if we have name, phone, or email
            contact_persons: contactPersonName || phone || email
              ? [
                  {
                    title: crmDataRecord.data?.contact_person_title || "",
                    name: contactPersonName,
                    phone_country_code: phoneCountryCode,
                    phone: phoneNumber,
                    email: email,
                  },
                ]
              : prev.contact_persons,
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

          // Pre-fill campaign fields with CRM data (matching by field name)
          const preFilledFields: Record<string, any> = {};

          if (campaign.fields && selectedCrmData.data) {
            campaign.fields.forEach((field) => {
              // Try to find matching CRM data field by exact name, lowercase, or uppercase
              const crmDataValue =
                selectedCrmData.data[field.field_name] ||
                selectedCrmData.data[field.field_name.toLowerCase()] ||
                selectedCrmData.data[field.field_name.toUpperCase()] ||
                // Also try with underscores replaced by spaces and vice versa
                selectedCrmData.data[field.field_name.replace(/_/g, ' ')] ||
                selectedCrmData.data[field.field_name.replace(/ /g, '_')] ||
                selectedCrmData.data[field.field_name.replace(/_/g, ' ').toLowerCase()] ||
                selectedCrmData.data[field.field_name.replace(/ /g, '_').toLowerCase()];

              if (
                crmDataValue !== null &&
                crmDataValue !== undefined &&
                crmDataValue !== ""
              ) {
                // For dropdown fields, check if the value matches one of the options
                if (field.field_type === "dropdown" && field.field_options) {
                  const optionValues = field.field_options?.map((opt: any) => 
                    typeof opt === 'string' ? opt : opt.value || opt.label
                  ) || [];
                  const optionLabels = field.field_options?.map((opt: any) => 
                    typeof opt === 'string' ? opt : opt.label || opt.value
                  ) || [];
                  
                  // Check if CRM data value matches any option value or label
                  const stringValue = String(crmDataValue);
                  const matchesOption = optionValues.some((opt: string) => 
                    opt.toLowerCase() === stringValue.toLowerCase()
                  ) || optionLabels.some((opt: string) => 
                    opt.toLowerCase() === stringValue.toLowerCase()
                  );
                  
                  if (matchesOption) {
                    preFilledFields[field.field_name] = stringValue;
                  }
                } else {
                  // For non-dropdown fields, directly assign the value
                  preFilledFields[field.field_name] = String(crmDataValue);
                }
              }
            });
          }

          setFormData((prev) => ({
            ...prev,
            campaign_field_values: preFilledFields,
          }));
        } catch (error) {
          console.error(
            "Failed to fetch campaign details for auto-selection:",
            error
          );
        }
      }
    };

    fetchCampaignAndPreFill();
  }, [selectedCrmData]);

  const opportunityRef = useRef<"lead" | "opportunity">(isOpportunity ? 'opportunity' : 'lead');
  useEffect(() => {
    if (opportunityRef.current !== formData.type) {
      opportunityRef.current = formData.type;
      fetchStages(formData.type);
    }
  }, [formData.type]);

  const fetchStages = async (type: any) => {
    try {
      const stagesData = await getStages(type);
      if (type === opportunityRef.current) {
        setStages(stagesData || []);
      }
    } catch (error) {
      console.error("Failed to fetch stages:", error);
    }
  };

  const fetchExtensions = async () => {
    try {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_LEADS);
      if (hierarchyData?.extensions) {
        setExtensions(hierarchyData.extensions);
      }

      const hierarchyDataOpportunities = await GetHierarchyData(ModuleSlug.CRM_OPPORTUNITIES);
      if (hierarchyDataOpportunities?.extensions) {
        setExtensionsOpportunities(hierarchyDataOpportunities.extensions);
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

  const addContactPerson = () => {
    setFormData((prev) => ({
      ...prev,
      contact_persons: [
        ...prev.contact_persons,
        {
          title: "",
          name: "",
          phone_country_code: "",
          phone: "",
          email: "",
        },
      ],
    }));
  };

  const removeContactPerson = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contact_persons: prev.contact_persons.filter((_, i) => i !== index),
    }));
  };

  const updateContactPerson = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contact_persons: prev.contact_persons.map((person, i) =>
        i === index ? { ...person, [field]: value } : person
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.user_extension) {
      toast.error("Please select a user extension");
      return;
    }
    
    if (!formData.name) {
      toast.error("Please enter lead name");
      return;
    }
    
    setLoading(true);

    try {
      // Format payload according to API structure
      const payload: any = {
        name: formData.name,
        user_extension: formData.user_extension,
        ...(formData.stage_id && { stage_id: String(formData.stage_id) }),
        ...(formData.campaign_id && { campaign_id: String(formData.campaign_id) }),
        ...(formData.crm_data_id && { crm_data_id: String(formData.crm_data_id) }),
        ...(formData.source && { source: formData.source }),
        ...(formData.company_name && { company_name: formData.company_name }),
        ...(formData.industry && { industry: formData.industry }),
        ...(formData.business_type && { business_type: formData.business_type }),
        ...(formData.company_country && { company_country: formData.company_country }),
        ...(formData.company_city && { company_city: formData.company_city }),
        ...(formData.company_location_other && { company_location_other: formData.company_location_other }),
        ...(formData.company_size && { company_size: formData.company_size }),
        ...(formData.contact_person_title && { contact_person_title: formData.contact_person_title }),
        ...(formData.contact_person_name && { contact_person_name: formData.contact_person_name }),
        ...(formData.contact_phone_country_code && { contact_phone_country_code: formData.contact_phone_country_code }),
        ...(formData.contact_phone && { contact_phone: formData.contact_phone }),
        ...(formData.lead_potential && { lead_potential: formData.lead_potential }),
        ...(formData.other_information && Object.keys(formData.other_information).length > 0 && { other_information: formData.other_information }),
        ...(formData.campaign_field_values && Object.keys(formData.campaign_field_values).length > 0 && { campaign_field_values: formData.campaign_field_values }),
        ...(formData.contact_persons.length > 0 && { contact_persons: formData.contact_persons }),
      };

      await createLead(payload);
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
          if (field.field_type === "dropdown") {
            return;
          }

          // Try to find matching CRM data field
          const crmDataValue =
            selectedCrmData.data[field.field_name] ||
            selectedCrmData.data[field.field_name.toLowerCase()] ||
            selectedCrmData.data[field.field_name.toUpperCase()];

          if (
            crmDataValue !== null &&
            crmDataValue !== undefined &&
            crmDataValue !== ""
          ) {
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
      const basicCampaign = campaigns.find((c) => c.id === campaignId);
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
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
            placeholder={`Enter ${field.field_name}`}
          />
        );

      case "text":
        return (
          <Form.Control
            as="textarea"
            rows={3}
            value={fieldValue}
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
            placeholder={`Enter ${field.field_name}`}
          />
        );

      case "integer":
        return (
          <Form.Control
            type="number"
            value={fieldValue}
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
            placeholder={`Enter ${field.field_name}`}
          />
        );

      case "date":
        return (
          <Form.Control
            type="date"
            value={fieldValue}
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
          />
        );

      case "dropdown":
        return (
          <Form.Select
            value={fieldValue}
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
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
            onChange={(e) =>
              handleCampaignFieldChange(field.field_name, e.target.value)
            }
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
          <Link
            href={isOpportunity ? "/crm/opportunities" : "/crm/leads"}
            className="btn btn-primary"
          >
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
                  <h4 className="mb-0 app-heading">
                    {isOpportunity ? "Opportunity" : "Lead"} Information
                  </h4>
                  {selectedCrmData && (
                    <Badge bg="info" className="d-flex align-items-center">
                      <FiDatabase className="me-1" size={14} />
                      Pre-filled from CRM Data #{selectedCrmData.id}
                    </Badge>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                {/* Timeline Navigation */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between position-relative">
                    {/* Progress Line */}
                    <div 
                      className="position-absolute bg-light" 
                      style={{ 
                        left: '0', 
                        right: '0', 
                        top: '20px', 
                        height: '2px', 
                        zIndex: 0 
                      }}
                    />
                    <div 
                      className="position-absolute bg-primary" 
                      style={{ 
                        left: '0', 
                        top: '20px', 
                        height: '2px', 
                        width: `${(formStep / 3) * 100}%`,
                        zIndex: 0,
                        transition: 'width 0.3s ease'
                      }}
                    />
                    
                    {/* Step 1 */}
                    <div 
                      className="text-center position-relative" 
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => setFormStep(0)}
                    >
                      <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${formStep >= 0 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                        style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                      >
                        {formStep > 0 ? <CheckCircle size={20} /> : '1'}
                      </div>
                      <small className={`d-block mt-2 ${formStep === 0 ? 'fw-bold text-primary' : 'text-muted'}`}>Lead Info</small>
                    </div>

                    {/* Step 2 */}
                    <div 
                      className="text-center position-relative" 
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => setFormStep(1)}
                    >
                      <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${formStep >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                        style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                      >
                        {formStep > 1 ? <CheckCircle size={20} /> : '2'}
                      </div>
                      <small className={`d-block mt-2 ${formStep === 1 ? 'fw-bold text-primary' : 'text-muted'}`}>Company Info</small>
                    </div>

                    {/* Step 3 */}
                    <div 
                      className="text-center position-relative" 
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => setFormStep(2)}
                    >
                      <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${formStep >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                        style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                      >
                        {formStep > 2 ? <CheckCircle size={20} /> : '3'}
                      </div>
                      <small className={`d-block mt-2 ${formStep === 2 ? 'fw-bold text-primary' : 'text-muted'}`}>Contact Persons</small>
                    </div>

                    {/* Step 4 */}
                    <div 
                      className="text-center position-relative" 
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => setFormStep(3)}
                    >
                      <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${formStep >= 3 ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                        style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                      >
                        {formStep > 3 ? <CheckCircle size={20} /> : '4'}
                      </div>
                      <small className={`d-block mt-2 ${formStep === 3 ? 'fw-bold text-primary' : 'text-muted'}`}>Other Info</small>
                    </div>
                  </div>
                </div>

                <Form onSubmit={handleSubmit}>
                  {/* Form Content Based on Step */}
                  <div style={{ minHeight: '400px' }}>
                    {formStep === 0 && (
                      <Card className="border-0 bg-light">
                        <Card.Body>
                          <h5 className="fw-bold mb-4 text-primary">LEAD INFORMATION</h5>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Lead Name <span className="text-danger">*</span></Form.Label>
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
                                <Form.Label>User Extension <span className="text-danger">*</span></Form.Label>
                                {formData.type === "opportunity" ? (
                                  <Select
                                    value={
                                      formData.user_extension
                                        ? {
                                            value: formData.user_extension,
                                            label: extensionsOpportunities.find(
                                              (ext: any) => ext.id.toString() === formData.user_extension?.toString()
                                            )?.display_name || "",
                                          }
                                        : null
                                    }
                                    onChange={(selectedOption: any) => {
                                      handleInputChange("user_extension", selectedOption?.value || null);
                                    }}
                                    options={extensionsOpportunities.map((extension: any) => ({
                                      value: extension.id,
                                      label: extension.display_name,
                                    }))}
                                    placeholder="Select User Extension"
                                    isClearable
                                    isSearchable
                                    required
                                  />
                                ) : (
                                  <Select
                                    value={
                                      formData.user_extension
                                        ? {
                                            value: formData.user_extension,
                                            label: extensions.find(
                                              (ext: any) => ext.id.toString() === formData.user_extension?.toString()
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
                                    placeholder="Select User Extension"
                                    isClearable
                                    isSearchable
                                    required
                                  />
                                )}
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Stage</Form.Label>
                                <Form.Select
                                  value={formData.stage_id || ""}
                                  onChange={(e) =>
                                    handleInputChange("stage_id", e.target.value ? Number(e.target.value) : undefined)
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
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Source</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.source}
                                  onChange={(e) => handleInputChange("source", e.target.value)}
                                  placeholder="e.g., LinkedIn, Website, Referral"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Campaign</Form.Label>
                                <Select
                                  value={
                                    formData.campaign_id
                                      ? {
                                          value: formData.campaign_id,
                                          label: campaigns.find((c) => c.id === formData.campaign_id)?.name || "",
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
                                          label: `#${formData.crm_data_id} - ${crmData.find((d) => d.id === formData.crm_data_id)?.phone || "No Phone"}`,
                                        }
                                      : null
                                  }
                                  onChange={(selectedOption: any) => {
                                    handleInputChange("crm_data_id", selectedOption?.value || undefined);
                                  }}
                                  options={crmData.map((data) => ({
                                    value: data.id,
                                    label: `#${data.id} - ${data.phone || "No Phone"}`,
                                  }))}
                                  placeholder="Select CRM data (Optional)"
                                  isClearable
                                  isSearchable
                                />
                              </Form.Group>
                            </Col>
                            <Col md={12}>
                              <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control 
                                  as="textarea" 
                                  rows={3} 
                                  value={formData.description}
                                  onChange={(e) => handleInputChange("description", e.target.value)}
                                  placeholder="Enter lead description or notes"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    )}

                    {formStep === 1 && (
                      <Card className="border-0 bg-light">
                        <Card.Body>
                          <h5 className="fw-bold mb-4 text-success">COMPANY INFORMATION</h5>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Company Name</Form.Label>
                                <Form.Control 
                                  type="text" 
                                  value={formData.company_name}
                                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                                  placeholder="Enter company name" 
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Industry</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.industry}
                                  onChange={(e) => handleInputChange("industry", e.target.value)}
                                  placeholder="e.g., Technology, Finance, Healthcare"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Business Type</Form.Label>
                                <Form.Select
                                  value={formData.business_type}
                                  onChange={(e) => handleInputChange("business_type", e.target.value)}
                                >
                                  <option value="">Select Type</option>
                                  <option value="B2B">B2B (Business to Business)</option>
                                  <option value="B2C">B2C (Business to Consumer)</option>
                                  <option value="B2G">B2G (Business to Government)</option>
                                  <option value="Non-profit / NGO">Non-profit / NGO</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Company Country</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.company_country}
                                  onChange={(e) => handleInputChange("company_country", e.target.value)}
                                  placeholder="Enter country"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Company City</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.company_city}
                                  onChange={(e) => handleInputChange("company_city", e.target.value)}
                                  placeholder="Enter city"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Company Size</Form.Label>
                                <Form.Select
                                  value={formData.company_size}
                                  onChange={(e) => handleInputChange("company_size", e.target.value)}
                                >
                                  <option value="">Select Size</option>
                                  <option value="Micro (1-10 employees)">Micro (1-10 employees)</option>
                                  <option value="Small (11-50 employees)">Small (11-50 employees)</option>
                                  <option value="Medium (51-200 employees)">Medium (51-200 employees)</option>
                                  <option value="Large (201-500 employees)">Large (201-500 employees)</option>
                                  <option value="Enterprise (500+ employees)">Enterprise (500+ employees)</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={12}>
                              <Form.Group className="mb-3">
                                <Form.Label>Company Location Other</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.company_location_other}
                                  onChange={(e) => handleInputChange("company_location_other", e.target.value)}
                                  placeholder="Additional location information"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    )}

                    {formStep === 2 && (
                      <Card className="border-0 bg-light">
                        <Card.Body>
                          <h5 className="fw-bold mb-4 text-warning">CONTACT PERSONS</h5>
                          {formData.contact_persons.map((person, index) => (
                            <Card key={index} className="mb-3 border">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h6 className="mb-0">Contact Person {index + 1}</h6>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => removeContactPerson(index)}
                                  >
                                    <X size={16} />
                                  </Button>
                                </div>
                                <Row>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>Title</Form.Label>
                                      <Form.Select
                                        value={person.title}
                                        onChange={(e) => updateContactPerson(index, "title", e.target.value)}
                                      >
                                        <option value="">Select Title</option>
                                        <option value="Mr.">Mr.</option>
                                        <option value="Mrs.">Mrs.</option>
                                        <option value="Ms.">Ms.</option>
                                        <option value="Dr.">Dr.</option>
                                        <option value="Prof.">Prof.</option>
                                      </Form.Select>
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>Name</Form.Label>
                                      <Form.Control
                                        type="text"
                                        value={person.name}
                                        onChange={(e) => updateContactPerson(index, "name", e.target.value)}
                                        placeholder="Enter contact name"
                                      />
                                    </Form.Group>
                                  </Col>
                                  <Col md={12}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>Phone</Form.Label>
                                      <div className="phone-input-wrapper">
                                        <PhoneInput
                                          international
                                          defaultCountry="US"
                                          value={person.phone_country_code && person.phone 
                                            ? `${person.phone_country_code}${person.phone}` 
                                            : person.phone || undefined}
                                          onChange={(value) => {
                                            if (value) {
                                              try {
                                                // Parse the phone number to extract country code and national number
                                                const phoneNumber = parsePhoneNumber(value);
                                                if (phoneNumber) {
                                                  updateContactPerson(index, "phone_country_code", `+${phoneNumber.countryCallingCode}`);
                                                  updateContactPerson(index, "phone", phoneNumber.nationalNumber);
                                                } else {
                                                  // Fallback: store full number in phone field
                                                  updateContactPerson(index, "phone_country_code", "");
                                                  updateContactPerson(index, "phone", value);
                                                }
                                              } catch (error) {
                                                // If parsing fails, store full number in phone field
                                                updateContactPerson(index, "phone_country_code", "");
                                                updateContactPerson(index, "phone", value);
                                              }
                                            } else {
                                              updateContactPerson(index, "phone_country_code", "");
                                              updateContactPerson(index, "phone", "");
                                            }
                                          }}
                                          placeholder="Enter phone number"
                                        />
                                      </div>
                                    </Form.Group>
                                  </Col>
                                  <Col md={12}>
                                    <Form.Group className="mb-3">
                                      <Form.Label>Email</Form.Label>
                                      <Form.Control
                                        type="email"
                                        value={person.email}
                                        onChange={(e) => updateContactPerson(index, "email", e.target.value)}
                                        placeholder="Enter email address"
                                      />
                                    </Form.Group>
                                  </Col>
                                </Row>
                              </Card.Body>
                            </Card>
                          ))}
                          <Button
                            variant="outline-primary"
                            onClick={addContactPerson}
                            className="w-100"
                          >
                            <FiPlus className="me-2" />
                            Add Contact Person
                          </Button>
                        </Card.Body>
                      </Card>
                    )}

                    {formStep === 3 && (
                      <Card className="border-0 bg-light">
                        <Card.Body>
                          <h5 className="fw-bold mb-4 text-info">OTHER INFORMATION</h5>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Lead Potential</Form.Label>
                                <Form.Select
                                  value={formData.lead_potential}
                                  onChange={(e) => handleInputChange("lead_potential", e.target.value)}
                                >
                                  <option value="">Select Potential</option>
                                  <option value="Hot">Hot</option>
                                  <option value="Warm">Warm</option>
                                  <option value="Cold">Cold</option>
                                </Form.Select>
                                <Form.Text className="text-muted">Likelihood of converting based on engagement</Form.Text>
                              </Form.Group>
                            </Col>
                          </Row>

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
                              <Row>
                                {selectedCampaign.fields.map((field, index) => (
                                  <Col md={6} key={index} className="mb-3">
                                    <Form.Group>
                                      <Form.Label>{field.field_name}</Form.Label>
                                      {renderCampaignField(field)}
                                    </Form.Group>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          )}

                          <div className="alert alert-success small mt-3">
                            <CheckCircle size={14} className="me-1" />
                            All required fields are marked with <span className="text-danger">*</span>. Complete all sections to create the lead.
                          </div>
                        </Card.Body>
                      </Card>
                    )}
                  </div>
                  
                  <div className="d-flex justify-content-between mt-4">
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setFormStep(Math.max(0, formStep - 1))}
                      disabled={formStep === 0}
                    >
                      <ChevronLeft size={16} className="me-1" />
                      Back
                    </Button>
                    <Link 
                      href={isOpportunity ? "/crm/opportunities" : "/crm/leads"} 
                      className="btn btn-secondary"
                    >
                      Cancel
                    </Link>
                    {formStep < 3 ? (
                      <Button 
                        variant="primary" 
                        onClick={(e) => {
                          e.preventDefault();
                          setFormStep(Math.min(3, formStep + 1));
                        }}
                      >
                        Next
                        <ChevronRight size={16} className="ms-1" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit"
                        variant="success"
                        disabled={loading}
                      >
                        <CheckCircle size={16} className="me-2" />
                        {loading ? "Creating..." : "Create Lead"}
                      </Button>
                    )}
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
