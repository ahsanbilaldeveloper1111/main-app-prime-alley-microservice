import React, { ReactElement, useState, useEffect, useRef } from "react";
import {
  Button,
  Row,
  Col,
  Form,
  Card,
  Alert,
  Badge,
  Table,
  Modal,
} from "react-bootstrap";
import Select from "react-select";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import { useSession } from "next-auth/react";
import "react-phone-number-input/style.css";
import { Country, State, City } from "country-state-city";
import {
  FiSave,
  FiArrowLeft,
  FiDatabase,
  FiTarget,
  FiPlus,
} from "react-icons/fi";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Edit,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

import {
  createLead,
  getLead,
  updateLead,
  getStages,
  StageData,
  getCampaigns,
  getCampaignById,
  CampaignData,
  getCrmData,
  getCrmDataById,
  CrmDataItem,
  getBusinessTypes,
  BusinessTypeData,
  getDealTemplate,
  DealTemplateData,
  DealTemplateField,
  getIndustries,
  IndustryData,
  getCrmProducts,
  CrmProduct,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug } from "@utils/Helper";

interface CreateLeadModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
  type?: "lead" | "opportunity";
  crmDataId?: number;
  /** When set, opens in edit mode: fetches lead, prefills form, and submits as update */
  editLeadId?: number | null;
}

