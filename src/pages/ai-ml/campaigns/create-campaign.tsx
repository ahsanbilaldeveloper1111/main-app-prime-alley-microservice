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

import { CreateCampaign, ListVoiceBots } from "@utils/aiml";
import { toast } from "react-toastify";
import { useRouter } from 'next/router';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import parsePhoneNumber from "libphonenumber-js";
import { 
    DollarSign, 
    Phone, 
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Clock,
    Rocket,
    CheckCircle2,
    XCircle,
    Edit2,
    Upload,
    TrendingUp,
    Users
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
  

const CustomerDashboard = () => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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

  const handleInputChange = (field: keyof CampaignData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fetch voice bots for dropdown
  const fetchVoiceBots = useCallback(async () => {
    setIsLoadingBots(true);
    try {
      const response = await ListVoiceBots();
      const botsData = response?.results?.data || response?.bots || response?.data || [];
      setVoiceBots(botsData);
      // Set default bot if available
      if (botsData.length > 0 && !formData.botProfile) {
        handleInputChange('botProfile', botsData[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching voice bots:', error);
    } finally {
      setIsLoadingBots(false);
    }
  }, []);

  useEffect(() => {
    fetchVoiceBots();
  }, [fetchVoiceBots]);

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
    if (!formData.campaignName) {
      toast.error('Please enter a campaign name');
      return;
    }

    if (!formData.botProfile) {
      toast.error('Please select a bot profile');
      return;
    }

    if (!uploadedFile && !manualNumbers && uploadedContacts === 0) {
      toast.error('Please upload a contacts file or enter phone numbers');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        voice_bot_id: Number.parseInt(formData.botProfile, 10),
        name: formData.campaignName,
        description: formData.clientId || '',
        context: '', // Will be set from step 2
        status: 'active',
      };

      // Add optional fields
      if (formData.clientId) payload.client_id = formData.clientId;
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

      // Handle file upload or manual numbers
      if (uploadedFile) {
        payload.numbers_file = uploadedFile;
        await CreateCampaign(payload, true);
      } else if (manualNumbers) {
        payload.numbers_to_call = manualNumbers;
        await CreateCampaign(payload, false);
      } else {
        toast.error('Please provide phone numbers');
        return;
      }

      // Success - redirect to campaigns list
      //toast.success('Campaign created successfully');
      router.push('/ai-ml/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />

      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
       
       {/* Page Content */}
       <div style={{  }}>
         {/* Page Header */}
         <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', color: '#1f2937' }}>
           Create Campaign
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
 
         {/* Main Content */}
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
                     tabIndex={1}
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
                       {new Array(30).fill(null).map((_, i) => (
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
 
               {/* Right Column */}
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
                       fontWeight: '600',
                       flexShrink: 0
                     }}>
                       {formData.owner ? formData.owner.charAt(0).toUpperCase() : ''}
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
 
             {/* Campaign Summary Card */}
             <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
               <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>
                 Campaign Summary
               </h4>
 
               {/* Estimated Cost */}
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: '1rem',
                 padding: '1rem',
                 backgroundColor: '#f8f9fa',
                 borderRadius: '8px',
                 marginBottom: '1.5rem'
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
                     Estimated Cost
                   </div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                     <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>~$20</span>
                     <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>/ day</span>
                   </div>
                 </div>
               </div>
 
               {/* Recommend Compliance */}
               <div style={{ marginBottom: '1.5rem' }}>
                 <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                   Recommend Compliance
                 </h5>
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <div style={{
                       width: '20px',
                       height: '20px',
                       borderRadius: '50%',
                       backgroundColor: '#d1fae5',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center'
                     }}>
                       <span style={{ color: '#059669', fontSize: '0.75rem' }}>✓</span>
                     </div>
                     <span style={{ fontSize: '0.95rem', color: '#495057' }}>Recording Consent</span>
                   </div>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                         backgroundColor: formData.recordingConsent ? '#0dcaf0' : '#ced4da',
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
                         backgroundColor: formData.recordingConsent ? '#0d6efd' : '#ced4da',
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
 
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <div style={{
                       width: '20px',
                       height: '20px',
                       borderRadius: '50%',
                       backgroundColor: '#d1fae5',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center'
                     }}>
                       <span style={{ color: '#059669', fontSize: '0.75rem' }}>✓</span>
                     </div>
                     <span style={{ fontSize: '0.95rem', color: '#495057' }}>DNCR Check</span>
                   </div>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                         backgroundColor: formData.dncrCheck ? '#0dcaf0' : '#ced4da',
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
                         backgroundColor: formData.dncrCheck ? '#0d6efd' : '#ced4da',
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
 
               {/* Recommended Defaults */}
               <div style={{ marginBottom: '1.5rem' }}>
                 <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                   Recommended Defaults
                 </h5>
 
                 <div style={{ 
                   display: 'flex', 
                   justifyContent: 'space-between', 
                   alignItems: 'center',
                   marginBottom: '0.75rem'
                 }}>
                   <span style={{ fontSize: '0.95rem', color: '#6c757d' }}>Max Concurrency</span>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                     <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>{formData.concurrency}</span>
                     <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Parallel Calls</span>
                   </div>
                 </div>
 
                 <div style={{ 
                   display: 'flex', 
                   justifyContent: 'space-between', 
                   alignItems: 'center',
                   marginBottom: '0.75rem'
                 }}>
                   <span style={{ fontSize: '0.95rem', color: '#6c757d' }}>Call Rate Limit</span>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                     <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>60</span>
                     <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Calls / Minute</span>
                   </div>
                 </div>
 
                 <div style={{ marginTop: '1rem' }}>
                   <div style={{ 
                     display: 'flex', 
                     justifyContent: 'space-between', 
                     alignItems: 'center',
                     marginBottom: '0.75rem'
                   }}>
                     <span style={{ fontSize: '0.95rem', color: '#6c757d' }}>Dialer Strategy</span>
                     <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>(recommended)</span>
                   </div>
 
                   {/* Pie Chart */}
                   <div style={{ position: 'relative', marginBottom: '1rem' }}>
                     <svg width="180" height="180" viewBox="0 0 180 180" style={{ margin: '0 auto', display: 'block' }}>
                       <circle cx="90" cy="90" r="70" fill="none" stroke="#e9ecef" strokeWidth="30" />
                       <circle 
                         cx="90" 
                         cy="90" 
                         r="70" 
                         fill="none" 
                         stroke="#4f46e5" 
                         strokeWidth="30"
                         strokeDasharray="308 440"
                         strokeDashoffset="0"
                         transform="rotate(-90 90 90)"
                       />
                       <circle 
                         cx="90" 
                         cy="90" 
                         r="70" 
                         fill="none" 
                         stroke="#06b6d4" 
                         strokeWidth="30"
                         strokeDasharray="132 440"
                         strokeDashoffset="-308"
                         transform="rotate(-90 90 90)"
                       />
                     </svg>
                   </div>
 
                   {/* Phone Numbers */}
                   <div style={{ 
                     display: 'flex', 
                     flexDirection: 'column', 
                     gap: '0.75rem',
                     backgroundColor: '#f8f9fa',
                     padding: '1rem',
                     borderRadius: '8px'
                   }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <div style={{
                         width: '32px',
                         height: '32px',
                         borderRadius: '50%',
                         backgroundColor: '#4f46e5',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center'
                       }}>
                         <Phone size={18} color="white" />
                       </div>
                       <span style={{ fontSize: '0.95rem', color: '#495057' }}>+1 (987) 123-456</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <div style={{
                         width: '32px',
                         height: '32px',
                         borderRadius: '50%',
                         backgroundColor: '#4f46e5',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center'
                       }}>
                         <Phone size={18} color="white" />
                       </div>
                       <span style={{ fontSize: '0.95rem', color: '#495057' }}>+1 (987) 654-321</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <div style={{
                         width: '32px',
                         height: '32px',
                         borderRadius: '50%',
                         backgroundColor: '#e0e7ff',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center'
                       }}>
                         <Phone size={18} color="#4f46e5" />
                       </div>
                       <span style={{ fontSize: '0.95rem', color: '#6c757d' }}>Callflam Soon</span>
                     </div>
                   </div>
                 </div>
               </div>
 
               {/* Stats */}
               <div style={{ 
                 display: 'grid', 
                 gridTemplateColumns: '1fr 1fr',
                 gap: '0.75rem',
                 marginTop: '1.5rem'
               }}>
                 <div style={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   gap: '0.5rem',
                   padding: '0.75rem',
                   backgroundColor: '#f8f9fa',
                   borderRadius: '8px'
                 }}>
                   <BarChart3 size={20} color="#4f46e5" />
                   <div>
                     <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>{formData.concurrency}</div>
                     <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Parallel Calls</div>
                   </div>
                 </div>
                 <div style={{ 
                   display: 'flex', 
                   alignItems: 'center', 
                   gap: '0.5rem',
                   padding: '0.75rem',
                   backgroundColor: '#f8f9fa',
                   borderRadius: '8px'
                 }}>
                   <Clock size={20} color="#4f46e5" />
                   <div>
                     <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>60</div>
                     <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Calls / Minute</div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
         )}
 
         {activeStep === 2 && <ContextScriptScreen />}
 
         {activeStep === 3 && <CallSettingsScreen />}
 
         {activeStep === 4 && (
           <div style={{ display: 'flex', gap: '2rem' }}>
             {/* Main Review Section */}
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
                       {voiceBots.find(b => b.id.toString() === formData.botProfile)?.bot_name || voiceBots.find(b => b.id.toString() === formData.botProfile)?.name || formData.botProfile || 'Not selected'}
                     </p>
                   </div>
                   <div>
                     <label style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Owner</label>
                     <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>{formData.owner}</p>
                   </div>
                   <div>
                     <label style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Dialer Strategy</label>
                     <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>{formData.dialerStrategy}</p>
                   </div>
                 </div>
               </div>
 
               {/* Script Preview */}
               <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                   <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                     Call Script Preview
                   </h3>
                   <button
                     onClick={() => setActiveStep(2)}
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
 
                 <div style={{ display: 'flex', gap: '1.5rem' }}>
                   {/* Script Content */}
                   <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #4f46e5' }}>
                     <div style={{ marginBottom: '1rem' }}>
                       <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Opening</span>
                       <p style={{ fontSize: '0.95rem', color: '#1f2937', marginTop: '0.5rem', lineHeight: '1.6' }}>
                         "Hello, this is {formData.botProfile} calling from our customer success team. Am I speaking with [Contact Name]?"
                       </p>
                     </div>
                     <div style={{ marginBottom: '1rem' }}>
                       <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Main Message</span>
                       <p style={{ fontSize: '0.95rem', color: '#1f2937', marginTop: '0.5rem', lineHeight: '1.6' }}>
                         "We're conducting a brief follow-up survey about your recent experience. This will only take 2-3 minutes. Is now a good time?"
                       </p>
                     </div>
                     <div>
                       <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transfer Trigger</span>
                       <p style={{ fontSize: '0.95rem', color: '#1f2937', marginTop: '0.5rem', lineHeight: '1.6' }}>
                         If customer requests human agent or expresses concern → Transfer to {formData.transferCallsTo}
                       </p>
                     </div>
                   </div>
 
                   {/* Script Stats */}
                   <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                         <Clock size={18} color="#0369a1" />
                         <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Avg Call Duration</div>
                       </div>
                       <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0369a1' }}>2:30</div>
                     </div>
                     <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                         <CheckCircle2 size={18} color="#15803d" />
                         <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Success Keywords</div>
                       </div>
                       <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#15803d' }}>8</div>
                     </div>
                     <div style={{ padding: '1rem', backgroundColor: '#fef9c3', borderRadius: '8px', border: '1px solid #fde047' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                         <TrendingUp size={18} color="#b45309" />
                         <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Fallback Paths</div>
                       </div>
                       <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#b45309' }}>3</div>
                     </div>
                   </div>
                 </div>
               </div>
 
               {/* Contact Information */}
               <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <Users size={24} color="#4f46e5" />
                     <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                       Contact List & Breakdown
                     </h3>
                   </div>
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
 
                 <div style={{ display: 'flex', gap: '1.5rem' }}>
                   {/* File Upload Info */}
                   <div style={{ flex: '0 0 320px', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                     <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '8px' }}>
                       <Upload size={32} color="#4f46e5" />
                     </div>
                     <div>
                       <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>{uploadedFileName || 'contacts_final.csv'}</div>
                       <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>{uploadedContacts.toLocaleString()} total contacts</div>
                       <div style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>{validContacts.toLocaleString()} valid numbers</div>
                     </div>
                   </div>
 
                   {/* Contact Breakdown */}
                   <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                     <div style={{ padding: '1.25rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                         <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Mobile Numbers</span>
                         <Phone size={18} color="#0369a1" />
                       </div>
                       <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0369a1' }}>{Math.floor(validContacts * 0.75).toLocaleString()}</div>
                       <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>75% of total</div>
                     </div>
                     <div style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                         <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Landline Numbers</span>
                         <Phone size={18} color="#15803d" />
                       </div>
                       <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#15803d' }}>{Math.floor(validContacts * 0.25).toLocaleString()}</div>
                       <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>25% of total</div>
                     </div>
                     <div style={{ padding: '1.25rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                         <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>DNC Filtered</span>
                         <XCircle size={18} color="#dc2626" />
                       </div>
                       <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#dc2626' }}>{(uploadedContacts - validContacts).toLocaleString()}</div>
                       <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Will be excluded</div>
                     </div>
                   </div>
                 </div>
               </div>
 
               {/* Call Settings */}
               <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                   <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                     Call Settings
                   </h3>
                   <button
                     onClick={() => setActiveStep(3)}
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
                     <label style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Concurrency</label>
                     <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>{formData.concurrency} Parallel Calls</p>
                   </div>
                   <div>
                     <label style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Schedule</label>
                     <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>{formData.scheduleStart}</p>
                   </div>
                   <div>
                     <label style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Timezone</label>
                     <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>{formData.timezone}</p>
                   </div>
                   <div>
                     <label style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' }}>Transfer Calls To</label>
                     <p style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '500' }}>
                       {transferCallsEnabled ? formData.transferCallsTo : 'Disabled'}
                     </p>
                   </div>
                 </div>
 
                 {/* Compliance Settings */}
                 <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e9ecef' }}>
                   <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>Compliance</h4>
                   <div style={{ display: 'flex', gap: '2rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       {formData.recordingConsent ? (
                         <CheckCircle2 size={20} color="#059669" />
                       ) : (
                         <XCircle size={20} color="#dc2626" />
                       )}
                       <span style={{ fontSize: '0.95rem', color: '#495057' }}>Recording Consent</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       {formData.dncrCheck ? (
                         <CheckCircle2 size={20} color="#059669" />
                       ) : (
                         <XCircle size={20} color="#dc2626" />
                       )}
                       <span style={{ fontSize: '0.95rem', color: '#495057' }}>DNCR Check</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       {formData.dncCompliance ? (
                         <CheckCircle2 size={20} color="#059669" />
                       ) : (
                         <XCircle size={20} color="#dc2626" />
                       )}
                       <span style={{ fontSize: '0.95rem', color: '#495057' }}>DNC Compliance</span>
                     </div>
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
                   {isSubmitting ? 'Creating Campaign...' : 'Launch Campaign'}
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
               Save Draft
             </button>
                {activeStep === 4 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: isSubmitting ? '#6c757d' : '#198754',
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: 'white',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting ? 'Creating...' : 'Launch Campaign'}
                    <Rocket size={20} />
                  </button>
                ) : (
                  <button
                    onClick={() => activeStep < 4 && setActiveStep(activeStep + 1)}
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

CustomerDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CustomerDashboard;
