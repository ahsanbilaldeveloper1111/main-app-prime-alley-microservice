import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { UpdateCampaign, GetCampaignById, ListVoiceBots } from "@utils/aiml";
import { toast } from "react-toastify";
import { useRouter } from 'next/router';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import parsePhoneNumber from "libphonenumber-js";
import { 
    DollarSign, 
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Clock,
    Rocket,
    CheckCircle2,
    Edit2,
    Upload,
    TrendingUp
  } from 'lucide-react';
import ContextScriptScreen from '@components/context-scripts';
import CallSettingsScreen from '@components/call-settings';

interface CampaignData {
    campaignName: string;
    botProfile: string;
    clientId: string;
    dialerStrategy: string;
    transferCallsTo: string;
    transferFallbackTo: string;
    retries: number;
    dncCompliance: boolean;
    owner: string;
    clientWorkspace: string;
    scheduleStart: string;
    scheduleEnd: string;
    timezone: string;
    concurrency: number;
    recordingConsent: boolean;
    dncrCheck: boolean;
  }
  

const EditCampaign = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [voiceBots, setVoiceBots] = useState<any[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState<boolean>(false);

  const [formData, setFormData] = useState<CampaignData>({
    campaignName: '',
    botProfile: '',
    clientId: '',
    dialerStrategy: 'Progressive Dialing',
    transferCallsTo: '',
    transferFallbackTo: '',
    retries: 15,
    dncCompliance: true,
    owner: '',
    clientWorkspace: '',
    scheduleStart: '',
    scheduleEnd: '',
    timezone: 'Pacific Time (GMT-7)',
    concurrency: 10,
    recordingConsent: true,
    dncrCheck: true
  });

  const [transferCallsEnabled, setTransferCallsEnabled] = useState<boolean>(true);
  const [transferFallbackEnabled, setTransferFallbackEnabled] = useState<boolean>(true);
  const [retriesEnabled, setRetriesEnabled] = useState<boolean>(false);
  const [uploadedContacts, setUploadedContacts] = useState<number>(0);
  const [validContacts, setValidContacts] = useState<number>(0);
  const [mobileContacts, setMobileContacts] = useState<number>(0);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [manualNumbers, setManualNumbers] = useState<string>('');
  const [scheduleStartDate, setScheduleStartDate] = useState<Date | null>(null);
  const [scheduleEndDate, setScheduleEndDate] = useState<Date | null>(null);

  const steps = [
    { number: 1, label: 'Basics' },
    { number: 2, label: 'Context & Script' },
    { number: 3, label: 'Call Settings' },
    { number: 4, label: 'Review & Launch' }
  ];

  // Fetch voice bots for dropdown
  const fetchVoiceBots = useCallback(async () => {
    setIsLoadingBots(true);
    try {
      const response = await ListVoiceBots();
      const botsData = response?.results?.data || response?.bots || response?.data || [];
      setVoiceBots(botsData);
    } catch (error) {
      console.error('Error fetching voice bots:', error);
    } finally {
      setIsLoadingBots(false);
    }
  }, []);

  // Fetch campaign data
  const fetchCampaignData = useCallback(async () => {
    if (!id) return;
    
    const campaignId = Array.isArray(id) ? id[0] : id;
    if (!campaignId) return;

    setIsLoading(true);
    try {
      const campaign = await GetCampaignById(campaignId);
      if (campaign) {
        setFormData({
          campaignName: campaign.name || '',
          botProfile: campaign.voice_bot_id?.toString() || '',
          clientId: campaign.description || '',
          dialerStrategy: campaign.dialer_strategy || 'Progressive Dialing',
          transferCallsTo: campaign.transfer_calls_to || '',
          transferFallbackTo: campaign.transfer_fallback_to || '',
          retries: campaign.retries || 15,
          dncCompliance: campaign.dnc_compliance ?? true,
          owner: campaign.owner || '',
          clientWorkspace: campaign.client_workspace || '',
          scheduleStart: campaign.schedule_start || '',
          scheduleEnd: campaign.schedule_end || '',
          timezone: campaign.timezone || 'Pacific Time (GMT-7)',
          concurrency: campaign.concurrency || 10,
          recordingConsent: campaign.recording_consent ?? true,
          dncrCheck: campaign.dncr_check ?? true
        });

        setTransferCallsEnabled(!!campaign.transfer_calls_to);
        setTransferFallbackEnabled(!!campaign.transfer_fallback_to);
        setRetriesEnabled(!!campaign.retries);
        
        if (campaign.numbers_to_call && Array.isArray(campaign.numbers_to_call)) {
          setManualNumbers(campaign.numbers_to_call.join(','));
          setUploadedContacts(campaign.numbers_count || 0);
          setValidContacts(campaign.numbers_count || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      toast.error('Failed to load campaign data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVoiceBots();
    if (id) {
      fetchCampaignData();
    }
  }, [fetchVoiceBots, fetchCampaignData, id]);

  const handleInputChange = (field: keyof CampaignData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validate phone number in E.164 format
  const isValidE164 = (phoneNumber: string): boolean => {
    try {
      // Remove whitespace and clean the number
      const cleaned = phoneNumber.trim().replace(/\s+/g, '');
      // E.164 format: must start with + and contain only digits after that
      if (!cleaned.startsWith('+')) {
        return false;
      }
      // Parse and validate using libphonenumber-js
      const parsed = parsePhoneNumber(cleaned);
      return parsed?.isValid() ?? false;
    } catch {
      return false;
    }
  };

  // Check if number is mobile
  const isMobileNumber = (phoneNumber: string): boolean => {
    try {
      const cleaned = phoneNumber.trim().replace(/\s+/g, '');
      const parsed = parsePhoneNumber(cleaned);
      if (parsed?.isValid()) {
        // Check if it's a mobile number type
        const numberType = parsed.getType();
        return numberType === 'MOBILE' || numberType === 'FIXED_LINE_OR_MOBILE';
      }
      return false;
    } catch {
      return false;
    }
  };

  // Parse and validate manual numbers
  useEffect(() => {
    if (manualNumbers.trim()) {
      // Split by comma or newline
      const numbers = manualNumbers
        .split(/[,\n]/)
        .map(num => num.trim())
        .filter(num => num.length > 0);

      const totalCount = numbers.length;
      const validNumbers = numbers.filter(isValidE164);
      const validCount = validNumbers.length;
      const mobileCount = validNumbers.filter(isMobileNumber).length;

      setUploadedContacts(totalCount);
      setValidContacts(validCount);
      setMobileContacts(mobileCount);
    } else {
      setUploadedContacts(0);
      setValidContacts(0);
      setMobileContacts(0);
    }
  }, [manualNumbers]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setUploadedFile(file);
      
      try {
        // Read file content
        const text = await file.text();
        
        // Parse CSV - handle both comma and newline separated values
        const numbers: string[] = [];
        const lines = text.split(/\r?\n/);
        
        lines.forEach(line => {
          // Split by comma and process each value
          const values = line.split(',').map(val => val.trim()).filter(val => val.length > 0);
          numbers.push(...values);
        });
        
        // Remove empty values and duplicates
        const uniqueNumbers = Array.from(new Set(numbers.filter(num => num.length > 0)));
        
        // Validate numbers
        const totalCount = uniqueNumbers.length;
        const validNumbers = uniqueNumbers.filter(isValidE164);
        const validCount = validNumbers.length;
        const mobileCount = validNumbers.filter(isMobileNumber).length;
        
        setUploadedContacts(totalCount);
        setValidContacts(validCount);
        setMobileContacts(mobileCount);
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Error reading file. Please check the file format.');
        setUploadedContacts(0);
        setValidContacts(0);
        setMobileContacts(0);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!id) {
      toast.error('Campaign ID is missing');
      return;
    }

    const campaignId = Array.isArray(id) ? id[0] : id;
    
    if (!formData.campaignName) {
      toast.error('Please enter a campaign name');
      return;
    }

    if (!formData.botProfile) {
      toast.error('Please select a bot profile');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.campaignName,
        description: formData.clientId || '',
        voice_bot_id: parseInt(formData.botProfile),
      };

      // Add optional fields
      if (formData.clientId) payload.description = formData.clientId;
      if (formData.dialerStrategy) payload.dialer_strategy = formData.dialerStrategy;
      if (formData.transferCallsTo && transferCallsEnabled) payload.transfer_calls_to = formData.transferCallsTo;
      if (formData.transferFallbackTo && transferFallbackEnabled) payload.transfer_fallback_to = formData.transferFallbackTo;
      if (formData.retries && retriesEnabled) payload.retries = formData.retries;
      if (formData.dncCompliance !== undefined) payload.dnc_compliance = formData.dncCompliance;
      if (formData.owner) payload.owner = formData.owner;
      if (formData.clientWorkspace) payload.client_workspace = formData.clientWorkspace;
      if (formData.scheduleStart) payload.schedule_start = formData.scheduleStart;
      if (formData.scheduleEnd) payload.schedule_end = formData.scheduleEnd;
      if (formData.timezone) payload.timezone = formData.timezone;
      if (formData.concurrency) payload.concurrency = formData.concurrency;
      if (formData.recordingConsent !== undefined) payload.recording_consent = formData.recordingConsent;
      if (formData.dncrCheck !== undefined) payload.dncr_check = formData.dncrCheck;

      // Update phone numbers if provided
      if (manualNumbers) {
        payload.numbers_to_call = manualNumbers;
      }

      await UpdateCampaign(campaignId, payload);

      // Success - redirect to campaigns list
      toast.success('Campaign updated successfully');
      router.push('/ai-ml/campaigns');
    } catch (error) {
      console.error('Error updating campaign:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <React.Fragment>
        <BreadcrumbItem mainTitle="" mainLink="" subTitle="Edit Campaign" />
        <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#6c757d' }}>
            Loading campaign data...
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Edit Campaign" />

      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
       
       {/* Page Content */}
       <div style={{  }}>
         {/* Page Header */}
         <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', color: '#1f2937' }}>
           Edit Campaign
         </h2>
 
         {/* Steps Navigation */}
         <div style={{ 
           backgroundColor: 'white',
           borderRadius: '12px',
           
           marginBottom: '2rem',
           boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
         }}>
           <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
             {steps.map((step, index) => (
               <React.Fragment key={step.number}>
                 <button
                   onClick={() => setActiveStep(step.number)}
                   style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.75rem',
                     padding: '0.75rem 1.5rem',
                     border: 'none',
                     borderRadius: '8px',
                     backgroundColor: activeStep === step.number ? '#d4e4ff' : 'transparent',
                     color: activeStep === step.number ? '#0d6efd' : '#6c757d',
                     cursor: 'pointer',
                     fontSize: '1rem',
                     fontWeight: activeStep === step.number ? '600' : '400',
                     transition: 'all 0.2s'
                   }}
                 >
                   <span style={{
                     width: '28px',
                     height: '28px',
                     borderRadius: '50%',
                     backgroundColor: activeStep === step.number ? '#0d6efd' : activeStep > step.number ? '#198754' : '#e9ecef',
                     color: activeStep === step.number || activeStep > step.number ? 'white' : '#6c757d',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     fontSize: '0.875rem',
                     fontWeight: '600'
                   }}>
                     {activeStep > step.number ? '✓' : step.number}
                   </span>
                   {step.label}
                 </button>
               </React.Fragment>
             ))}
           </div>
         </div>
 
         {/* Main Content - Reuse the same structure as create-campaign */}
         {activeStep === 1 && (
           <div style={{ display: 'flex', gap: '2rem' }}>
             {/* Left Section - Form */}
             <div style={{ flex: '1', backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
               <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '2rem', color: '#1f2937' }}>
                 Basics
               </h3>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
               {/* Left Column */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 {/* Campaign Name */}
                 <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                     Campaign Name
                   </label>
                   <input
                     type="text"
                     value={formData.campaignName}
                     onChange={(e) => handleInputChange('campaignName', e.target.value)}
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       border: '1px solid #ced4da',
                       borderRadius: '6px',
                       fontSize: '1rem'
                     }}
                   />
                 </div>
 
                 {/* Bot Profile */}
                 <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                     Bot Profile
                   </label>
                   <select
                     value={formData.botProfile}
                     onChange={(e) => handleInputChange('botProfile', e.target.value)}
                     disabled={isLoadingBots}
                     tabIndex={3}
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       border: '1px solid #ced4da',
                       borderRadius: '6px',
                       fontSize: '1rem',
                       backgroundColor: isLoadingBots ? '#e9ecef' : 'white'
                     }}
                   >
                     <option value="">Select Bot Profile</option>
                     {voiceBots.map((bot) => (
                       <option key={bot.id} value={bot.id}>
                         {bot.bot_name || bot.name || 'Unnamed Bot'}
                       </option>
                     ))}
                   </select>
                 </div>
 
                 {/* Description */}
                 <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                     Description
                   </label>
                   <textarea
                     value={formData.clientId}
                     onChange={(e) => handleInputChange('clientId', e.target.value)}
                     tabIndex={5}
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       border: '1px solid #ced4da',
                       borderRadius: '6px',
                       fontSize: '1rem',
                       minHeight: '80px',
                       resize: 'vertical'
                     }}
                     placeholder="Enter campaign description"
                   />
                 </div>
 
                 {/* Dialer Strategy */}
                 <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                     Dialer Strategy
                   </label>
                   <select
                     value={formData.dialerStrategy}
                     onChange={(e) => handleInputChange('dialerStrategy', e.target.value)}
                     tabIndex={7}
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       border: '1px solid #ced4da',
                       borderRadius: '6px',
                       fontSize: '1rem',
                       backgroundColor: 'white'
                     }}
                   >
                     <option>Progressive Dialing</option>
                     <option>Predictive Dialing</option>
                     <option>Power Dialing</option>
                   </select>
                 </div>
 
                 {/* Transfer Calls To */}
                 <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                     <label style={{ fontWeight: '500', color: '#495057' }}>
                       Transfer Calls To
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                       <input
                         type="checkbox"
                         checked={transferCallsEnabled}
                         onChange={(e) => setTransferCallsEnabled(e.target.checked)}
                         style={{ display: 'none' }}
                       />
                       <div style={{
                         width: '44px',
                         height: '24px',
                         borderRadius: '12px',
                         backgroundColor: transferCallsEnabled ? '#0d6efd' : '#ced4da',
                         position: 'relative',
                         transition: 'background-color 0.2s'
                       }}>
                         <div style={{
                           width: '20px',
                           height: '20px',
                           borderRadius: '50%',
                           backgroundColor: 'white',
                           position: 'absolute',
                           top: '2px',
                           left: transferCallsEnabled ? '22px' : '2px',
                           transition: 'left 0.2s'
                         }} />
                       </div>
                     </label>
                   </div>
                   <input
                     type="text"
                     value={formData.transferCallsTo}
                     onChange={(e) => handleInputChange('transferCallsTo', e.target.value)}
                     disabled={!transferCallsEnabled}
                     tabIndex={9}
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       border: '1px solid #ced4da',
                       borderRadius: '6px',
                       fontSize: '1rem',
                       backgroundColor: transferCallsEnabled ? 'white' : '#e9ecef'
                     }}
                   />
                 </div>
 
                 {/* Transfer Fallback To */}
                 <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                     <label style={{ fontWeight: '500', color: '#495057' }}>
                       Transfer Fallback To
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                       <input
                         type="checkbox"
                         checked={transferFallbackEnabled}
                         onChange={(e) => setTransferFallbackEnabled(e.target.checked)}
                         style={{ display: 'none' }}
                       />
                       <div style={{
                         width: '44px',
                         height: '24px',
                         borderRadius: '12px',
                         backgroundColor: transferFallbackEnabled ? '#0d6efd' : '#ced4da',
                         position: 'relative',
                         transition: 'background-color 0.2s'
                       }}>
                         <div style={{
                           width: '20px',
                           height: '20px',
                           borderRadius: '50%',
                           backgroundColor: 'white',
                           position: 'absolute',
                           top: '2px',
                           left: transferFallbackEnabled ? '22px' : '2px',
                           transition: 'left 0.2s'
                         }} />
                       </div>
                     </label>
                   </div>
                   <input
                     type="text"
                     value={formData.transferFallbackTo}
                     onChange={(e) => handleInputChange('transferFallbackTo', e.target.value)}
                     disabled={!transferFallbackEnabled}
                     tabIndex={11}
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       border: '1px solid #ced4da',
                       borderRadius: '6px',
                       fontSize: '1rem',
                       backgroundColor: transferFallbackEnabled ? 'white' : '#e9ecef'
                     }}
                   />
                 </div>
 
                 {/* Retries */}
                 <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                     <label style={{ fontWeight: '500', color: '#495057' }}>
                       Retries:
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                       <input
                         type="checkbox"
                         checked={retriesEnabled}
                         onChange={(e) => setRetriesEnabled(e.target.checked)}
                         style={{ display: 'none' }}
                       />
                       <div style={{
                         width: '44px',
                         height: '24px',
                         borderRadius: '12px',
                         backgroundColor: retriesEnabled ? '#0d6efd' : '#ced4da',
                         position: 'relative',
                         transition: 'background-color 0.2s'
                       }}>
                         <div style={{
                           width: '20px',
                           height: '20px',
                           borderRadius: '50%',
                           backgroundColor: 'white',
                           position: 'absolute',
                           top: '2px',
                           left: retriesEnabled ? '22px' : '2px',
                           transition: 'left 0.2s'
                         }} />
                       </div>
                     </label>
                   </div>
                   <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                     <select
                       value={formData.retries}
                       onChange={(e) => handleInputChange('retries', parseInt(e.target.value))}
                       disabled={!retriesEnabled}
                       tabIndex={13}
                       style={{
                         padding: '0.75rem',
                         border: '1px solid #ced4da',
                         borderRadius: '6px',
                         fontSize: '1rem',
                         backgroundColor: retriesEnabled ? 'white' : '#e9ecef',
                         width: '80px'
                       }}
                     >
                       {[...Array(30)].map((_, i) => (
                         <option key={i + 1} value={i + 1}>{i + 1}</option>
                       ))}
                     </select>
                     <span style={{ color: '#6c757d' }}>second</span>
                   </div>
                 </div>
 
                 {/* DNC/DNCR Compliance */}
                 <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <label style={{ fontWeight: '500', color: '#495057' }}>
                       DNC/DNCR Compliance
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                       <input
                         type="checkbox"
                         checked={formData.dncCompliance}
                         onChange={(e) => handleInputChange('dncCompliance', e.target.checked)}
                         style={{ display: 'none' }}
                       />
                       <div style={{
                         width: '44px',
                         height: '24px',
                         borderRadius: '12px',
                         backgroundColor: formData.dncCompliance ? '#20c997' : '#ced4da',
                         position: 'relative',
                         transition: 'background-color 0.2s'
                       }}>
                         <div style={{
                           width: '20px',
                           height: '20px',
                           borderRadius: '50%',
                           backgroundColor: 'white',
                           position: 'absolute',
                           top: '2px',
                           left: formData.dncCompliance ? '22px' : '2px',
                           transition: 'left 0.2s'
                         }} />
                       </div>
                     </label>
                   </div>
                 </div>
               </div>
 
               {/* Right Column - Same as create-campaign */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 {/* Owner */}
                 <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                     Owner
                   </label>
                   <div style={{ 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '0.75rem',
                     padding: '0.75rem',
                     border: '1px solid #ced4da',
                     borderRadius: '6px'
                   }}>
                     <div style={{
                       width: '32px',
                       height: '32px',
                       borderRadius: '50%',
                       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       color: 'white',
                       fontWeight: '600'
                     }}>
                       {formData.owner ? formData.owner.charAt(0).toUpperCase() : 'U'}
                     </div>
                     <input
                       type="text"
                       value={formData.owner}
                       onChange={(e) => handleInputChange('owner', e.target.value)}
                       placeholder="Enter owner name"
                       tabIndex={2}
                       style={{
                         flex: 1,
                         border: 'none',
                         outline: 'none',
                         fontSize: '1rem',
                         backgroundColor: 'transparent',
                         padding: 0
                       }}
                     />
                   </div>
                 </div>
 
                 {/* Client / Workspace */}
                 <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                     Client / Workspace
                   </label>
                   <input
                     type="text"
                     value={formData.clientWorkspace}
                     onChange={(e) => handleInputChange('clientWorkspace', e.target.value)}
                     placeholder="Enter client or workspace name"
                     tabIndex={4}
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       border: '1px solid #ced4da',
                       borderRadius: '6px',
                       fontSize: '1rem',
                       color: '#1f2937',
                       backgroundColor: 'white'
                     }}
                   />
                 </div>
 
                 {/* Schedule Start */}
                 <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                     Schedule Start
                   </label>
                   <div style={{ position: 'relative' }}>
                     <DatePicker
                       selected={scheduleStartDate}
                       onChange={(date: Date | null) => {
                         setScheduleStartDate(date);
                         if (date) {
                           handleInputChange('scheduleStart', date.toISOString().split('T')[0]);
                         } else {
                           handleInputChange('scheduleStart', '');
                         }
                       }}
                       placeholderText="Select start date"
                       showTimeSelect
                       timeFormat="HH:mm"
                       timeIntervals={15}
                       timeCaption="Time"
                       dateFormat="MMM dd, yyyy h:mm aa"
                       minDate={new Date()}
                       className="form-control"
                       wrapperClassName="date-picker-wrapper"
                       tabIndex={6}
                     />
                   </div>
                 </div>
 
                 {/* Timezone */}
                 <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                     Timezone
                   </label>
                   <select
                     value={formData.timezone}
                     onChange={(e) => handleInputChange('timezone', e.target.value)}
                     tabIndex={8}
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       border: '1px solid #ced4da',
                       borderRadius: '6px',
                       fontSize: '1rem',
                       backgroundColor: 'white'
                     }}
                   >
                     <option>Pacific Time (GMT-7)</option>
                     <option>Eastern Time (GMT-5)</option>
                     <option>Central Time (GMT-6)</option>
                   </select>
                 </div>
 
                 {/* Concurrency */}
                 <div>
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                     Concurrency
                   </label>
                   <div style={{ position: 'relative' }}>
                     <BarChart3 size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                     <select
                       value={formData.concurrency}
                       onChange={(e) => handleInputChange('concurrency', Number.parseInt(e.target.value, 10))}
                       tabIndex={10}
                       style={{
                         width: '100%',
                         padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                         border: '1px solid #ced4da',
                         borderRadius: '6px',
                         fontSize: '1rem',
                         backgroundColor: 'white'
                       }}
                     >
                       <option value={10}>10 Parallel Calls</option>
                       <option value={20}>20 Parallel Calls</option>
                       <option value={50}>50 Parallel Calls</option>
                     </select>
                   </div>
                 </div>
 
                 {/* Recording Consent */}
                 <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <label style={{ fontWeight: '500', color: '#495057' }}>
                       Recording Consent
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                       <input
                         type="checkbox"
                         checked={formData.recordingConsent}
                         onChange={(e) => handleInputChange('recordingConsent', e.target.checked)}
                         style={{ display: 'none' }}
                       />
                       <div style={{
                         width: '44px',
                         height: '24px',
                         borderRadius: '12px',
                         backgroundColor: formData.recordingConsent ? '#20c997' : '#ced4da',
                         position: 'relative',
                         transition: 'background-color 0.2s'
                       }}>
                         <div style={{
                           width: '20px',
                           height: '20px',
                           borderRadius: '50%',
                           backgroundColor: 'white',
                           position: 'absolute',
                           top: '2px',
                           left: formData.recordingConsent ? '22px' : '2px',
                           transition: 'left 0.2s'
                         }} />
                       </div>
                     </label>
                   </div>
                 </div>
 
                 {/* DNC/DNCR Compliance (Right side) */}
                 <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <label style={{ fontWeight: '500', color: '#495057' }}>
                       DNC/DNCR Compliance
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                       <input
                         type="checkbox"
                         checked={formData.dncrCheck}
                         onChange={(e) => handleInputChange('dncrCheck', e.target.checked)}
                         style={{ display: 'none' }}
                       />
                       <div style={{
                         width: '44px',
                         height: '24px',
                         borderRadius: '12px',
                         backgroundColor: formData.dncrCheck ? '#20c997' : '#ced4da',
                         position: 'relative',
                         transition: 'background-color 0.2s'
                       }}>
                         <div style={{
                           width: '20px',
                           height: '20px',
                           borderRadius: '50%',
                           backgroundColor: 'white',
                           position: 'absolute',
                           top: '2px',
                           left: formData.dncrCheck ? '22px' : '2px',
                           transition: 'left 0.2s'
                         }} />
                       </div>
                     </label>
                   </div>
                 </div>
               </div>
             </div>
           </div>
 
           {/* Right Sidebar - Campaign Summary */}
           <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             {/* Upload Contacts Card */}
             <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
               <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                 Upload Contacts
               </h4>
               
               <input
                 type="file"
                 id="contactFileUpload"
                 accept=".csv,.xlsx,.xls"
                 onChange={handleFileUpload}
                 style={{ display: 'none' }}
               />
               <label
                 htmlFor="contactFileUpload"
                 style={{
                   display: 'block',
                   width: '100%',
                   padding: '1.5rem',
                   border: '2px dashed #ced4da',
                   borderRadius: '8px',
                   backgroundColor: '#f8f9fa',
                   cursor: 'pointer',
                   transition: 'all 0.2s',
                   textAlign: 'center'
                 }}
               >
                 <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                   <Upload size={32} color="#6c757d" />
                 </div>
                 <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                   {uploadedFileName || 'Upload CSV/Excel'}
                 </div>
                 <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                   Drag & drop or click to browse
                 </div>
               </label>

               {/* Manual Number Entry */}
               <div style={{ marginTop: '1rem' }}>
                 <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
                   Or Enter Phone Numbers (comma-separated)
                 </label>
                 <textarea
                   value={manualNumbers}
                   onChange={(e) => setManualNumbers(e.target.value)}
                   placeholder="+1234567890,+0987654321,+1122334455"
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     border: '1px solid #ced4da',
                     borderRadius: '6px',
                     fontSize: '0.875rem',
                     minHeight: '80px',
                     resize: 'vertical'
                   }}
                 />
               </div>
 
               {/* Contact Stats */}
               {(uploadedContacts > 0 || validContacts > 0) && (
                 <div style={{ 
                   marginTop: '1rem',
                   padding: '1rem',
                   backgroundColor: '#f8f9fa',
                   borderRadius: '8px'
                 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Total Contacts</span>
                     <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>{uploadedContacts.toLocaleString()}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Valid Numbers (E.164)</span>
                     <span style={{ fontSize: '1rem', fontWeight: '600', color: '#059669' }}>{validContacts.toLocaleString()}</span>
                   </div>
                   {/* <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Mobile Numbers</span>
                     <span style={{ fontSize: '1rem', fontWeight: '600', color: '#0d6efd' }}>{mobileContacts.toLocaleString()}</span>
                   </div> */}
                 </div>
               )}
             </div>
           </div>
         </div>
         )}

         {activeStep === 2 && <ContextScriptScreen />}

         {activeStep === 3 && <CallSettingsScreen />}

         {activeStep === 4 && (
           <div style={{ display: 'flex', gap: '2rem' }}>
             {/* Main Review Section - Same structure as create-campaign */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {/* Campaign Overview */}
               <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                   <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                     Campaign Overview
                   </h3>
                   <button
                     onClick={() => setActiveStep(1)}
                     style={{
                       padding: '0.5rem 1rem',
                       border: '1px solid #0d6efd',
                       borderRadius: '6px',
                       backgroundColor: 'white',
                       color: '#0d6efd',
                       fontSize: '0.875rem',
                       fontWeight: '500',
                       cursor: 'pointer',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '0.5rem'
                     }}
                   >
                     <Edit2 size={16} />
                     Edit
                   </button>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                   <div>
                     <label style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Campaign Name</label>
                     <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>{formData.campaignName}</p>
                   </div>
                   <div>
                     <label style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Bot Profile</label>
                     <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>
                       {voiceBots.find(b => b.id.toString() === formData.botProfile)?.bot_name || formData.botProfile}
                     </p>
                   </div>
                   <div>
                     <label style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Owner</label>
                     <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>{formData.owner || 'N/A'}</p>
                   </div>
                   <div>
                     <label style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Dialer Strategy</label>
                     <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>{formData.dialerStrategy}</p>
                   </div>
                 </div>
               </div>
             </div>

             {/* Right Sidebar - Summary & Launch */}
             <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {/* Quick Stats Summary */}
               <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                 <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>Campaign Summary</h4>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #e9ecef' }}>
                     <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Total Contacts</span>
                     <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>{validContacts.toLocaleString()}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #e9ecef' }}>
                     <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Bot Profile</span>
                     <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>{formData.botProfile}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #e9ecef' }}>
                     <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Concurrency</span>
                     <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>{formData.concurrency}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                     <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Compliance</span>
                     <div style={{ display: 'flex', gap: '0.25rem' }}>
                       {formData.recordingConsent && <CheckCircle2 size={16} color="#059669" />}
                       {formData.dncrCheck && <CheckCircle2 size={16} color="#059669" />}
                       {formData.dncCompliance && <CheckCircle2 size={16} color="#059669" />}
                     </div>
                   </div>
                 </div>
               </div>
 
               
 
               {/* Launch Card */}
               <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                 <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                   Ready to Launch?
                 </h4>
                 <p style={{ fontSize: '0.95rem', color: '#6c757d', marginBottom: '1.5rem' }}>
                   Review all settings before launching your campaign. Once launched, the campaign will begin calling contacts according to your schedule.
                 </p>
 
                 <button
                   onClick={handleSubmit}
                   disabled={isSubmitting}
                   style={{
                     width: '100%',
                     padding: '1rem',
                     border: 'none',
                     borderRadius: '8px',
                     backgroundColor: isSubmitting ? '#6c757d' : '#198754',
                     color: 'white',
                     fontSize: '1.1rem',
                     fontWeight: '600',
                     cursor: isSubmitting ? 'not-allowed' : 'pointer',
                     marginBottom: '0.75rem',
                     transition: 'all 0.2s',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '0.5rem'
                   }}
                   onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#157347')}
                   onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#198754')}
                 >
                   <Rocket size={20} />
                   {isSubmitting ? 'Updating Campaign...' : 'Update Campaign'}
                 </button>
 
                 <button
                   style={{
                     width: '100%',
                     padding: '1rem',
                     border: '1px solid #ced4da',
                     borderRadius: '8px',
                     backgroundColor: 'white',
                     color: '#495057',
                     fontSize: '1rem',
                     fontWeight: '500',
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '0.5rem'
                   }}
                 >
                   <Clock size={18} />
                   Schedule for Later
                 </button>
               </div>
 
               {/* Cost Estimate */}
               <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                 <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>
                   Cost Estimate
                 </h4>
 
                 <div style={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   gap: '1rem',
                   padding: '1rem',
                   backgroundColor: '#f8f9fa',
                   borderRadius: '8px',
                   marginBottom: '1rem'
                 }}>
                   <div style={{
                     width: '40px',
                     height: '40px',
                     borderRadius: '8px',
                     backgroundColor: '#e0e7ff',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center'
                   }}>
                     <DollarSign size={24} color="#4f46e5" />
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                       Per Day
                     </div>
                     <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                       <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>~$20</span>
                     </div>
                   </div>
                 </div>
 
                 <div style={{ fontSize: '0.875rem', color: '#6c757d', lineHeight: '1.5' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <span>Call Duration (avg):</span>
                     <span style={{ fontWeight: '500', color: '#1f2937' }}>2 min</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <span>Rate per Minute:</span>
                     <span style={{ fontWeight: '500', color: '#1f2937' }}>$0.02</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <span>Expected Calls/Day:</span>
                     <span style={{ fontWeight: '500', color: '#1f2937' }}>~500</span>
                   </div>
                 </div>
               </div>
 
               {/* Campaign Stats Preview */}
               <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                   <TrendingUp size={20} color="#4f46e5" />
                   <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                     Expected Performance
                   </h4>
                 </div>
 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <div style={{ 
                     padding: '0.75rem',
                     backgroundColor: '#f8f9fa',
                     borderRadius: '8px'
                   }}>
                     <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Contact Rate</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>~65%</div>
                   </div>
                   <div style={{ 
                     padding: '0.75rem',
                     backgroundColor: '#f8f9fa',
                     borderRadius: '8px'
                   }}>
                     <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Estimated Duration</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>3-5 days</div>
                   </div>
                   <div style={{ 
                     padding: '0.75rem',
                     backgroundColor: '#f8f9fa',
                     borderRadius: '8px'
                   }}>
                     <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>Calls per Hour</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>~20</div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}
 
         {/* Bottom Navigation */}
         <div style={{ 
           display: 'flex', 
           justifyContent: 'space-between',
           marginTop: '2rem',
           paddingTop: '1.5rem',
           borderTop: '1px solid #e9ecef'
         }}>
           <button
             onClick={() => activeStep > 1 && setActiveStep(activeStep - 1)}
             disabled={activeStep === 1}
             style={{
               display: 'flex',
               alignItems: 'center',
               gap: '0.5rem',
               padding: '0.75rem 1.5rem',
               border: '1px solid #ced4da',
               borderRadius: '8px',
               backgroundColor: 'white',
               fontSize: '1rem',
               fontWeight: '500',
               color: activeStep === 1 ? '#adb5bd' : '#495057',
               cursor: activeStep === 1 ? 'not-allowed' : 'pointer'
             }}
           >
             <ChevronLeft size={20} />
             Back
           </button>
 
           <div style={{ display: 'flex', gap: '1rem' }}>
             <button
               onClick={() => router.push('/ai-ml/campaigns')}
               style={{
                 padding: '0.75rem 1.5rem',
                 border: '1px solid #ced4da',
                 borderRadius: '8px',
                 backgroundColor: 'white',
                 fontSize: '1rem',
                 fontWeight: '500',
                 color: '#495057',
                 cursor: 'pointer'
               }}
             >
               Cancel
             </button>
             {activeStep < 4 && (
               <button
                 onClick={() => setActiveStep(activeStep + 1)}
                 style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.5rem',
                   padding: '0.75rem 1.5rem',
                   border: 'none',
                   borderRadius: '8px',
                   backgroundColor: '#0d6efd',
                   fontSize: '1rem',
                   fontWeight: '500',
                   color: 'white',
                   cursor: 'pointer'
                 }}
               >
                 Next
                 <ChevronRight size={20} />
               </button>
             )}
           </div>
         </div>
       </div>
     </div>

    </React.Fragment>
  );
};

EditCampaign.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EditCampaign;