const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  show,
  onHide,
  onSuccess,
  type = "lead",
  crmDataId,
  editLeadId,
}) => {
  const router = useRouter();
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    user_extension: null as string | null,
    type: type as "lead" | "opportunity",
    description: "",
    source: "",
    company_name: "",
    company_domain: "",
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
    ] as Array<{
      title: string;
      name: string;
      phone_country_code: string;
      phone: string;
      email: string;
    }>,
  });

  const [stages, setStages] = useState<StageData[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [extensionsOpportunities, setExtensionsOpportunities] = useState<any[]>(
    []
  );
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [crmData, setCrmData] = useState<CrmDataItem[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeData[]>([]);
  const [selectedCrmData, setSelectedCrmData] = useState<CrmDataItem | null>(
    null
  );
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [editFetching, setEditFetching] = useState(false);
  const [loadingProspectData, setLoadingProspectData] = useState(false);
  const [isOpportunity, setIsOpportunity] = useState(type === "opportunity");
  const isInitialLoad = useRef(true);
  const createAndAddAnotherRef = useRef(false);

  // Business type state
  const [businessTypeId, setBusinessTypeId] = useState<number | null>(null);
  const [businessTypeOther, setBusinessTypeOther] = useState<string>("");
  const [showOtherBusinessType, setShowOtherBusinessType] = useState(false);

  // Deal template state
  const [dealTemplate, setDealTemplate] = useState<DealTemplateData | null>(
    null
  );
  const [templateFieldsData, setTemplateFieldsData] = useState<Record<string, any>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Industries and estimation state
  const [campaignIndustries, setCampaignIndustries] = useState<IndustryData[]>(
    []
  );
  const [allIndustries, setAllIndustries] = useState<IndustryData[]>([]);
  const [showOtherIndustries, setShowOtherIndustries] = useState(false);
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(
    null
  );
  const [estimationItems, setEstimationItems] = useState<
    Array<{
      product_id: number;
      product_service: string;
      description: string;
      qty: number;
      unit_price: number;
      original_currency: string;
      original_price: number;
      industry_id?: number;
    }>
  >([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    product_id: null as number | null,
    product_service: "",
    description: "",
    qty: 1,
    unit_price: 0,
    industry_id: null as number | null,
  });

  // Location state
  const [selectedCountry, setSelectedCountry] = useState<{
    value: string;
    label: string;
    isoCode: string;
  } | null>(null);
  const [selectedState, setSelectedState] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedCity, setSelectedCity] = useState<{
    value: string;
    label: string;
  } | null>(null);

  // Utility function to parse phone number in format "+92 3200654656" and extract country code
  const parsePhoneNumberFormat = (
    phone: string
  ): { countryCode: string; phoneNumber: string } => {
    if (!phone) return { countryCode: "", phoneNumber: "" };

    // Match pattern: +country_code space rest_of_number
    const match = phone.match(/^(\+\d{1,4})\s+(.+)$/);
    if (match) {
      return {
        countryCode: match[1], // e.g., "+92"
        phoneNumber: match[2], // e.g., "3200654656"
      };
    }

    // If no match, return original phone as phoneNumber
    return { countryCode: "", phoneNumber: phone };
  };

  // Get country flag image URL
  const getCountryFlagUrl = (isoCode: string): string => {
    return `https://flagcdn.com/w20/${isoCode.toLowerCase()}.png`;
  };

  // Get all countries for dropdown
  const getCountries = () => {
    return Country.getAllCountries().map((country: { isoCode: string; name: string }) => ({
      value: country.isoCode,
      label: country.name,
      isoCode: country.isoCode,
    }));
  };

  // Get states/provinces for selected country
  const getStates = (countryCode: string) => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map((state: { isoCode: string; name: string }) => ({
      value: state.isoCode,
      label: state.name,
    }));
  };

  // Get cities for selected country and state
  const getCities = (countryCode: string, stateCode: string) => {
    if (!countryCode || !stateCode) return [];
    return City.getCitiesOfState(countryCode, stateCode).map((city: { name: string }) => ({
      value: city.name,
      label: city.name,
    }));
  };

  // Handle country change
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

  // Handle state/province change
  const handleStateChange = (selectedOption: any) => {
    setSelectedState(selectedOption);
    setSelectedCity(null);
    setFormData((prev) => ({
      ...prev,
      company_province: selectedOption?.label || "",
      company_city: "",
    }));
  };

  // Handle city change
  const handleCityChange = (selectedOption: any) => {
    setSelectedCity(selectedOption);
    setFormData((prev) => ({
      ...prev,
      company_city: selectedOption?.label || "",
    }));
  };

  // Initialize location from form data when country is set (but not from user selection)
  const locationInitialized = useRef(false);
  useEffect(() => {
    if (
      formData.company_country &&
      !selectedCountry &&
      !locationInitialized.current
    ) {
      const country = Country.getAllCountries().find(
        (c: { name: string }) => c.name === formData.company_country
      );
      if (country) {
        setSelectedCountry({
          value: country.isoCode,
          label: country.name,
          isoCode: country.isoCode,
        });
        locationInitialized.current = true;

        if (formData.company_province && !selectedState) {
          const state = State.getStatesOfCountry(country.isoCode).find(
            (s: { name: string }) => s.name === formData.company_province
          );
          if (state) {
            setSelectedState({
              value: state.isoCode,
              label: state.name,
            });

            if (formData.company_city && !selectedCity) {
              const city = City.getCitiesOfState(
                country.isoCode,
                state.isoCode
              ).find((c: { name: string }) => c.name === formData.company_city);
              if (city) {
                setSelectedCity({
                  value: city.name,
                  label: city.name,
                });
              }
            }
          }
        }
      }
    }
  }, [
    formData.company_country,
    formData.company_province,
    formData.company_city,
    selectedCountry,
    selectedState,
    selectedCity,
  ]);

  // Fetch stages and extensions on component mount
  useEffect(() => {
    if (show) {
      fetchExtensions();
      fetchCampaigns();
      fetchCrmData();
      fetchBusinessTypes();
      fetchAllIndustries();
      fetchStages(type);
    }
  }, [show, type]);

  const fetchAllIndustries = async () => {
    try {
      const industriesResponse = await getIndustries({ per_page: 1000 });
      setAllIndustries(industriesResponse?.data || []);
    } catch (error) {
      console.error("Failed to fetch all industries:", error);
    }
  };

  // Fetch specific CRM data record if crmDataId is provided (skip when editing)
  useEffect(() => {
    const fetchCrmDataRecord = async () => {
      if (show && crmDataId && !editLeadId) {
        setLoadingProspectData(true);
        try {
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
          const phoneCountryCode =
            parsedPhone.countryCode ||
            crmDataRecord.data?.phone_country_code ||
            "";
          const phoneNumber = parsedPhone.phoneNumber || phone;

          // Extract source from CRM data
          const source =
            crmDataRecord.data?.source ||
            crmDataRecord.data?.lead_source ||
            crmDataRecord.data?.source_type ||
            "File Upload";

          // Extract user_extension from CRM data
          const userExtension = crmDataRecord.user_extension
            ? String(crmDataRecord.user_extension)
            : null;

          // Pre-fill basic form fields
          setFormData((prev) => ({
            ...prev,
            crm_data_id: crmDataId,
            campaign_id: Number(crmDataRecord.campaign_id) || undefined,
            name: prospectName,
            user_extension: userExtension || prev.user_extension,
            source: source || prev.source,
            description:
              crmDataRecord.data?.description ||
              crmDataRecord.data?.notes ||
              crmDataRecord.data?.comments ||
              "",
            company_name:
              crmDataRecord.data?.company_name ||
              crmDataRecord.data?.company ||
              "",
            company_domain: crmDataRecord.data?.company_domain || "",
            company_contact:
              crmDataRecord.data?.company_contact ||
              crmDataRecord.data?.contact ||
              phone ||
              "",
            company_description:
              crmDataRecord.data?.company_description ||
              crmDataRecord.data?.company_notes ||
              "",
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
            // Pre-fill contact person fields
            contact_person_name: contactPersonName,
            contact_phone: phoneNumber,
            contact_phone_country_code: phoneCountryCode,
            // Add contact person to contact_persons array if we have name, phone, or email
            // Otherwise ensure at least one empty contact person exists
            contact_persons:
              contactPersonName || phone || email
                ? [
                    {
                      title: crmDataRecord.data?.contact_person_title || "",
                      name: contactPersonName,
                      phone_country_code: phoneCountryCode,
                      phone: phoneNumber,
                      email: email,
                    },
                  ]
                : prev.contact_persons.length > 0
                ? prev.contact_persons
                : [
                    {
                      title: "",
                      name: "",
                      phone_country_code: "",
                      phone: "",
                      email: "",
                    },
                  ],
          }));
        } catch (error) {
          console.error("Failed to fetch CRM data record:", error);
        } finally {
          setLoadingProspectData(false);
        }
      } else {
        setLoadingProspectData(false);
      }
    };

    fetchCrmDataRecord();
  }, [show, crmDataId]);

  // Edit mode: fetch lead and prefill form when editLeadId is set
  useEffect(() => {
    if (!show || !editLeadId) return;
    let cancelled = false;
    setEditFetching(true);
    getLead(editLeadId)
      .then(async (leadData: any) => {
        if (cancelled) return;
        let contactPersonsArray: Array<{ title: string; name: string; phone_country_code: string; phone: string; email: string }> = [];
        if (leadData.contact_persons) {
          if (typeof leadData.contact_persons === "string") {
            try {
              contactPersonsArray = JSON.parse(leadData.contact_persons);
            } catch {
              contactPersonsArray = [];
            }
          } else if (Array.isArray(leadData.contact_persons)) {
            contactPersonsArray = leadData.contact_persons;
          }
        }
        if (contactPersonsArray.length === 0) {
          contactPersonsArray = [{ title: "Mr.", name: "", phone_country_code: "", phone: "", email: "" }];
        }
        const stageId = leadData.stage_id != null ? Number(leadData.stage_id) : undefined;
        const campaignId = leadData.campaign_id != null ? Number(leadData.campaign_id) : undefined;
        const crmDataIdNum = leadData.crm_data_id != null ? Number(leadData.crm_data_id) : undefined;
        const userExt = leadData.user_extension != null ? Number(leadData.user_extension) : null;
        setFormData({
          name: leadData.name || "",
          user_extension: userExt as any,
          type: (leadData.type || "lead") as "lead" | "opportunity",
          description: leadData.description || "",
          source: leadData.source || "",
          company_name: leadData.company_name || "",
          company_domain: leadData.company_domain || "",
          company_contact: "",
          company_description: "",
          industry: "",
          business_type: "",
          company_country: leadData.company_country || "",
          company_province: leadData.company_province || "",
          company_city: leadData.company_city || "",
          company_location_other: leadData.company_location_other || "",
          company_size: leadData.company_size || "",
          contact_person_title: "",
          contact_person_name: "",
          contact_phone_country_code: "",
          contact_phone: "",
          stage_id: stageId,
          campaign_id: campaignId,
          crm_data_id: crmDataIdNum,
          lead_potential: leadData.lead_potential || "",
          other_information: leadData.other_information || {},
          campaign_field_values: leadData.campaign_field_values || {},
          contact_persons: contactPersonsArray,
        });
        if (leadData.business_type_id) {
          setBusinessTypeId(Number(leadData.business_type_id));
          setBusinessTypeOther("");
          setShowOtherBusinessType(false);
        } else if (leadData.business_type_other) {
          setBusinessTypeId(null);
          setBusinessTypeOther(leadData.business_type_other);
          setShowOtherBusinessType(true);
        } else {
          setBusinessTypeId(null);
          setBusinessTypeOther("");
          setShowOtherBusinessType(false);
        }
        const countryName = leadData.company_country;
        if (countryName) {
          const country = Country.getAllCountries().find((c: { name: string }) => c.name === countryName);
          if (country) {
            setSelectedCountry({ value: country.isoCode, label: country.name, isoCode: country.isoCode });
            const stateName = leadData.company_province;
            if (stateName) {
              const state = State.getStatesOfCountry(country.isoCode).find((s: { name: string }) => s.name === stateName);
              if (state) {
                setSelectedState({ value: state.isoCode, label: state.name });
                const cityName = leadData.company_city;
                if (cityName) {
                  const city = City.getCitiesOfState(country.isoCode, state.isoCode).find((c: { name: string }) => c.name === cityName);
                  if (city) {
                    setSelectedCity({ value: city.name, label: city.name });
                  }
                }
              }
            }
          }
        } else {
          setSelectedCountry(null);
          setSelectedState(null);
          setSelectedCity(null);
        }
        if (campaignId) {
          try {
            const campaign = await getCampaignById(campaignId);
            setSelectedCampaign(campaign);
          } catch {
            setSelectedCampaign(null);
          }
        } else {
          setSelectedCampaign(null);
        }
        if (crmDataIdNum && crmData.length > 0) {
          const found = crmData.find((d) => d.id === crmDataIdNum);
          if (found) setSelectedCrmData(found);
          else {
            try {
              const record = await getCrmDataById(crmDataIdNum);
              setSelectedCrmData(record);
            } catch {
              setSelectedCrmData(null);
            }
          }
        } else {
          setSelectedCrmData(null);
        }
        setEditFetching(false);
      })
      .catch(() => {
        if (!cancelled) {
          setEditFetching(false);
          toast.error("Failed to load lead data");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [show, editLeadId]); // crmData dependency omitted to avoid re-run when crmData loads after lead; lead fetch runs once when sidebar opens

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
            campaign.fields.forEach((field: { field_name: string; field_type?: string; field_options?: Array<string | { value?: string; label?: string }> }) => {
              // Try to find matching CRM data field by exact name, lowercase, or uppercase
              const crmDataValue =
                selectedCrmData.data[field.field_name] ||
                selectedCrmData.data[field.field_name.toLowerCase()] ||
                selectedCrmData.data[field.field_name.toUpperCase()] ||
                // Also try with underscores replaced by spaces and vice versa
                selectedCrmData.data[field.field_name.replace(/_/g, " ")] ||
                selectedCrmData.data[field.field_name.replace(/ /g, "_")] ||
                selectedCrmData.data[
                  field.field_name.replace(/_/g, " ").toLowerCase()
                ] ||
                selectedCrmData.data[
                  field.field_name.replace(/ /g, "_").toLowerCase()
                ];

              if (
                crmDataValue !== null &&
                crmDataValue !== undefined &&
                crmDataValue !== ""
              ) {
                // For dropdown fields, check if the value matches one of the options
                if (field.field_type === "dropdown" && field.field_options) {
                  const optionValues =
                    field.field_options?.map((opt: any) =>
                      typeof opt === "string" ? opt : opt.value || opt.label
                    ) || [];
                  const optionLabels =
                    field.field_options?.map((opt: any) =>
                      typeof opt === "string" ? opt : opt.label || opt.value
                    ) || [];

                  // Check if CRM data value matches any option value or label
                  const stringValue = String(crmDataValue);
                  const matchesOption =
                    optionValues.some(
                      (opt: string) =>
                        opt.toLowerCase() === stringValue.toLowerCase()
                    ) ||
                    optionLabels.some(
                      (opt: string) =>
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

  const opportunityRef = useRef<"lead" | "opportunity">(
    isOpportunity ? "opportunity" : "lead"
  );

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

  const { data: session } = useSession();
  const fetchExtensions = async () => {
    try {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_LEADS);
      if (hierarchyData?.extensions) {
        setExtensions(hierarchyData.extensions);
      }
      if (!crmDataId) {
        setFormData((prev) => ({
          ...prev,
          user_extension: (session?.user as any)?.extension,
        }));
      }

      const hierarchyDataOpportunities = await GetHierarchyData(
        ModuleSlug.CRM_OPPORTUNITIES
      );
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

  const fetchBusinessTypes = async () => {
    try {
      const businessTypesResponse = await getBusinessTypes({ per_page: 1000 });
      setBusinessTypes(businessTypesResponse?.data || []);
    } catch (error) {
      console.error("Failed to fetch business types:", error);
    }
  };

  const loadProductsForIndustry = async (industryId: number) => {
    setLoadingProducts(true);
    try {
      const productsResponse = await getCrmProducts({
        per_page: 1000,
        industry_id: industryId,
      });
      setProducts(productsResponse?.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
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
      // Prevent deleting the last contact person
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use same validation as Edit Lead modal (step-by-step checks)
    if (!validateStep0() || !validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    setLoading(true);

    try {
      // Format payload according to API structure (user_extension must be string for API)
      const payload: any = {
        name: formData.name,
        user_extension: formData.user_extension != null ? String(formData.user_extension) : "",
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
        ...(formData.company_domain && { company_domain: formData.company_domain }),
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
        ...(formData.contact_person_title && {
          contact_person_title: formData.contact_person_title,
        }),
        ...(formData.contact_person_name && {
          contact_person_name: formData.contact_person_name,
        }),
        ...(formData.contact_phone_country_code && {
          contact_phone_country_code: formData.contact_phone_country_code,
        }),
        ...(formData.contact_phone && {
          contact_phone: formData.contact_phone,
        }),
        ...(formData.lead_potential && {
          lead_potential: formData.lead_potential,
        }),
        ...(formData.other_information &&
          Object.keys(formData.other_information).length > 0 && {
            other_information: formData.other_information,
          }),
        ...(formData.campaign_field_values &&
          Object.keys(formData.campaign_field_values).length > 0 && {
            campaign_field_values: formData.campaign_field_values,
          }),
        ...(templateFieldsData &&
          Object.keys(templateFieldsData).length > 0 && {
            template_fields_data: templateFieldsData,
          }),
        ...(estimationItems.length > 0 && {
          estimation_items: estimationItems,
        }),
        ...(formData.contact_persons.length > 0 && {
          contact_persons: formData.contact_persons,
        }),
      };

      if (editLeadId) {
        await updateLead(editLeadId, payload);
        toast.success("Lead updated successfully!");
        if (onSuccess) onSuccess();
        onHide();
      } else {
        await createLead(payload);
        toast.success("Lead created successfully!");
        if (onSuccess) onSuccess();
        if (createAndAddAnotherRef.current) {
        createAndAddAnotherRef.current = false;
        // Reset form for another lead (keep type and fetched data)
        setFormData({
          name: "",
          user_extension: null,
          type: formData.type,
          description: "",
          source: "",
          company_name: "",
          company_domain: "",
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
            { title: "Mr.", name: "", phone_country_code: "", phone: "", email: "" },
          ],
        });
        setFormStep(0);
        setTemplateFieldsData({});
        setEstimationItems([]);
        setBusinessTypeId(null);
        setBusinessTypeOther("");
        setShowOtherBusinessType(false);
        setSelectedIndustryId(null);
        setItemFormData({
          product_id: null,
          product_service: "",
          description: "",
          qty: 1,
          unit_price: 0,
          industry_id: null,
        });
        } else {
          onHide();
        }
      }
    } catch (error) {
      toast.error(editLeadId ? "Failed to update lead" : "Failed to create lead");
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

  // Validation functions for each step (aligned with Edit Lead modal)
  const validateStep0 = (): boolean => {
    if (!formData.name?.trim()) {
      toast.error("Lead name is required");
      return false;
    }
    if (formData.user_extension == null || formData.user_extension === "") {
      toast.error("Owner is required");
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

  const handleCampaignChange = async (selectedOption: any) => {
    const campaignId = selectedOption?.value;

    if (!campaignId) {
      setSelectedCampaign(null);
      setDealTemplate(null);
      setTemplateFieldsData({});
      setCampaignIndustries([]);
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
        campaign.fields.forEach((field: { field_name: string; field_type?: string }) => {
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

      // Load deal template if available
      const campaignWithTemplate = campaign as any;
      if (campaignWithTemplate.deal_template_id) {
        setLoadingTemplate(true);
        try {
          const template = await getDealTemplate(
            Number(campaignWithTemplate.deal_template_id)
          );
          setDealTemplate(template);
          setTemplateFieldsData({});
        } catch (error) {
          console.error("Failed to fetch deal template:", error);
          setDealTemplate(null);
        } finally {
          setLoadingTemplate(false);
        }
      } else {
        setDealTemplate(null);
        setTemplateFieldsData({});
      }

      // Load campaign industries
      if (
        campaignWithTemplate.industries &&
        campaignWithTemplate.industries.length > 0
      ) {
        setCampaignIndustries(campaignWithTemplate.industries);
      } else {
        setCampaignIndustries([]);
      }
    } catch (error) {
      console.error("Failed to fetch campaign details:", error);
      // Fallback to basic campaign from list
      const basicCampaign = campaigns.find((c) => c.id === campaignId);
      setSelectedCampaign(basicCampaign || null);
      setDealTemplate(null);
      setCampaignIndustries([]);
    }
  };

  const handleCrmDataChange = async (selectedOption: any) => {
    const crmDataId = selectedOption?.value;

    if (!crmDataId) {
      setSelectedCrmData(null);
      setFormData((prev) => ({
        ...prev,
        crm_data_id: undefined,
      }));
      return;
    }

    try {
      const crmDataRecord = await getCrmDataById(crmDataId);
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
      const phoneCountryCode =
        parsedPhone.countryCode || crmDataRecord.data?.phone_country_code || "";
      const phoneNumber = parsedPhone.phoneNumber || phone;

      // Extract source from CRM data
      const source =
        crmDataRecord.data?.source ||
        crmDataRecord.data?.lead_source ||
        crmDataRecord.data?.source_type ||
        "";

      // Extract user_extension from CRM data
      const userExtension = crmDataRecord.user_extension
        ? String(crmDataRecord.user_extension)
        : (session?.user as any)?.extension
        ? (session?.user as any)?.extension
        : null;

      // Pre-fill form fields
      setFormData((prev) => ({
        ...prev,
        crm_data_id: crmDataId,
        campaign_id: Number(crmDataRecord.campaign_id) || prev.campaign_id,
        name: prospectName || prev.name,
        user_extension: userExtension || prev.user_extension,
        source: source || prev.source,
        description:
          crmDataRecord.data?.description ||
          crmDataRecord.data?.notes ||
          crmDataRecord.data?.comments ||
          prev.description,
        company_name:
          crmDataRecord.data?.company_name ||
          crmDataRecord.data?.company ||
          prev.company_name,
        company_domain:
          crmDataRecord.data?.company_domain ?? prev.company_domain,
        company_contact:
          crmDataRecord.data?.company_contact ||
          crmDataRecord.data?.contact ||
          phone ||
          prev.company_contact,
        company_description:
          crmDataRecord.data?.company_description ||
          crmDataRecord.data?.company_notes ||
          prev.company_description,
        company_country:
          crmDataRecord.data?.company_country ||
          crmDataRecord.data?.country ||
          prev.company_country,
        company_province:
          crmDataRecord.data?.company_province ||
          crmDataRecord.data?.province ||
          crmDataRecord.data?.state ||
          prev.company_province,
        company_city:
          crmDataRecord.data?.company_city ||
          crmDataRecord.data?.city ||
          prev.company_city,
        // Pre-fill contact person fields
        contact_person_name: contactPersonName || prev.contact_person_name,
        contact_phone: phoneNumber || prev.contact_phone,
        contact_phone_country_code:
          phoneCountryCode || prev.contact_phone_country_code,
        // Add contact person to contact_persons array if we have name, phone, or email
        // Otherwise ensure at least one empty contact person exists
        contact_persons:
          contactPersonName || phone || email
            ? [
                {
                  title: crmDataRecord.data?.contact_person_title || "",
                  name: contactPersonName,
                  phone_country_code: phoneCountryCode,
                  phone: phoneNumber,
                  email: email,
                },
              ]
            : prev.contact_persons.length > 0
            ? prev.contact_persons
            : [
                {
                  title: "",
                  name: "",
                  phone_country_code: "",
                  phone: "",
                  email: "",
                },
              ],
      }));

      // Auto-select campaign if available
      if (crmDataRecord.campaign_id) {
        await handleCampaignChange({
          value: crmDataRecord.campaign_id,
        });
      }
    } catch (error) {
      console.error("Failed to fetch CRM data record:", error);
      toast.error("Failed to load CRM data");
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

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      setFormStep(0);
      setFormData({
        name: "",
        user_extension: null,
        type: type,
        description: "",
        source: "",
        company_name: "",
        company_domain: "",
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
      setSelectedCrmData(null);
      setSelectedCampaign(null);
      setSelectedCountry(null);
      setSelectedState(null);
      setSelectedCity(null);
      setBusinessTypeId(null);
      setBusinessTypeOther("");
      setShowOtherBusinessType(false);
      locationInitialized.current = false;
    }
  }, [show, type]);

  if (!show) return null;

  // Sidebar UI (same pattern as prospects Create Contact sidebar)
  return (
    <>
      {/* Overlay */}
      <div
        className="create-lead-sidebar-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}
        onClick={onHide}
      />

      {/* Sidebar */}
      <div
        className="create-lead-sidebar-container"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "600px",
          height: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="create-lead-sidebar-header"
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            className="create-lead-sidebar-title"
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {editLeadId ? "Edit Lead" : crmDataId ? "Convert to Lead" : "Create Lead"}
            {!editLeadId && selectedCrmData && (
              <Badge
                bg="info"
                style={{ fontSize: "12px", cursor: "pointer" }}
                title={selectedCrmData?.name || `#${selectedCrmData?.id}`}
              >
                <FiDatabase className="me-1" size={14} />
                Pre-filled from Prospect
              </Badge>
            )}
          </h2>
          <button
            type="button"
            className="create-lead-sidebar-close-btn"
            onClick={onHide}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "#718096",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content - same structure as Create Contact sidebar (index.tsx 2969-3400) */}
        <div
          className="create-lead-sidebar-content contact-sidebar-content"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "40px",
          }}
        >
          {editFetching || loadingProspectData ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ flex: 1 }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 mb-0" style={{ fontSize: "14px", color: "#64748b" }}>
                {loadingProspectData ? "Loading prospect data..." : "Loading lead data..."}
              </p>
            </div>
          ) : (
          <Form onSubmit={handleSubmit}>
            {/* Reusable contact-style label/input styles */}
            {(() => {
              const labelStyle: React.CSSProperties = {
                display: "block",
                fontSize: "14px",
                fontWeight: 600,
                color: "#141414",
                marginBottom: "8px",
              };
              const inputStyle: React.CSSProperties = {
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #8a8a8a",
                borderRadius: "4px",
                fontSize: "14px",
                outline: "none",
              };
              const selectControlStyle = {
                control: (base: any) => ({
                  ...base,
                  minHeight: 40,
                  border: "1px solid #8a8a8a",
                  borderRadius: "4px",
                  fontSize: "14px",
                }),
              };

              return (
            <div>
              {/* Primary Fields Section - Lead Information */}
              <div className="contact-form-section">
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label contact-form-label-required" style={labelStyle}>
                    Lead Name <span style={{ color: "#f2545b" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter lead name"
                    required
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
                  />
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label contact-form-label-required" style={labelStyle}>
                    Owner <span style={{ color: "#f2545b" }}>*</span>
                  </label>
                  {formData.type === "opportunity" ? (
                    <Select
                      value={
                        formData.user_extension
                          ? {
                              value: formData.user_extension,
                              label:
                                extensionsOpportunities.find(
                                  (ext: any) =>
                                    ext.id.toString() === formData.user_extension?.toString()
                                )?.display_name || "",
                            }
                          : null
                      }
                      onChange={(selectedOption: any) =>
                        handleInputChange("user_extension", selectedOption?.value || null)
                      }
                      options={extensionsOpportunities.map((extension: any) => ({
                        value: extension.id,
                        label: extension.display_name,
                      }))}
                      placeholder="Select User"
                      isClearable
                      isSearchable
                      styles={selectControlStyle}
                    />
                  ) : (
                    <Select
                      value={
                        formData.user_extension
                          ? {
                              value: formData.user_extension,
                              label:
                                extensions.find(
                                  (ext: any) =>
                                    ext.id.toString() === formData.user_extension?.toString()
                                )?.display_name || "",
                            }
                          : null
                      }
                      onChange={(selectedOption: any) =>
                        handleInputChange("user_extension", selectedOption?.value || null)
                      }
                      options={extensions.map((extension: any) => ({
                        value: extension.id,
                        label: extension.display_name,
                      }))}
                      placeholder="Select User"
                      isClearable
                      isSearchable
                      styles={selectControlStyle}
                    />
                  )}
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label contact-form-label-required" style={labelStyle}>
                    Stage <span style={{ color: "#f2545b" }}>*</span>
                  </label>
                  <Select
                    value={
                      formData.stage_id != null
                        ? {
                            value: formData.stage_id,
                            label: stages.find((s) => s.id === formData.stage_id)?.name || "",
                          }
                        : null
                    }
                    onChange={(selectedOption: any) =>
                      handleInputChange("stage_id", selectedOption?.value ?? undefined)
                    }
                    options={stages.map((stage) => ({
                      value: stage.id,
                      label: stage.name,
                    }))}
                    placeholder="Select a stage"
                    isClearable
                    isSearchable
                    styles={selectControlStyle}
                  />
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label" style={labelStyle}>Source</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => handleInputChange("source", e.target.value)}
                    placeholder="e.g., LinkedIn, Website, Referral"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
                  />
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label" style={labelStyle}>Campaign</label>
                  <Select
                    value={
                      formData.campaign_id
                        ? {
                            value: formData.campaign_id,
                            label:
                              campaigns.find((c) => c.id === formData.campaign_id)?.name || "",
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
                    styles={selectControlStyle}
                  />
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label" style={labelStyle}>Prospect</label>
                  <Select
                    isDisabled={!!crmDataId}
                    value={
                      formData.crm_data_id
                        ? {
                            value: formData.crm_data_id,
                            label:
                              formData.crm_data_id === selectedCrmData?.id
                                ? `${selectedCrmData?.name || "No Name"}`
                                : `${crmData.find((d) => d.id === formData.crm_data_id)?.name || "No Name"}`,
                          }
                        : null
                    }
                    onChange={handleCrmDataChange}
                    options={crmData.map((data) => ({
                      value: data.id,
                      label: `${data?.name || "No Name"} - ${data?.phone || "No Phone"}`,
                    }))}
                    placeholder="Select Prospect (Optional)"
                    isClearable
                    isSearchable
                    styles={selectControlStyle}
                  />
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label" style={labelStyle}>Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Preferred area/location, Budget, move-in"
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
                  />
                </div>
              </div>

              {/* Secondary Fields Section - Company Information */}
              <div className="contact-form-section" style={{ marginTop: "24px" }}>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label contact-form-label-required" style={labelStyle}>
                    Company Name <span style={{ color: "#f2545b" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                    placeholder="Enter person name/company name"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
                  />
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label" style={labelStyle}>
                    Company domain
                  </label>
                  <input
                    type="text"
                    value={formData.company_domain}
                    onChange={(e) => handleInputChange("company_domain", e.target.value)}
                    placeholder="e.g. example.com"
                    data-no-capitalize
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
                  />
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label contact-form-label-required" style={labelStyle}>
                    Business Type <span style={{ color: "#f2545b" }}>*</span>
                  </label>
                  <Select
                    value={
                      showOtherBusinessType
                        ? { value: "other", label: "Other" }
                        : businessTypeId != null
                        ? {
                            value: businessTypeId,
                            label: businessTypes.find((b) => b.id === businessTypeId)?.name || "",
                          }
                        : null
                    }
                    onChange={(selectedOption: any) => {
                      if (!selectedOption) {
                        setShowOtherBusinessType(false);
                        setBusinessTypeId(null);
                        setBusinessTypeOther("");
                      } else if (selectedOption.value === "other") {
                        setShowOtherBusinessType(true);
                        setBusinessTypeId(null);
                        setBusinessTypeOther("");
                      } else {
                        setShowOtherBusinessType(false);
                        setBusinessTypeId(Number(selectedOption.value));
                        setBusinessTypeOther("");
                      }
                    }}
                    options={[
                      ...businessTypes.map((bt) => ({ value: bt.id, label: bt.name })),
                      { value: "other", label: "Other" },
                    ]}
                    placeholder="Select Business Type"
                    isClearable
                    isSearchable
                    styles={selectControlStyle}
                  />
                </div>
                {showOtherBusinessType && (
                  <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                    <label className="contact-form-label contact-form-label-required" style={labelStyle}>
                      Business Type (Other) <span style={{ color: "#f2545b" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={businessTypeOther}
                      onChange={(e) => setBusinessTypeOther(e.target.value)}
                      placeholder="Enter business type"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
                    />
                  </div>
                )}
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label" style={labelStyle}>Company Country</label>
                  <Select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    options={getCountries()}
                    placeholder="Select Country"
                    isClearable
                    isSearchable
                    styles={selectControlStyle}
                    formatOptionLabel={({ label, isoCode }: any) => (
                      <div className="d-flex align-items-center">
                        {isoCode && (
                          <img
                            src={getCountryFlagUrl(isoCode)}
                            alt={isoCode}
                            className="me-2"
                            style={{ width: "20px", height: "15px" }}
                          />
                        )}
                        <span>{label}</span>
                      </div>
                    )}
                  />
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label" style={labelStyle}>State/Province</label>
                  <Select
                    value={selectedState}
                    onChange={handleStateChange}
                    options={getStates(selectedCountry?.value || "")}
                    placeholder="Select State/Province"
                    isClearable
                    isSearchable
                    isDisabled={!selectedCountry}
                    styles={selectControlStyle}
                  />
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label" style={labelStyle}>Company City</label>
                  <Select
                    value={selectedCity}
                    onChange={handleCityChange}
                    options={getCities(selectedCountry?.value || "", selectedState?.value || "")}
                    placeholder="Select City"
                    isClearable
                    isSearchable
                    isDisabled={!selectedCountry || !selectedState}
                    styles={selectControlStyle}
                  />
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label" style={labelStyle}>Company Size</label>
                  <Select
                    value={
                      formData.company_size
                        ? { value: formData.company_size, label: formData.company_size }
                        : null
                    }
                    onChange={(selectedOption: any) =>
                      handleInputChange("company_size", selectedOption?.value ?? "")
                    }
                    options={[
                      { value: "Micro (1-10 employees)", label: "Micro (1-10 employees)" },
                      { value: "Small (11-50 employees)", label: "Small (11-50 employees)" },
                      { value: "Medium (51-200 employees)", label: "Medium (51-200 employees)" },
                      { value: "Large (201-500 employees)", label: "Large (201-500 employees)" },
                      { value: "Enterprise (500+ employees)", label: "Enterprise (500+ employees)" },
                    ]}
                    placeholder="Select Size"
                    isClearable
                    isSearchable
                    styles={selectControlStyle}
                  />
                </div>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label" style={labelStyle}>Location Notes</label>
                  <input
                    type="text"
                    value={formData.company_location_other}
                    onChange={(e) =>
                      handleInputChange("company_location_other", e.target.value)
                    }
                    placeholder="Landmark, Access Instructions, Directions, etc."
                    style={inputStyle}  
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
                  />
                </div>
              </div>

              {/* Contact Persons Section */}
              <div className="contact-form-section" style={{ marginTop: "24px", paddingTop: "24px" }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#141414" }}>Contact Persons</span>
                  <button
                    type="button"
                    onClick={addContactPerson}
                    style={{
                      padding: "6px 12px",
                      fontSize: "13px",
                      border: "1px solid #8a8a8a",
                      borderRadius: "4px",
                      background: "transparent",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FiPlus size={14} /> Add Contact Person
                  </button>
                </div>
                {formData.contact_persons.map((person, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "20px",
                      padding: "16px",
                      border: "1px solid #eaf0f6",
                      borderRadius: "4px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#141414" }}>
                        Contact Person {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeContactPerson(index)}
                        disabled={formData.contact_persons.length <= 1}
                        style={{
                          padding: "4px",
                          border: "none",
                          background: "transparent",
                          color: "#f2545b",
                          cursor: formData.contact_persons.length <= 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="contact-form-field" style={{ marginBottom: "16px" }}>
                      <label className="contact-form-label contact-form-label-required" style={labelStyle}>
                        Title <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <Select
                        value={
                          person.title
                            ? { value: person.title, label: person.title }
                            : null
                        }
                        onChange={(selectedOption: any) =>
                          updateContactPerson(index, "title", selectedOption?.value ?? "")
                        }
                        options={[
                          { value: "Mr.", label: "Mr." },
                          { value: "Mrs.", label: "Mrs." },
                          { value: "Ms.", label: "Ms." },
                          { value: "Dr.", label: "Dr." },
                          { value: "Prof.", label: "Prof." },
                        ]}
                        placeholder="Select Title"
                        isClearable
                        isSearchable
                        styles={selectControlStyle}
                      />
                    </div>
                    <div className="contact-form-field" style={{ marginBottom: "16px" }}>
                      <label className="contact-form-label contact-form-label-required" style={labelStyle}>
                        Name <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => updateContactPerson(index, "name", e.target.value)}
                        placeholder="Enter contact name"
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
                      />
                    </div>
                    <div className="contact-form-field" style={{ marginBottom: "16px" }}>
                      <label className="contact-form-label contact-form-label-required" style={labelStyle}>
                        Phone <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <div className="phone-input-wrapper" style={{ width: "100%" }}>
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={
                            person.phone_country_code && person.phone
                              ? `${person.phone_country_code}${person.phone}`
                              : person.phone || undefined
                          }
                          onChange={(value: string | undefined) => {
                            if (value) {
                              try {
                                const phoneNumber = parsePhoneNumber(value);
                                if (phoneNumber) {
                                  updateContactPerson(index, "phone_country_code", `+${phoneNumber.countryCallingCode}`);
                                  updateContactPerson(index, "phone", phoneNumber.nationalNumber);
                                } else {
                                  updateContactPerson(index, "phone_country_code", "");
                                  updateContactPerson(index, "phone", value);
                                }
                              } catch {
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
                    </div>
                    <div className="contact-form-field" style={{ marginBottom: "0" }}>
                      <label className="contact-form-label contact-form-label-required" style={labelStyle}>
                        Email <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={person.email}
                        onChange={(e) => updateContactPerson(index, "email", e.target.value)}
                        placeholder="Enter email address"
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#0091ae")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#8a8a8a")}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Other Information Section */}
              <div className="contact-form-section" style={{ marginTop: "24px", paddingTop: "24px" }}>
                <div className="contact-form-field" style={{ marginBottom: "20px" }}>
                  <label className="contact-form-label" style={labelStyle}>Lead Potential</label>
                  <Select
                    value={
                      formData.lead_potential
                        ? { value: formData.lead_potential, label: formData.lead_potential }
                        : null
                    }
                    onChange={(selectedOption: any) =>
                      handleInputChange("lead_potential", selectedOption?.value ?? "")
                    }
                    options={[
                      { value: "Hot", label: "Hot" },
                      { value: "Warm", label: "Warm" },
                      { value: "Cold", label: "Cold" },
                    ]}
                    placeholder="Select Potential"
                    isClearable
                    isSearchable
                    styles={selectControlStyle}
                  />
                  <p style={{ fontSize: "13px", color: "#6c757d", marginTop: "6px", marginBottom: 0 }}>
                    Likelihood of converting based on engagement
                  </p>
                </div>

                {selectedCampaign?.fields && selectedCampaign.fields.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <div className="d-flex align-items-center mb-3">
                      <FiTarget className="me-2" size={16} />
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#141414" }}>
                        Custom Campaign Fields: {selectedCampaign.name}
                      </span>
                      {selectedCrmData && (
                        <Badge bg="success" className="ms-2" style={{ fontSize: "11px" }}>
                          Auto-filled from Prospect
                        </Badge>
                      )}
                    </div>
                    {selectedCampaign.fields.map((field: { field_name: string; is_required?: boolean }, idx: number) => (
                      <div key={idx} className="contact-form-field" style={{ marginBottom: "20px" }}>
                        <label className="contact-form-label" style={labelStyle}>
                          {field.field_name}
                          {field.is_required && <span style={{ color: "#f2545b" }}> *</span>}
                        </label>
                        {renderCampaignField(field)}
                      </div>
                    ))}
                  </div>
                )}

                <p style={{ fontSize: "13px", color: "#6c757d", marginTop: "16px", marginBottom: 0 }}>
                  <CheckCircle size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                  All required fields are marked with <span style={{ color: "#f2545b" }}>*</span>.
                </p>
              </div>
            </div>
              );
            })()}
          </Form>
          )}
        </div>

        {/* Footer Buttons: Edit mode = Update + Cancel; Create mode = Create + Create and add another + Cancel */}
        <div
          className="create-lead-sidebar-footer"
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #eaf0f6",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            disabled={loading || editFetching || loadingProspectData}
            onClick={(e) => handleSubmit(e)}
            style={{
              padding: "10px 20px",
              backgroundColor: loading || editFetching || loadingProspectData ? "#cbd5e0" : "#0091ae",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading || editFetching || loadingProspectData ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading && !editFetching && !loadingProspectData) e.currentTarget.style.backgroundColor = "#007a94";
            }}
            onMouseLeave={(e) => {
              if (!loading && !editFetching && !loadingProspectData) e.currentTarget.style.backgroundColor = "#0091ae";
            }}
          >
            <CheckCircle size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} />
            {loading ? (editLeadId ? "Updating..." : "Creating...") : (editLeadId ? "Update" : crmDataId ? "Convert" : "Create")}
          </button>
          {!editLeadId && !crmDataId && (
          <button
            type="button"
            disabled={loading || editFetching || loadingProspectData}
            onClick={(e) => {
              createAndAddAnotherRef.current = true;
              handleSubmit(e);
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: loading || editFetching || loadingProspectData ? "#a0aec0" : "#141414",
              border: "1px solid #8a8a8a",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading || editFetching || loadingProspectData ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading && !editFetching && !loadingProspectData) e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              if (!loading && !editFetching && !loadingProspectData) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Create and add another
          </button>
          )}
          <button
            type="button"
            onClick={onHide}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: "#141414",
              border: "1px solid #8a8a8a",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f7fafc"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Add/Edit Item Modal for Deal Template */}
      {dealTemplate && (
        <Modal
          show={showAddItemModal}
          onHide={() => {
            setShowAddItemModal(false);
            setEditingItemIndex(null);
            setItemFormData({
              product_id: null,
              product_service: "",
              description: "",
              qty: 1,
              unit_price: 0,
              industry_id: null,
            });
            setSelectedIndustryId(null);
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {editingItemIndex !== null ? "Edit Item" : "Add New Item"}
            </Modal.Title>
          </Modal.Header>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const selectedProduct = products.find(
                (p) => p.id === itemFormData.product_id
              );
              const newItem = {
                product_id: itemFormData.product_id!,
                product_service: itemFormData.product_service,
                description: itemFormData.description,
                qty: itemFormData.qty,
                unit_price: itemFormData.unit_price,
                original_currency: selectedProduct?.currency || "AED",
                original_price:
                  parseFloat(selectedProduct?.price || "0") ||
                  itemFormData.unit_price,
                industry_id: itemFormData.industry_id || undefined,
              };

              if (editingItemIndex !== null) {
                const updated = [...estimationItems];
                updated[editingItemIndex] = newItem;
                setEstimationItems(updated);
              } else {
                setEstimationItems([...estimationItems, newItem]);
              }

              setShowAddItemModal(false);
              setEditingItemIndex(null);
              setItemFormData({
                product_id: null,
                product_service: "",
                description: "",
                qty: 1,
                unit_price: 0,
                industry_id: null,
              });
              setSelectedIndustryId(null);
            }}
            noValidate
          >
            <Modal.Body>
              <Row className="g-3">
                {/* Industry Selection */}
                {(() => {
                  // Determine available industries based on campaign and switch
                  const availableIndustries =
                    showOtherIndustries || campaignIndustries.length === 0
                      ? allIndustries
                      : campaignIndustries;

                  return availableIndustries.length > 0 ? (
                    <>
                      <Col md={12}>
                        <Form.Group>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Label>
                              Product Group <span className="text-danger">*</span>
                            </Form.Label>
                            {campaignIndustries.length > 0 && (
                              <Form.Check
                                type="switch"
                                id="load-other-industries"
                                label="Load All Product Groups"
                                checked={showOtherIndustries}
                                onChange={(e) =>
                                  setShowOtherIndustries(e.target.checked)
                                }
                              />
                            )}
                          </div>
                          <Select
                            value={
                              itemFormData.industry_id
                                ? {
                                    value: itemFormData.industry_id,
                                    label:
                                      availableIndustries.find(
                                        (ind) => ind.id === itemFormData.industry_id
                                      )?.name || "",
                                  }
                                : null
                            }
                            onChange={(selectedOption: any) => {
                              const industryId = selectedOption?.value || null;
                              setItemFormData({
                                ...itemFormData,
                                industry_id: industryId,
                              });
                              // Load products for selected industry
                              if (industryId) {
                                loadProductsForIndustry(industryId);
                              }
                            }}
                            options={availableIndustries.map((industry) => ({
                              value: industry.id,
                              label: industry.name,
                            }))}
                            placeholder="Select product group..."
                            isSearchable
                            required
                          />
                        </Form.Group>
                      </Col>
                    </>
                  ) : null;
                })()}

                {/* Product Selection */}
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>
                      Product <span className="text-danger">*</span>
                    </Form.Label>
                    <Select
                      value={
                        itemFormData.product_id
                          ? {
                              value: itemFormData.product_id,
                              label:
                                itemFormData.product_service ||
                                products.find(
                                  (p) => p.id === itemFormData.product_id
                                )?.name ||
                                "",
                            }
                          : null
                      }
                      onChange={(selectedOption: any) => {
                        const product = products.find(
                          (p) => p.id === selectedOption?.value
                        );
                        if (product) {
                          setItemFormData({
                            ...itemFormData,
                            product_id: product.id,
                            product_service: product.name,
                            unit_price: parseFloat(product.price || "0"),
                          });
                        }
                      }}
                      options={products.map((product) => ({
                        value: product.id,
                        label: `${product.name} - ${product.currency} ${product.price}`,
                      }))}
                      placeholder="Select product..."
                      isSearchable
                      isDisabled={!itemFormData.industry_id || loadingProducts}
                      required
                    />
                    {loadingProducts && (
                      <Form.Text className="text-muted">
                        Loading products...
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>

                {/* Description */}
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={itemFormData.description}
                      onChange={(e) =>
                        setItemFormData({
                          ...itemFormData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter description (optional)"
                    />
                  </Form.Group>
                </Col>

                {/* Quantity */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      Quantity <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={itemFormData.qty}
                      onChange={(e) =>
                        setItemFormData({
                          ...itemFormData,
                          qty: Number(e.target.value) || 1,
                        })
                      }
                      required
                    />
                  </Form.Group>
                </Col>

                {/* Unit Price */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      Unit Price <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={itemFormData.unit_price}
                      onChange={(e) =>
                        setItemFormData({
                          ...itemFormData,
                          unit_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddItemModal(false);
                  setEditingItemIndex(null);
                  setItemFormData({
                    product_id: null,
                    product_service: "",
                    description: "",
                    qty: 1,
                    unit_price: 0,
                    industry_id: null,
                  });
                  setSelectedIndustryId(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingItemIndex !== null ? "Update" : "Add"} Item
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default CreateLeadModal;