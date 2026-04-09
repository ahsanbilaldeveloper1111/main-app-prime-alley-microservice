import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Row, Col, Form, Card, Badge } from "react-bootstrap";
import Select from "react-select";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import { Country, State, City } from "country-state-city";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiTarget,
} from "react-icons/fi";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  createLead,
  getStages,
  CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
  getCampaigns,
  getCampaignById,
  getCrmDataById,
  getBusinessTypes,
  getIndustries,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { useSession } from "next-auth/react";
import { ModuleSlug } from "@utils/Helper";
import "react-phone-number-input/style.css";

interface ConvertToLeadModalProps {
  show: boolean;
  onHide: () => void;
  prospectId: number;
  onSuccess?: () => void;
}

const ConvertToLeadModal: React.FC<ConvertToLeadModalProps> = ({
  show,
  onHide,
  prospectId,
  onSuccess,
}) => {
  const { data: session } = useSession();
  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  // Form state
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
    contact_persons: [
      {
        title: "Mr.",
        name: "",
        phone_country_code: "",
        phone: "",
        email: "",
      },
    ],
  });

  // Dropdown data state
  const [stages, setStages] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [selectedCrmData, setSelectedCrmData] = useState<any>(null);

  // Business type state
  const [businessTypeId, setBusinessTypeId] = useState<number | null>(null);
  const [businessTypeOther, setBusinessTypeOther] = useState<string>("");
  const [showOtherBusinessType, setShowOtherBusinessType] = useState(false);

  // Location state
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  const isInitialLoad = useRef(true);

  // Utility functions
  const parsePhoneNumberFormat = (phone: string) => {
    if (!phone) return { countryCode: "", phoneNumber: "" };
    const match = phone.match(/^(\+\d{1,4})\s+(.+)$/);
    if (match) {
      return {
        countryCode: match[1],
        phoneNumber: match[2],
      };
    }
    return { countryCode: "", phoneNumber: phone };
  };

  const getCountryFlagUrl = (isoCode: string): string => {
    return `https://flagcdn.com/w20/${isoCode.toLowerCase()}.png`;
  };

  const getCountries = () => {
    return Country.getAllCountries().map((country) => ({
      value: country.isoCode,
      label: country.name,
      isoCode: country.isoCode,
    }));
  };

  const getStates = (countryCode: string) => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map((state) => ({
      value: state.isoCode,
      label: state.name,
    }));
  };

  const getCities = (countryCode: string, stateCode: string) => {
    if (!countryCode || !stateCode) return [];
    return City.getCitiesOfState(countryCode, stateCode).map((city) => ({
      value: city.name,
      label: city.name,
    }));
  };

  // Fetch initial data
  useEffect(() => {
    if (show && prospectId) {
      fetchInitialData();
    }
  }, [show, prospectId]);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      // Fetch all required data in parallel
      const [
        stagesData,
        hierarchyData,
        campaignsData,
        businessTypesData,
        crmDataRecord,
      ] = await Promise.all([
        getStages("lead"),
        GetHierarchyData(ModuleSlug.CRM_LEADS),
        getCampaigns({
          per_page: 100,
          filters: CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
        }),
        getBusinessTypes({ per_page: 1000 }),
        getCrmDataById(prospectId),
      ]);

      setStages(stagesData || []);
      setExtensions(hierarchyData?.extensions || []);
      setCampaigns(campaignsData?.data || []);
      setBusinessTypes(businessTypesData?.data || []);
      setSelectedCrmData(crmDataRecord);

      // Pre-fill form with prospect data
      if (crmDataRecord) {
        const prospectName =
          crmDataRecord.data?.name ||
          crmDataRecord.data?.full_name ||
          crmDataRecord.data?.first_name ||
          crmDataRecord.name ||
          crmDataRecord.phone ||
          "";

        const contactPersonName =
          crmDataRecord.data?.contact_person_name ||
          crmDataRecord.data?.contact_name ||
          crmDataRecord.data?.name ||
          crmDataRecord.data?.full_name ||
          crmDataRecord.data?.first_name ||
          crmDataRecord.name ||
          "";

        const email =
          crmDataRecord.data?.email ||
          crmDataRecord.data?.contact_email ||
          crmDataRecord.data?.email_address ||
          "";

        const phone = crmDataRecord.phone || crmDataRecord.data?.phone || "";
        const parsedPhone = parsePhoneNumberFormat(phone);
        const phoneCountryCode = parsedPhone.countryCode || "";
        const phoneNumber = parsedPhone.phoneNumber || phone;

        const source =
          crmDataRecord.data?.source ||
          crmDataRecord.data?.lead_source ||
          crmDataRecord.data?.source_type ||
          "File Upload";

        const userExtension = crmDataRecord.user_extension
          ? String(crmDataRecord.user_extension)
          : (session?.user as any)?.extension || null;

        setFormData({
          ...formData,
          crm_data_id: prospectId,
          campaign_id: Number(crmDataRecord.campaign_id) || undefined,
          name: prospectName,
          user_extension: userExtension,
          source: source,
          description:
            crmDataRecord.data?.description ||
            crmDataRecord.data?.notes ||
            crmDataRecord.data?.comments ||
            "",
          company_name:
            crmDataRecord.data?.company_name ||
            crmDataRecord.data?.company ||
            "",
          company_contact: phone || "",
          company_country:
            crmDataRecord.data?.company_country ||
            crmDataRecord.data?.country ||
            "",
          company_province:
            crmDataRecord.data?.company_province ||
            crmDataRecord.data?.province ||
            crmDataRecord.data?.state ||
            "",
          company_city:
            crmDataRecord.data?.company_city ||
            crmDataRecord.data?.city ||
            "",
          contact_person_name: contactPersonName,
          contact_phone: phoneNumber,
          contact_phone_country_code: phoneCountryCode,
          contact_persons:
            contactPersonName || phone || email
              ? [
                  {
                    title: crmDataRecord.data?.contact_person_title || "Mr.",
                    name: contactPersonName,
                    phone_country_code: phoneCountryCode,
                    phone: phoneNumber,
                    email: email,
                  },
                ]
              : [
                  {
                    title: "Mr.",
                    name: "",
                    phone_country_code: "",
                    phone: "",
                    email: "",
                  },
                ],
        });

        // Auto-select campaign if available
        if (crmDataRecord.campaign_id) {
          const campaign = await getCampaignById(crmDataRecord.campaign_id);
          setSelectedCampaign(campaign);

          // Pre-fill campaign fields
          const preFilledFields: Record<string, any> = {};
          if (campaign.fields && crmDataRecord.data) {
            campaign.fields.forEach((field: any) => {
              const crmDataValue =
                crmDataRecord.data[field.field_name] ||
                crmDataRecord.data[field.field_name.toLowerCase()] ||
                crmDataRecord.data[field.field_name.toUpperCase()];

              if (
                crmDataValue !== null &&
                crmDataValue !== undefined &&
                crmDataValue !== ""
              ) {
                if (field.field_type === "dropdown" && field.field_options) {
                  const stringValue = String(crmDataValue);
                  const matchesOption = field.field_options.some(
                    (opt: any) =>
                      String(typeof opt === "string" ? opt : opt.value || opt.label)
                        .toLowerCase() === stringValue.toLowerCase()
                  );
                  if (matchesOption) {
                    preFilledFields[field.field_name] = stringValue;
                  }
                } else {
                  preFilledFields[field.field_name] = String(crmDataValue);
                }
              }
            });
          }

          setFormData((prev) => ({
            ...prev,
            campaign_field_values: preFilledFields,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      toast.error("Failed to load prospect data");
    } finally {
      setLoadingData(false);
    }
  };

  // Handle form submission (same validation as CreateLeadModal - step-by-step checks)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep0() || !validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        user_extension: formData.user_extension,
        stage_id: String(formData.stage_id),
        ...(formData.campaign_id && {
          campaign_id: String(formData.campaign_id),
        }),
        ...(formData.crm_data_id && {
          crm_data_id: String(formData.crm_data_id),
        }),
        ...(formData.source && { source: formData.source }),
        ...(formData.description && { description: formData.description }),
        ...(formData.company_name && { company_name: formData.company_name }),
        ...(formData.industry && { industry: formData.industry }),
        ...(businessTypeId && { business_type_id: String(businessTypeId) }),
        ...(businessTypeOther && { business_type_other: businessTypeOther }),
        ...(formData.company_country && {
          company_country: formData.company_country,
        }),
        ...(formData.company_province && {
          company_province: formData.company_province,
        }),
        ...(formData.company_city && { company_city: formData.company_city }),
        ...(formData.company_location_other && {
          company_location_other: formData.company_location_other,
        }),
        ...(formData.company_size && { company_size: formData.company_size }),
        ...(formData.lead_potential && {
          lead_potential: formData.lead_potential,
        }),
        ...(formData.campaign_field_values &&
          Object.keys(formData.campaign_field_values).length > 0 && {
            campaign_field_values: formData.campaign_field_values,
          }),
        ...(formData.contact_persons.length > 0 && {
          contact_persons: formData.contact_persons,
        }),
      };

      await createLead(payload);
      toast.success("Lead created successfully!");
      
      if (onSuccess) {
        onSuccess();
      }
      
      handleClose();
    } catch (error) {
      toast.error("Failed to create lead");
      console.error("Create lead error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setFormStep(0);
    setFormData({
      name: "",
      user_extension: null,
      type: "lead",
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
      stage_id: undefined,
      campaign_id: undefined,
      crm_data_id: undefined,
      lead_potential: "",
      other_information: {},
      campaign_field_values: {},
      contact_persons: [
        {
          title: "Mr.",
          name: "",
          phone_country_code: "",
          phone: "",
          email: "",
        },
      ],
    });
    setSelectedCampaign(null);
    setSelectedCrmData(null);
    setBusinessTypeId(null);
    setBusinessTypeOther("");
    setShowOtherBusinessType(false);
    setSelectedCountry(null);
    setSelectedState(null);
    setSelectedCity(null);
    
    onHide();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addContactPerson = () => {
    setFormData((prev) => ({
      ...prev,
      contact_persons: [
        ...prev.contact_persons,
        {
          title: "Mr.",
          name: "",
          phone_country_code: "",
          phone: "",
          email: "",
        },
      ],
    }));
  };

  const removeContactPerson = (index: number) => {
    setFormData((prev) => {
      if (prev.contact_persons.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        contact_persons: prev.contact_persons.filter((_, i) => i !== index),
      };
    });
  };

  const updateContactPerson = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contact_persons: prev.contact_persons.map((person, i) =>
        i === index ? { ...person, [field]: value } : person
      ),
    }));
  };

  const handleCountryChange = (selectedOption: any) => {
    setSelectedCountry(selectedOption);
    setSelectedState(null);
    setSelectedCity(null);
    setFormData((prev) => ({
      ...prev,
      company_country: selectedOption?.label || "",
      company_province: "",
      company_city: "",
    }));
  };

  const handleStateChange = (selectedOption: any) => {
    setSelectedState(selectedOption);
    setSelectedCity(null);
    setFormData((prev) => ({
      ...prev,
      company_province: selectedOption?.label || "",
      company_city: "",
    }));
  };

  const handleCityChange = (selectedOption: any) => {
    setSelectedCity(selectedOption);
    setFormData((prev) => ({
      ...prev,
      company_city: selectedOption?.label || "",
    }));
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

  // Validation functions (aligned with CreateLeadModal - same required/optional fields and error messages)
  const validateStep0 = (): boolean => {
    if (!formData.name?.trim()) {
      toast.error("Lead name is required");
      return false;
    }
    if (formData.user_extension == null || formData.user_extension === "") {
      toast.error("Assigned To is required");
      return false;
    }
    if (!formData.stage_id) {
      toast.error("Stage is required");
      return false;
    }
    return true;
  };

  const validateStep1 = (): boolean => {
    if (!formData.company_name?.trim()) {
      toast.error("Company name is required");
      return false;
    }
    if (showOtherBusinessType && !businessTypeOther?.trim()) {
      toast.error("Please specify the business type");
      return false;
    }
    if (!showOtherBusinessType && !businessTypeId) {
      toast.error("Business type is required");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.contact_persons?.length) {
      toast.error("Please add at least one contact person");
      return false;
    }
    for (let i = 0; i < formData.contact_persons.length; i++) {
      const person = formData.contact_persons[i];
      if (!person.title?.trim()) {
        toast.error(`Contact person ${i + 1}: Title is required`);
        return false;
      }
      if (!person.name?.trim()) {
        toast.error(`Contact person ${i + 1}: Name is required`);
        return false;
      }
      if (!person.phone?.trim()) {
        toast.error(`Contact person ${i + 1}: Phone is required`);
        return false;
      }
      if (!person.email?.trim()) {
        toast.error(`Contact person ${i + 1}: Email is required`);
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(person.email)) {
        toast.error(`Contact person ${i + 1}: Invalid email format`);
        return false;
      }
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (selectedCampaign?.fields) {
      const requiredCampaignFields = selectedCampaign.fields.filter(
        (field: any) => field.is_required
      );
      for (const field of requiredCampaignFields) {
        const fieldValue = formData.campaign_field_values?.[field.field_name];
        if (!fieldValue || (typeof fieldValue === "string" && fieldValue.trim() === "")) {
          toast.error(`${field.field_name} is required`);
          return false;
        }
      }
    }
    return true;
  };

  const validateCurrentStep = (): boolean => {
    switch (formStep) {
      case 0:
        return validateStep0();
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      default:
        return true;
    }
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateCurrentStep()) {
      setFormStep(Math.min(3, formStep + 1));
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl"
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <div className="d-flex align-items-center gap-2">
            <FiTarget size={24} className="text-primary" />
            <span>Convert to Lead</span>
            {selectedCrmData && (
              <Badge bg="info" className="ms-2">
                Prospect: {selectedCrmData?.name || `#${selectedCrmData?.id}`}
              </Badge>
            )}
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "calc(90vh - 200px)", overflowY: "auto" }}>
        {loadingData ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading prospect data...</p>
          </div>
        ) : (
          <>
            {/* Timeline Navigation */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between position-relative">
                <div
                  className="position-absolute bg-light"
                  style={{
                    left: "0",
                    right: "0",
                    top: "20px",
                    height: "2px",
                    zIndex: 0,
                  }}
                />
                <div
                  className="position-absolute bg-primary"
                  style={{
                    left: "0",
                    top: "20px",
                    height: "2px",
                    width: `${(formStep / 3) * 100}%`,
                    zIndex: 0,
                    transition: "width 0.3s ease",
                  }}
                />

                {["Lead Info", "Company Info", "Contact Persons", "Other Info"].map(
                  (label, index) => (
                    <div
                      key={index}
                      className="text-center position-relative"
                      style={{ cursor: "pointer", flex: 1 }}
                      onClick={() => setFormStep(index)}
                    >
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${
                          formStep >= index
                            ? "bg-primary text-white"
                            : "bg-light text-muted"
                        }`}
                        style={{
                          width: "40px",
                          height: "40px",
                          zIndex: 1,
                          position: "relative",
                        }}
                      >
                        {formStep > index ? <CheckCircle size={20} /> : index + 1}
                      </div>
                      <small
                        className={`d-block mt-2 ${
                          formStep === index
                            ? "fw-bold text-primary"
                            : "text-muted"
                        }`}
                      >
                        {label}
                      </small>
                    </div>
                  )
                )}
              </div>
            </div>

            <Form onSubmit={handleSubmit}>
              {/* Step 0: Lead Info */}
              {formStep === 0 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-primary">LEAD INFORMATION</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Lead Name <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            placeholder="Enter lead name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Assigned To <span className="text-danger">*</span>
                          </Form.Label>
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
                            placeholder="Select User"
                            isClearable
                            isSearchable
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Stage <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            value={formData.stage_id || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "stage_id",
                                e.target.value ? Number(e.target.value) : undefined
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
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Source</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.source}
                            onChange={(e) =>
                              handleInputChange("source", e.target.value)
                            }
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
                                    label:
                                      campaigns.find(
                                        (c) => c.id === formData.campaign_id
                                      )?.name || "",
                                  }
                                : null
                            }
                            onChange={async (selectedOption: any) => {
                              const campaignId = selectedOption?.value;
                              if (campaignId) {
                                const campaign = await getCampaignById(campaignId);
                                setSelectedCampaign(campaign);
                              } else {
                                setSelectedCampaign(null);
                              }
                              handleInputChange("campaign_id", campaignId || undefined);
                            }}
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
                      <Col md={12}>
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
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Step 1: Company Info */}
              {formStep === 1 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-success">CLIENT INFORMATION</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Company Name <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.company_name}
                            onChange={(e) =>
                              handleInputChange("company_name", e.target.value)
                            }
                            placeholder="Enter person name/company name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Business Type <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            value={
                              showOtherBusinessType
                                ? "other"
                                : businessTypeId
                                ? String(businessTypeId)
                                : ""
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "other") {
                                setShowOtherBusinessType(true);
                                setBusinessTypeId(null);
                                setBusinessTypeOther("");
                              } else if (value) {
                                setShowOtherBusinessType(false);
                                setBusinessTypeId(Number(value));
                                setBusinessTypeOther("");
                              } else {
                                setShowOtherBusinessType(false);
                                setBusinessTypeId(null);
                                setBusinessTypeOther("");
                              }
                            }}
                          >
                            <option value="">Select Business Type</option>
                            {businessTypes.map((businessType: any) => (
                              <option key={businessType.id} value={businessType.id}>
                                {businessType.name}
                              </option>
                            ))}
                            <option value="other">Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      {showOtherBusinessType && (
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Business Type (Other) <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={businessTypeOther}
                              onChange={(e) => setBusinessTypeOther(e.target.value)}
                              placeholder="Enter business type"
                            />
                          </Form.Group>
                        </Col>
                      )}

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Country</Form.Label>
                          <Select
                            value={selectedCountry}
                            onChange={handleCountryChange}
                            options={getCountries()}
                            placeholder="Select Country"
                            isClearable
                            isSearchable
                            formatOptionLabel={({ label, isoCode }) => (
                              <div className="d-flex align-items-center">
                                {isoCode && (
                                  <img
                                    src={getCountryFlagUrl(isoCode)}
                                    alt={isoCode}
                                    className="me-2"
                                    style={{
                                      width: "20px",
                                      height: "15px",
                                    }}
                                  />
                                )}
                                <span>{label}</span>
                              </div>
                            )}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>State/Province</Form.Label>
                          <Select
                            value={selectedState}
                            onChange={handleStateChange}
                            options={getStates(selectedCountry?.value || "")}
                            placeholder="Select State/Province"
                            isClearable
                            isSearchable
                            isDisabled={!selectedCountry}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company City</Form.Label>
                          <Select
                            value={selectedCity}
                            onChange={handleCityChange}
                            options={getCities(
                              selectedCountry?.value || "",
                              selectedState?.value || ""
                            )}
                            placeholder="Select City"
                            isClearable
                            isSearchable
                            isDisabled={!selectedCountry || !selectedState}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Size</Form.Label>
                          <Form.Select
                            value={formData.company_size}
                            onChange={(e) =>
                              handleInputChange("company_size", e.target.value)
                            }
                          >
                            <option value="">Select Size</option>
                            <option value="Micro (1-10 employees)">
                              Micro (1-10 employees)
                            </option>
                            <option value="Small (11-50 employees)">
                              Small (11-50 employees)
                            </option>
                            <option value="Medium (51-200 employees)">
                              Medium (51-200 employees)
                            </option>
                            <option value="Large (201-500 employees)">
                              Large (201-500 employees)
                            </option>
                            <option value="Enterprise (500+ employees)">
                              Enterprise (500+ employees)
                            </option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Location Notes</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.company_location_other}
                            onChange={(e) =>
                              handleInputChange(
                                "company_location_other",
                                e.target.value
                              )
                            }
                            placeholder="Landmark, Access Instructions, Directions, etc."
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Step 2: Contact Persons */}
              {formStep === 2 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold mb-0 text-warning">
                        CONTACT PERSONS
                      </h5>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={addContactPerson}
                      >
                        <FiPlus className="me-1" size={14} />
                        Add Contact Person
                      </Button>
                    </div>
                    {formData.contact_persons.map((person, index) => (
                      <Card key={index} className="mb-3 border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">Contact Person {index + 1}</h6>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeContactPerson(index)}
                              disabled={formData.contact_persons.length <= 1}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Title <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                  value={person.title}
                                  onChange={(e) =>
                                    updateContactPerson(
                                      index,
                                      "title",
                                      e.target.value
                                    )
                                  }
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
                                <Form.Label>
                                  Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={person.name}
                                  onChange={(e) =>
                                    updateContactPerson(
                                      index,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter contact name"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={12}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Phone <span className="text-danger">*</span>
                                </Form.Label>
                                <div className="phone-input-wrapper">
                                  <PhoneInput
                                    international
                                    defaultCountry="US"
                                    value={
                                      person.phone_country_code && person.phone
                                        ? `${person.phone_country_code}${person.phone}`
                                        : person.phone || undefined
                                    }
                                    onChange={(value) => {
                                      if (value) {
                                        try {
                                          const phoneNumber = parsePhoneNumber(value);
                                          if (phoneNumber) {
                                            updateContactPerson(
                                              index,
                                              "phone_country_code",
                                              `+${phoneNumber.countryCallingCode}`
                                            );
                                            updateContactPerson(
                                              index,
                                              "phone",
                                              phoneNumber.nationalNumber
                                            );
                                          } else {
                                            updateContactPerson(
                                              index,
                                              "phone_country_code",
                                              ""
                                            );
                                            updateContactPerson(
                                              index,
                                              "phone",
                                              value
                                            );
                                          }
                                        } catch (error) {
                                          updateContactPerson(
                                            index,
                                            "phone_country_code",
                                            ""
                                          );
                                          updateContactPerson(index, "phone", value);
                                        }
                                      } else {
                                        updateContactPerson(
                                          index,
                                          "phone_country_code",
                                          ""
                                        );
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
                                <Form.Label>
                                  Email <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="email"
                                  value={person.email}
                                  onChange={(e) =>
                                    updateContactPerson(
                                      index,
                                      "email",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter email address"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </Card.Body>
                </Card>
              )}

              {/* Step 3: Other Info */}
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
                            onChange={(e) =>
                              handleInputChange("lead_potential", e.target.value)
                            }
                          >
                            <option value="">Select Potential</option>
                            <option value="Hot">Hot</option>
                            <option value="Warm">Warm</option>
                            <option value="Cold">Cold</option>
                          </Form.Select>
                          <Form.Text className="text-muted">
                            Likelihood of converting based on engagement
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Campaign Custom Fields */}
                    {selectedCampaign &&
                      selectedCampaign.fields &&
                      selectedCampaign.fields.length > 0 && (
                        <div className="border-top pt-3 mt-4">
                          <div className="d-flex align-items-center mb-3">
                            <FiTarget className="me-2" />
                            <h6 className="mb-0">
                              Custom Campaign Fields: {selectedCampaign.name}
                            </h6>
                            {selectedCrmData && (
                              <Badge bg="success" className="ms-2 small">
                                Auto-filled from Prospect
                              </Badge>
                            )}
                          </div>
                          <Row>
                            {selectedCampaign.fields.map((field: any, index: number) => (
                              <Col md={6} key={index} className="mb-3">
                                <Form.Group>
                                  <Form.Label>
                                    {field.field_name}
                                    {field.is_required && (
                                      <span className="text-danger ms-1">*</span>
                                    )}
                                  </Form.Label>
                                  {renderCampaignField(field)}
                                </Form.Group>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      )}

                    <div className="alert alert-success small mt-3">
                      <CheckCircle size={14} className="me-1" />
                      All required fields are marked with{" "}
                      <span className="text-danger">*</span>. Complete all sections
                      to create the lead.
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Form>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => setFormStep(Math.max(0, formStep - 1))}
          disabled={formStep === 0 || loadingData}
        >
          <ChevronLeft size={16} className="me-1" />
          Back
        </Button>
        {formStep < 3 ? (
          <Button
            variant="primary"
            onClick={handleNextStep}
            disabled={loadingData}
          >
            Next
            <ChevronRight size={16} className="ms-1" />
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={loading || loadingData}
          >
            <CheckCircle size={16} className="me-2" />
            {loading ? "Creating..." : "Create Lead"}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ConvertToLeadModal;