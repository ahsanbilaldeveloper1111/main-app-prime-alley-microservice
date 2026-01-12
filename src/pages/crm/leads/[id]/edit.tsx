import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useRef } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  updateLead,
  getLead,
  getStages,
  StageData,
  getCampaigns,
  getCampaignById,
  CampaignData,
  getCrmData,
  getCrmDataById,
  CrmDataItem,
  getIndustries,
  IndustryData,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { Button, Row, Col, Form, Card, Badge } from "react-bootstrap";
import Select from "react-select";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Country, State, City } from "country-state-city";
import {
  FiArrowLeft,
  FiDatabase,
  FiTarget,
  FiPlus,
} from "react-icons/fi";
import { CheckCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { ModuleSlug, ValidationType, checkRequiredFields } from '@utils/Helper';

const EditLead = () => {
  const router = useRouter();
  const { id } = router.query;
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    user_extension: null as number | null,
    type: "lead" as "lead" | "opportunity",
    description: "",
    source: "",
    company_name: "",
    company_contact: "",
    company_description: "",
    industry_ids: [] as number[],
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
    contact_persons: [{
      title: "",
      name: "",
      phone_country_code: "",
      phone: "",
      email: "",
    }] as Array<{
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
  const [selectedCrmData, setSelectedCrmData] = useState<CrmDataItem | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isOpportunity, setIsOpportunity] = useState(false);
  const isInitialLoad = useRef(true);
  const [allIndustries, setAllIndustries] = useState<IndustryData[]>([]);
  const [campaignIndustries, setCampaignIndustries] = useState<IndustryData[]>([]);
  const [loadingAllIndustries, setLoadingAllIndustries] = useState(false);
  const [loadingIndustries, setLoadingIndustries] = useState(false);

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

  // Get country flag image URL
  const getCountryFlagUrl = (isoCode: string): string => {
    return `https://flagcdn.com/w20/${isoCode.toLowerCase()}.png`;
  };

  // Get all countries for dropdown
  const getCountries = () => {
    return Country.getAllCountries().map((country) => ({
      value: country.isoCode,
      label: country.name,
      isoCode: country.isoCode,
    }));
  };

  // Get states/provinces for selected country
  const getStates = (countryCode: string) => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map((state) => ({
      value: state.isoCode,
      label: state.name,
    }));
  };

  // Get cities for selected country and state
  const getCities = (countryCode: string, stateCode: string) => {
    if (!countryCode || !stateCode) return [];
    return City.getCitiesOfState(countryCode, stateCode).map((city) => ({
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

  // Fetch lead data and populate form
  useEffect(() => {
    const fetchLeadData = async () => {
      if (!router.isReady || !id) return;
      
      try {
        setFetching(true);
        const leadData = await getLead(Number(id));
        
        // Parse contact_persons if it's a string
        let contactPersonsArray: Array<{
          title: string;
          name: string;
          phone_country_code: string;
          phone: string;
          email: string;
        }> = [];
        
        const leadDataAny = leadData as any;
        if (leadDataAny.contact_persons) {
          if (typeof leadDataAny.contact_persons === 'string') {
            try {
              contactPersonsArray = JSON.parse(leadDataAny.contact_persons);
            } catch (e) {
              console.error("Failed to parse contact_persons:", e);
            }
          } else if (Array.isArray(leadDataAny.contact_persons)) {
            contactPersonsArray = leadDataAny.contact_persons;
          }
        }

        // Determine if it's an opportunity - check multiple fields
        let leadType: "lead" | "opportunity" = "lead";
        if (leadDataAny.type) {
          const typeStr = String(leadDataAny.type).toLowerCase();
          if (typeStr === "opportunity") {
            leadType = "opportunity";
          } else {
            leadType = "lead";
          }
        } else {
          const isOppFlag = leadDataAny.is_opportunity === "1" || 
                          leadDataAny.is_opportunity === 1 || 
                          leadDataAny.is_opportunity === true;
          if (isOppFlag) {
            leadType = "opportunity";
          }
        }
        const isOpp = leadType === "opportunity";
        setIsOpportunity(isOpp);

        // Convert string IDs to numbers
        const stageId = leadDataAny.stage_id ? Number(leadDataAny.stage_id) : undefined;
        const campaignId = leadDataAny.campaign_id ? Number(leadDataAny.campaign_id) : undefined;
        const crmDataId = leadDataAny.crm_data_id ? Number(leadDataAny.crm_data_id) : undefined;
        
        // Convert user_extension to number (it might be number or string)
        const userExtension = leadDataAny.user_extension ? Number(leadDataAny.user_extension) : null;

        // Handle other_information - it might be an array or object
        let otherInformation: Record<string, any> = {};
        if (leadDataAny.other_information) {
          if (Array.isArray(leadDataAny.other_information)) {
            // Convert array to object if needed
            otherInformation = {};
          } else if (typeof leadDataAny.other_information === 'object') {
            otherInformation = leadDataAny.other_information;
          }
        }

        // Populate form data
        setFormData({
          name: leadData.name || "",
          user_extension: userExtension,
          type: leadType,
          description: leadData.description || "",
          source: leadDataAny.source || "",
          company_name: leadData.company_name || "",
          company_contact: leadData.company_contact || "",
          company_description: leadData.company_description || "",
          industry_ids: (leadDataAny.industry_ids && Array.isArray(leadDataAny.industry_ids))
            ? leadDataAny.industry_ids.map((id: any) => Number(id)).filter((id: number) => !Number.isNaN(id))
            : (leadDataAny.industries && Array.isArray(leadDataAny.industries))
            ? leadDataAny.industries.map((ind: any) => typeof ind === 'object' ? Number(ind.id) : Number(ind)).filter((id: number) => !Number.isNaN(id))
            : [],
          business_type: leadDataAny.business_type || "",
          company_country: leadDataAny.company_country || "",
          company_province: leadDataAny.company_province || "",
          company_city: leadDataAny.company_city || "",
          company_location_other: leadDataAny.company_location_other || "",
          company_size: leadDataAny.company_size || "",
          contact_person_title: leadDataAny.contact_person_title || "",
          contact_person_name: leadDataAny.contact_person_name || "",
          contact_phone_country_code: leadDataAny.contact_phone_country_code || "",
          contact_phone: leadDataAny.contact_phone || "",
          stage_id: stageId,
          campaign_id: campaignId,
          crm_data_id: crmDataId,
          lead_potential: leadDataAny.lead_potential || "",
          other_information: otherInformation,
          campaign_field_values: leadDataAny.campaign_field_values || {},
          // Ensure at least one contact person exists
          contact_persons: contactPersonsArray.length > 0 
            ? contactPersonsArray 
            : [{
                title: "",
                name: "",
                phone_country_code: "",
                phone: "",
                email: "",
              }],
        });

        // Fetch stages for the lead type
        await fetchStages(leadType);
        isInitialLoad.current = false;
        
        // Use campaign from response if available, otherwise fetch it
        let campaignData: CampaignData | null = null;
        if (leadDataAny.campaign && campaignId) {
          // Campaign is already in the response
          campaignData = leadDataAny.campaign;
          setSelectedCampaign(campaignData);
        } else if (campaignId) {
          // Fetch campaign details if not in response
          try {
            campaignData = await getCampaignById(campaignId);
            setSelectedCampaign(campaignData);
          } catch (error) {
            console.error("Failed to fetch campaign:", error);
          }
        }

        // Fetch campaign industries and auto-select if available
        if (campaignData) {
          try {
            setLoadingIndustries(true);
            const industriesData = (campaignData as any).industries;
            const industryIds = (campaignData as any).industry_ids;
            
            let campaignIndustryIds: number[] = [];
            if (industriesData && Array.isArray(industriesData)) {
              campaignIndustryIds = industriesData.map((ind: any) => typeof ind === 'object' ? ind.id : ind);
            } else if (industryIds && Array.isArray(industryIds)) {
              campaignIndustryIds = industryIds;
            }
            
            if (campaignIndustryIds.length > 0) {
              // Fetch all industries and filter to only show campaign industries
              const allIndustriesResponse = await getIndustries({ per_page: 1000 });
              const allIndustriesList = allIndustriesResponse.data || [];
              const filteredIndustries = allIndustriesList.filter((ind: IndustryData) => 
                campaignIndustryIds.includes(ind.id)
              );
              setCampaignIndustries(filteredIndustries);
              
              // Auto-select campaign industries if formData.industry_ids is empty
              setFormData((prevFormData) => {
                if (!prevFormData.industry_ids || prevFormData.industry_ids.length === 0) {
                  return {
                    ...prevFormData,
                    industry_ids: campaignIndustryIds,
                  };
                }
                return prevFormData;
              });
            }
          } catch (error) {
            console.error("Failed to fetch campaign industries:", error);
          } finally {
            setLoadingIndustries(false);
          }
        }

        // If crm_data_id exists, fetch CRM data
        if (leadData.crm_data_id) {
          try {
            const crmDataRecord = await getCrmDataById(leadData.crm_data_id);
            setSelectedCrmData(crmDataRecord);
          } catch (error) {
            console.error("Failed to fetch CRM data:", error);
          }
        }

        // Initialize location dropdowns from form data
        if (leadDataAny.company_country) {
          const country = Country.getAllCountries().find(
            (c) => c.name === leadDataAny.company_country
          );
          if (country) {
            setSelectedCountry({
              value: country.isoCode,
              label: country.name,
              isoCode: country.isoCode,
            });

            if (leadDataAny.company_province) {
              const state = State.getStatesOfCountry(country.isoCode).find(
                (s) => s.name === leadDataAny.company_province
              );
              if (state) {
                setSelectedState({
                  value: state.isoCode,
                  label: state.name,
                });

                if (leadDataAny.company_city) {
                  const city = City.getCitiesOfState(
                    country.isoCode,
                    state.isoCode
                  ).find((c) => c.name === leadDataAny.company_city);
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
      } catch (error) {
        console.error("Failed to fetch lead:", error);
        toast.error("Failed to load lead data");
      } finally {
        setFetching(false);
      }
    };

    fetchLeadData();
  }, [router.isReady, id]);

  // Fetch extensions, campaigns, and CRM data on mount
  useEffect(() => {
    fetchExtensions();
    fetchCampaigns();
    fetchCrmData();
  }, []);

  // Fetch all industries
  useEffect(() => {
    const fetchAllIndustries = async () => {
      try {
        setLoadingAllIndustries(true);
        const response = await getIndustries({ per_page: 1000 });
        setAllIndustries(response.data || []);
      } catch (error) {
        console.error("Failed to fetch industries:", error);
        toast.error("Failed to fetch industries");
      } finally {
        setLoadingAllIndustries(false);
      }
    };
    
    fetchAllIndustries();
  }, []);

  // Refetch stages when type changes (but not on initial load)
  useEffect(() => {
    if (!isInitialLoad.current) {
      fetchStages(formData.type);
      setFormData((prev) => ({
        ...prev,
        stage_id: undefined,
      }));
    }
  }, [formData.type]);

  const fetchStages = async (type: any) => {
    try {
      const stagesData = await getStages(type);
      setStages(stagesData || []);
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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validation functions for each step
  const validateStep0 = (): boolean => {
    const requiredFields = [
      { field: 'name' as const, name: 'Lead Name' },
      { field: 'user_extension' as const, name: 'User Extension' },
      { field: 'stage_id' as const, name: 'Stage' },
    ];
    return checkRequiredFields(formData, requiredFields);
  };

  const validateStep1 = (): boolean => {
    // Step 1 (Company Info) has no required fields
    return true;
  };

  const validateStep2 = (): boolean => {
    // Validate that at least one contact person exists and has name or phone
    if (!formData.contact_persons || formData.contact_persons.length === 0) {
      toast.error('Please add at least one contact person');
      return false;
    }

    // Check if at least one contact person has name or phone
    const hasValidContact = formData.contact_persons.some(
      (person) => person.name || person.phone
    );

    if (!hasValidContact) {
      toast.error('Please provide at least name or phone for one contact person');
      return false;
    }

    // Validate email format for each contact person that has an email
    for (const person of formData.contact_persons) {
      if (person.email) {
        const isValidEmail = checkRequiredFields({ email: person.email }, [
          { field: "email", name: "Email", type: ValidationType.EMAIL },
        ]);
        if (!isValidEmail) {
          return false;
        }
      }
    }

    return true;
  };

  const validateStep3 = (): boolean => {
    // Step 3 (Other Info) has no required fields
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
      setFormData((prev) => ({
        ...prev,
        campaign_id: undefined,
        campaign_field_values: {},
      }));
      return;
    }

    try {
      const campaign = await getCampaignById(campaignId);
      
      // Pre-fill campaign fields with CRM data (excluding dropdown fields)
      const preFilledFields: Record<string, any> = {};

      if (campaign.fields && selectedCrmData?.data) {
        campaign.fields.forEach((field) => {
          if (field.field_type === "dropdown") {
            return;
          }

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
        campaign_field_values: preFilledFields,
      }));

      setSelectedCampaign(campaign);
    } catch (error) {
      console.error("Failed to fetch campaign details:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) {
      toast.error("Lead ID is missing");
      return;
    }
    
    // Validate all required fields using checkRequiredFields
    const requiredFields = [
      { field: 'name' as const, name: 'Lead Name' },
      { field: 'user_extension' as const, name: 'User Extension' },
      { field: 'stage_id' as const, name: 'Stage' },
    ];

    if (!checkRequiredFields(formData, requiredFields)) {
      return;
    }

    // Validate at least one contact person exists and has name or phone
    if (!formData.contact_persons || formData.contact_persons.length === 0) {
      toast.error("Please add at least one contact person");
      return;
    }

    const hasValidContact = formData.contact_persons.some(
      (person) => person.name || person.phone
    );

    if (!hasValidContact) {
      toast.error("Please provide at least name or phone for one contact person");
      return;
    }

    // Validate required campaign fields
    if (selectedCampaign && selectedCampaign.fields) {
      const requiredCampaignFields = selectedCampaign.fields.filter(
        (field: any) => field.is_required
      );

      if (requiredCampaignFields.length > 0) {
        const missingFields: string[] = [];
        
        requiredCampaignFields.forEach((field: any) => {
          const fieldValue = formData.campaign_field_values[field.field_name];
          if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
            missingFields.push(field.field_name);
          }
        });

        if (missingFields.length > 0) {
          toast.error(
            `Please fill in all required campaign fields: ${missingFields.join(', ')}`
          );
          return;
        }
      }
    }
    
    setLoading(true);

    try {
      // Format payload according to API structure (same as create)
      const payload: any = {
        name: formData.name,
        user_extension: formData.user_extension ? String(formData.user_extension) : null,
        stage_id: String(formData.stage_id),
        ...(formData.campaign_id && { campaign_id: String(formData.campaign_id) }),
        ...(formData.crm_data_id && { crm_data_id: String(formData.crm_data_id) }),
        ...(formData.source && { source: formData.source }),
        ...(formData.description && { description: formData.description }),
        ...(formData.company_name && { company_name: formData.company_name }),
        ...(formData.industry_ids && formData.industry_ids.length > 0 && { industry_ids: formData.industry_ids }),
        ...(formData.business_type && { business_type: formData.business_type }),
        ...(formData.company_country && { company_country: formData.company_country }),
        ...(formData.company_province && { company_province: formData.company_province }),
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

      await updateLead(Number(id), payload);
      toast.success("Lead updated successfully!");
      if (formData.type === "lead") {
        router.push("/crm/leads");
      } else {
        router.push("/crm/opportunities");
      }
    } catch (error) {
      toast.error("Failed to update lead");
      console.error("Update lead error:", error);
    } finally {
      setLoading(false);
    }
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
  
  if (fetching) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="spinner-border">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle={isOpportunity ? "Edit Opportunity" : "Edit Lead"}
      />

      <PageHeader
        title={isOpportunity ? "Edit Opportunity" : "Edit Lead"}
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
        {/* Edit Lead Form */}
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
                      Pre-filled from Prospect: {selectedCrmData?.name || `#${selectedCrmData?.id}`}
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
                    <button
                      type="button"
                      className="text-center position-relative border-0 bg-transparent"
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
                    </button>

                    {/* Step 2 */}
                    <button
                      type="button"
                      className="text-center position-relative border-0 bg-transparent"
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
                    </button>

                    {/* Step 3 */}
                    <button
                      type="button"
                      className="text-center position-relative border-0 bg-transparent"
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
                    </button>

                    {/* Step 4 */}
                    <button
                      type="button"
                      className="text-center position-relative border-0 bg-transparent"
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
                    </button>
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
                                <Form.Label>Assigned To <span className="text-danger">*</span></Form.Label>
                                {formData.type === "opportunity" ? (
                                  <Select
                                    value={
                                      formData.user_extension
                                        ? {
                                            value: formData.user_extension,
                                            label: extensionsOpportunities.find(
                                              (ext: any) => Number(ext.id) == formData.user_extension
                                            )?.display_name || "",
                                          }
                                        : null
                                    }
                                    onChange={(selectedOption: any) => {
                                      handleInputChange("user_extension", selectedOption?.value ? Number(selectedOption.value) : null);
                                    }}
                                    options={extensionsOpportunities.map((extension: any) => ({
                                      value: Number(extension.id),
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
                                              (ext: any) => Number(ext.id) === formData.user_extension
                                            )?.display_name || "",
                                          }
                                        : null
                                    }
                                    onChange={(selectedOption: any) => {
                                      handleInputChange("user_extension", selectedOption?.value ? Number(selectedOption.value) : null);
                                    }}
                                    options={extensions.map((extension: any) => ({
                                      value: Number(extension.id),
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
                                <Form.Label>
                                  Stage <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                  value={formData.stage_id || ""}
                                  onChange={(e) =>
                                    handleInputChange("stage_id", e.target.value ? Number(e.target.value) : undefined)
                                  }
                                  required
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
                                <Form.Label>Prospect</Form.Label>
                                <Select
                                  value={
                                    formData.crm_data_id
                                      ? {
                                          value: formData.crm_data_id,
                                          label: `${crmData.find((d) => d.id === formData.crm_data_id)?.name || "No Name"}`,
                                        }
                                      : null
                                  }
                                  onChange={(selectedOption: any) => {
                                    handleInputChange("crm_data_id", selectedOption?.value || undefined);
                                  }}
                                  options={crmData.map((data) => ({
                                    value: data.id,
                                    label: `${data?.name || "No Name"} - ${data?.phone || "No Phone"}`,
                                  }))}
                                  placeholder="Select Prospect (Optional)"
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
                                <Select
                                  isMulti
                                  options={allIndustries.map((ind) => ({ value: ind.id, label: ind.name }))}
                                  value={formData.industry_ids.map((id) => {
                                    const industry = allIndustries.find((ind) => ind.id === id);
                                    return industry ? { value: industry.id, label: industry.name } : null;
                                  }).filter(Boolean) as any}
                                  onChange={(selected) =>
                                    setFormData({
                                      ...formData,
                                      industry_ids: selected ? selected.map((option: any) => option.value) : [],
                                    })
                                  }
                                  placeholder="Select industries..."
                                  isLoading={loadingAllIndustries}
                                  isDisabled={loadingAllIndustries}
                                  isClearable
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
                                  <option value="Individual">Individual</option>
                                  <option value="Family">Family</option>
                                  <option value="SME">SME</option>
                                  <option value="Corporate">Corporate</option>
                                  <option value="Enterprise">Enterprise</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
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
                                          style={{ width: "20px", height: "15px" }}
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
                                  options={getStates(
                                    selectedCountry?.value || ""
                                  )}
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
                                <Form.Label>Location Notes</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.company_location_other}
                                  onChange={(e) => handleInputChange("company_location_other", e.target.value)}
                                  placeholder="Landmark, Access Instructions, Directions, etc."
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
                          <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold mb-0 text-warning">CONTACT PERSONS</h5>
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
                            <Card key={`contact-person-${index}-${person.name || index}`} className="mb-3 border">
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
                                <h6 className="mb-0">Custom Campaign Fields: {selectedCampaign.name}</h6>
                                {selectedCrmData && (
                                  <Badge bg="success" className="ms-2 small">
                                    Auto-filled from Prospect
                                  </Badge>
                                )}
                              </div>
                              <Row>
                                {selectedCampaign.fields.map((field, index) => (
                                  <Col md={6} key={`campaign-field-${field.field_name}-${index}`} className="mb-3">
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
                            All required fields are marked with <span className="text-danger">*</span>. Complete all sections to update the lead.
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
                        onClick={handleNextStep}
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
                        {loading ? "Updating..." : "Update Lead"}
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

EditLead.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EditLead;

