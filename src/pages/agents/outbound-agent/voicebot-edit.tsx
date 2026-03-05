import "@assets/scss/datatable-style.scss";
import React, { useState, ReactElement, useEffect, useCallback } from 'react';
import { Phone, ChevronDown, Check, Play, MoreVertical, FileText, Mic, Shield, PlayCircle } from 'lucide-react';
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import axiosInstance from "@utils/axios";
import { UpdateVoiceBot, GetVoiceBotById } from "@utils/aiml";
import { toast } from "react-toastify";
import { useRouter } from 'next/router';

interface Trunk {
  sip_trunk_id: string;
  name: string;
  address: string;
  numbers: string[];
}

const VoiceBotEdit = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState('basics');
  const [isLoadingBot, setIsLoadingBot] = useState<boolean>(false);
  const [botName, setBotName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('Description');
  const [category, setCategory] = useState('Acquisition');
  const [owner, setOwner] = useState('Tiffany Reid');
  const [status, setStatus] = useState('active');
  const [trunk, setTrunk] = useState('');
  const [callerId, setCallerId] = useState('');
  const [region, setRegion] = useState('United States');
  const [ttsProvider, setTtsProvider] = useState('Google Cloud TTS');
  const [languageCode, setLanguageCode] = useState('en-US-Wavenet-G');
  const [voice, setVoice] = useState('en-US-Wavenet-G (Male)');
  const [greetingPrompt, setGreetingPrompt] = useState('Hello, this is the RingEdge support bot. How can I assist you today?');
  const [systemPrompt, setSystemPrompt] = useState('Default System Context');
  const [concurrency, setConcurrency] = useState('Max 10 Calls');
  const [timezone, setTimezone] = useState('Pacific Time');
  const [businessHours, setBusinessHours] = useState('0 Selected');
  const [completeContext, setCompleteContext] = useState(true);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [dncrCheck, setDncrCheck] = useState(false);
  const [callbackWaiting, setCallbackWaiting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedValidation, setExpandedValidation] = useState<string | null>(null);
  
  // API-related states
  const [trunks, setTrunks] = useState<Trunk[]>([]);
  const [isLoadingTrunks, setIsLoadingTrunks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTrunkData, setSelectedTrunkData] = useState<Trunk | null>(null);
  const [originalBotData, setOriginalBotData] = useState<any>(null);

  // Fetch trunks from API
  const fetchTrunks = useCallback(async () => {
    setIsLoadingTrunks(true);
    try {
      const response = await axiosInstance.get('aiml/list-trunks');
      const received = (response?.data?.trunks ?? []).map((trunk: Trunk) => ({
        ...trunk,
        numbers: Array.isArray(trunk.numbers) ? trunk.numbers : [],
      }));
      setTrunks(received);
      // Only set default trunk if we're in create mode (no id) and no trunk is selected
      if (received.length > 0 && !id) {
        setTrunk(prevTrunk => {
          if (!prevTrunk && received.length > 0) {
            const firstTrunk = received[0];
            setSelectedTrunkData(firstTrunk);
            // Set default caller ID from first trunk's numbers if available
            if (firstTrunk.numbers && firstTrunk.numbers.length > 0) {
              setCallerId(firstTrunk.numbers[0]);
            }
            return firstTrunk.sip_trunk_id;
          }
          return prevTrunk;
        });
      }
    } catch (error) {
      console.error('Error fetching trunks:', error);
      toast.error('Failed to fetch trunks');
    } finally {
      setIsLoadingTrunks(false);
    }
  }, []);

  // Convert business hours object to string format for display
  const formatBusinessHours = (businessHoursObj: any): string => {
    if (!businessHoursObj || typeof businessHoursObj !== 'object') {
      return '0 Selected';
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const enabledDays = days.filter(day => businessHoursObj[day]?.enabled);
    
    if (enabledDays.length === 0) {
      return '0 Selected';
    }

    // Check if it's 24/7 (all days, 00:00-23:59)
    const is247 = enabledDays.length === 7 && 
      days.every(day => {
        const dayHours = businessHoursObj[day];
        return dayHours?.enabled && dayHours.start === '00:00' && dayHours.end === '23:59';
      });
    if (is247) return '24/7';

    // Check for common patterns
    const firstDay = businessHoursObj[enabledDays[0]];
    const allSame = enabledDays.every(day => {
      const dayHours = businessHoursObj[day];
      return dayHours?.start === firstDay.start && dayHours?.end === firstDay.end;
    });

    if (allSame) {
      if (enabledDays.length === 5 && !enabledDays.includes('saturday') && !enabledDays.includes('sunday')) {
        if (firstDay.start === '09:00' && firstDay.end === '17:00') return 'Business Hours';
        if (firstDay.start === '08:00' && firstDay.end === '20:00') return 'Extended Hours';
      }
      if (enabledDays.length === 7 && firstDay.start === '09:00' && firstDay.end === '18:00') {
        return 'Weekend Included';
      }
    }

    return 'Custom Schedule';
  };

  // Load bot data
  const fetchBotData = useCallback(async () => {
    if (!id) return;

    // Handle query parameter type (can be string or string[])
    const botId = Array.isArray(id) ? id[0] : id;
    if (!botId) return;

    setIsLoadingBot(true);
    try {
      const botData = await GetVoiceBotById(botId);
      if (botData) {
        // Store original data for comparison
        setOriginalBotData(botData);
        
        setBotName(botData.bot_name || '');
        setDescription(botData.description || '');
        setTags(botData.tags || 'Description');
        setCategory(botData.category || 'Acquisition');
        setOwner(botData.owner || 'Tiffany Reid');
        setStatus(botData.status || 'active');
        setTrunk(botData.trunk || '');
        setCallerId(botData.caller_id || '');
        setRegion(botData.region || 'United States');
        setTtsProvider(botData.tts_provider || 'Google Cloud TTS');
        setLanguageCode(botData.voice_model || 'en-US-Wavenet-G');
        setVoice(botData.voice_type || 'en-US-Wavenet-G (Male)');
        setGreetingPrompt(botData.greeting_prompt || '');
        setSystemPrompt(botData.system_prompt || '');
        setConcurrency(`Max ${botData.concurrency_limit || 10} Calls`);
        setTimezone(botData.timezone || 'Pacific Time');
        setBusinessHours(formatBusinessHours(botData.business_hours));
        setCompleteContext(botData.complete_context ?? true);
        setRecordingConsent(botData.recording_consent ?? false);
        setDncrCheck(botData.dnc_registry_check ?? false);
        setCallbackWaiting(botData.callback_waiting ?? false);
      }
    } catch (error) {
      console.error('Error fetching bot data:', error);
      toast.error('Failed to load bot data');
    } finally {
      setIsLoadingBot(false);
    }
  }, [id]);

  // Load trunks and bot data on mount
  useEffect(() => {
    fetchTrunks();
    if (id) {
      fetchBotData();
    }
  }, [fetchTrunks, fetchBotData, id]);

  // Update selected trunk data when trunk changes
  useEffect(() => {
    const selectedTrunk = trunks.find(t => t.sip_trunk_id === trunk);
    setSelectedTrunkData(selectedTrunk || null);
    // Update caller ID when trunk changes
    if (selectedTrunk && selectedTrunk.numbers && selectedTrunk.numbers.length > 0) {
      if (!callerId || !selectedTrunk.numbers.includes(callerId)) {
        setCallerId(selectedTrunk.numbers[0]);
      }
    }
  }, [trunk, trunks]);

  // Parse business hours from string to object format
  const parseBusinessHours = (hoursString: string): Record<string, any> | null => {
    if (hoursString === '0 Selected' || !hoursString) {
      return null;
    }

    // Handle predefined options
    if (hoursString === '24/7') {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const hours: Record<string, any> = {};
      days.forEach(day => {
        hours[day] = { enabled: true, start: '00:00', end: '23:59' };
      });
      return hours;
    }

    if (hoursString === 'Business Hours') {
      return {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
      };
    }

    if (hoursString === 'Extended Hours') {
      return {
        monday: { enabled: true, start: '08:00', end: '20:00' },
        tuesday: { enabled: true, start: '08:00', end: '20:00' },
        wednesday: { enabled: true, start: '08:00', end: '20:00' },
        thursday: { enabled: true, start: '08:00', end: '20:00' },
        friday: { enabled: true, start: '08:00', end: '20:00' },
      };
    }

    if (hoursString === 'Weekend Included') {
      return {
        monday: { enabled: true, start: '09:00', end: '18:00' },
        tuesday: { enabled: true, start: '09:00', end: '18:00' },
        wednesday: { enabled: true, start: '09:00', end: '18:00' },
        thursday: { enabled: true, start: '09:00', end: '18:00' },
        friday: { enabled: true, start: '09:00', end: '18:00' },
        saturday: { enabled: true, start: '09:00', end: '18:00' },
        sunday: { enabled: true, start: '09:00', end: '18:00' },
      };
    }

    // For custom schedule, return null (would need custom UI to configure)
    if (hoursString === 'Custom Schedule') {
      return null;
    }

    return null;
  };

  // Extract concurrency limit number from string
  const getConcurrencyLimit = (concurrencyString: string): number => {
    const regex = /\d+/;
    const match = regex.exec(concurrencyString);
    return match ? Number.parseInt(match[0], 10) : 10;
  };

  // Compare current values with original values and return only changed fields
  const getChangedFields = (saveAsDraft: boolean = false): any => {
    if (!originalBotData) {
      // If no original data, return all fields (shouldn't happen in edit mode)
      return {};
    }

    const payload: any = {};
    const cleanCategory = category ? category.replace(/📁/g, '').trim() : undefined;
    const currentConcurrency = getConcurrencyLimit(concurrency);
    const businessHoursObj = parseBusinessHours(businessHours);
    const originalBusinessHours = originalBotData.business_hours || null;

    // Compare each field
    if (botName.trim() !== (originalBotData.bot_name || '')) {
      payload.bot_name = botName.trim();
    }

    if (description.trim() !== (originalBotData.description || '')) {
      payload.description = description.trim();
    }

    if (cleanCategory !== (originalBotData.category || '')) {
      payload.category = cleanCategory;
    }

    if (tags !== (originalBotData.tags || '')) {
      payload.tags = tags;
    }

    if (owner !== (originalBotData.owner || '')) {
      payload.owner = owner;
    }

    const newStatus = saveAsDraft ? 'draft' : status.toLowerCase();
    if (newStatus !== (originalBotData.status || '')) {
      payload.status = newStatus;
    }

    if (trunk !== (originalBotData.trunk || '')) {
      payload.trunk = trunk;
    }

    if (callerId !== (originalBotData.caller_id || '')) {
      payload.caller_id = callerId;
    }

    if (region !== (originalBotData.region || '')) {
      payload.region = region;
    }

    if (ttsProvider !== (originalBotData.tts_provider || '')) {
      payload.tts_provider = ttsProvider;
    }

    if (languageCode !== (originalBotData.voice_model || '')) {
      payload.voice_model = languageCode;
    }

    if (voice !== (originalBotData.voice_type || '')) {
      payload.voice_type = voice;
    }

    if (greetingPrompt !== (originalBotData.greeting_prompt || '')) {
      payload.greeting_prompt = greetingPrompt;
    }

    if (systemPrompt !== (originalBotData.system_prompt || '')) {
      payload.system_prompt = systemPrompt;
    }

    if (currentConcurrency !== (originalBotData.concurrency_limit || 10)) {
      payload.concurrency_limit = currentConcurrency;
    }

    if (timezone !== (originalBotData.timezone || '')) {
      payload.timezone = timezone;
    }

    if (completeContext !== (originalBotData.complete_context ?? true)) {
      payload.complete_context = completeContext;
    }

    if (recordingConsent !== (originalBotData.recording_consent ?? false)) {
      payload.recording_consent = recordingConsent;
    }

    if (dncrCheck !== (originalBotData.dnc_registry_check ?? false)) {
      payload.dnc_registry_check = dncrCheck;
    }

    if (callbackWaiting !== (originalBotData.callback_waiting ?? false)) {
      payload.callback_waiting = callbackWaiting;
    }

    // Compare business hours (deep comparison)
    const originalBHStr = originalBusinessHours ? JSON.stringify(originalBusinessHours) : 'null';
    const currentBHStr = businessHoursObj ? JSON.stringify(businessHoursObj) : 'null';
    
    if (currentBHStr !== originalBHStr) {
      if (businessHoursObj) {
        payload.business_hours = businessHoursObj;
      } else {
        // If business hours was removed, send null
        payload.business_hours = null;
      }
    }

    return payload;
  };

  // Handle form submission
  const handleSubmit = async (saveAsDraft: boolean = false) => {
    // Validation
    if (!botName.trim()) {
      toast.error('Bot name is required');
      return;
    }

    if (!trunk) {
      toast.error('Please select a trunk');
      return;
    }

    if (!callerId) {
      toast.error('Please select a caller ID');
      return;
    }

      // Handle query parameter type (can be string or string[])
      const botId = Array.isArray(id) ? id[0] : id;
      if (!botId) {
        toast.error('Bot ID is missing');
        return;
      }

      setIsSubmitting(true);

      try {
        // Get only changed fields
        const payload = getChangedFields(saveAsDraft);

        // If no fields changed, show message and return
        if (Object.keys(payload).length === 0) {
          toast.info('No changes detected');
          setIsSubmitting(false);
          return;
        }

        const response = await UpdateVoiceBot(botId, payload);

      if (response && response.status) {
        // Navigate back to profiles list
        router.push('/ai-ml/profiles');
      }
    } catch (error: any) {
      console.error('Error updating voice bot:', error);
      // Error handling is done in UpdateVoiceBot function
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push('/ai-ml/profiles');
  };

  // Dynamic validation logic
  const validationItems = [
    { 
      id: 'campaign',
      label: 'Campaign Validation', 
      checked: botName.length > 0 && description.length > 0,
      message: botName.length > 0 && description.length > 0 
        ? 'Bot name and description are provided' 
        : 'Please provide bot name and description'
    },
    { 
      id: 'tts',
      label: 'TTS Provider', 
      checked: ttsProvider.length > 0 && languageCode.length > 0,
      message: ttsProvider.length > 0 && languageCode.length > 0
        ? `Using ${ttsProvider} with model ${languageCode}`
        : 'Please select TTS provider and voice model'
    },
    { 
      id: 'prompts',
      label: 'Prompts Configuration', 
      checked: greetingPrompt.length > 0 && systemPrompt.length > 0,
      message: greetingPrompt.length > 0 && systemPrompt.length > 0
        ? 'Greeting and system prompts are configured'
        : 'Please configure greeting and system prompts'
    },
    { 
      id: 'region',
      label: 'Region & Telephony', 
      checked: region.length > 0 && callerId.length > 0 && trunk.length > 0,
      message: region.length > 0 && callerId.length > 0 && trunk.length > 0
        ? `Configured for ${region} with caller ID ${callerId}`
        : 'Please select region, trunk, and caller ID'
    },
    { 
      id: 'business',
      label: 'Business Hours', 
      checked: businessHours !== '0 Selected',
      message: businessHours !== '0 Selected'
        ? `Set to: ${businessHours}`
        : 'Please configure business hours'
    }
  ];

  const tabs = [
    { id: 'basics', label: 'Basics', icon: FileText },
    { id: 'telephony', label: 'Telephony', icon: Phone },
    { id: 'voice', label: 'Voice & Language', icon: Mic },
    { id: 'behavior', label: 'Behavior & Safety', icon: Shield },
    { id: 'test', label: 'Test & Save', icon: PlayCircle }
  ];

  const handleRunTest = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 3000);
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Edit Voice Bot" />

      <PageHeader
        title="Edit Voice Bot"
        showSearch={false}
      />

      {/* Tab Navigation */}
      <div style={{ backgroundColor: 'white',  borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === tab.id ? '#667eea' : '#9ca3af',
                fontWeight: activeTab === tab.id ? 600 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: activeTab === tab.id ? '#667eea' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <tab.icon size={14} color={activeTab === tab.id ? 'white' : '#9ca3af'} />
              </div>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 0' }}>
        <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>
          {/* Left Column - Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Combined Sections Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {/* Basics Section */}
              <div style={{ paddingBottom: '24px', borderBottom: '1px solid #f3f4f6' }}>
                <h6 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Basics:</h6>
                
                <div className="basics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Bot Name:
                    </label>
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Description:
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Tags:
                    </label>
                    <select
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#9ca3af',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option>Description</option>
                      <option>Support</option>
                      <option>Sales</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Category:
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Acquisition">📁 Acquisition</option>
                      <option value="Sales">📁 Sales</option>
                      <option value="Support">📁 Support</option>
                      <option value="Customer Service">📁 Customer Service</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Owner:
                    </label>
                    <select
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option>Tiffany Reid</option>
                      <option>John Doe</option>
                      <option>Jane Smith</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: status === 'active' ? '#059669' : status === 'inactive' ? '#6b7280' : status === 'draft' ? '#d97706' : '#3b82f6',
                        backgroundColor: status === 'active' ? '#d1fae5' : status === 'inactive' ? '#f3f4f6' : status === 'draft' ? '#fef3c7' : '#dbeafe',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="active">✓ Active</option>
                      <option value="inactive">○ Inactive</option>
                      <option value="draft">✎ Draft</option>
                      <option value="testing">⚡ Testing</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Telephony Section */}
              <div style={{ paddingTop: '24px', paddingBottom: '24px', borderBottom: '1px solid #f3f4f6' }}>
                <h6 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Telephony</h6>
                
                <div className="telephony-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Trunk:
                    </label>
                    <select
                      value={trunk}
                      onChange={(e) => setTrunk(e.target.value)}
                      disabled={isLoadingTrunks}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        backgroundColor: isLoadingTrunks ? '#f3f4f6' : 'white',
                        cursor: isLoadingTrunks ? 'not-allowed' : 'pointer',
                        opacity: isLoadingTrunks ? 0.6 : 1
                      }}
                    >
                      {isLoadingTrunks ? (
                        <option>Loading trunks...</option>
                      ) : trunks.length === 0 ? (
                        <option value="">No trunks available</option>
                      ) : (
                        <>
                          <option value="">Select a trunk</option>
                          {trunks.map((t) => (
                            <option key={t.sip_trunk_id} value={t.sip_trunk_id}>
                              {t.name} ({t.sip_trunk_id})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Caller ID:
                    </label>
                    <select
                      value={callerId}
                      onChange={(e) => setCallerId(e.target.value)}
                      disabled={!selectedTrunkData || isLoadingTrunks}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        backgroundColor: !selectedTrunkData ? '#f3f4f6' : 'white',
                        cursor: !selectedTrunkData ? 'not-allowed' : 'pointer',
                        opacity: !selectedTrunkData ? 0.6 : 1
                      }}
                    >
                      {!selectedTrunkData ? (
                        <option value="">Select a trunk first</option>
                      ) : selectedTrunkData.numbers.length === 0 ? (
                        <option value="">No numbers available</option>
                      ) : (
                        <>
                          <option value="">Select caller ID</option>
                          {selectedTrunkData.numbers.map((num) => (
                            <option key={num} value={num}>
                              📞 {num}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Region:
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option>🌐 United States</option>
                      <option>🌐 Canada</option>
                      <option>🌐 United Kingdom</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Voice & Language Section */}
              <div style={{ paddingTop: '24px', paddingBottom: '24px', borderBottom: '1px solid #f3f4f6' }}>
                <h6 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Voice & Language</h6>
                
                <div className="voice-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      TTS Provider: <span style={{ fontSize: '11px', color: '#f59e0b' }}>🎯 English</span>
                    </label>
                    <select
                      value={ttsProvider}
                      onChange={(e) => setTtsProvider(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option>Google Cloud TTS</option>
                      <option>Amazon Polly</option>
                      <option>Microsoft Azure TTS</option>
                      <option>OpenAI TTS</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Voice Model:
                    </label>
                    <input
                      type="text"
                      value={languageCode}
                      onChange={(e) => setLanguageCode(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Voice Type:
                    </label>
                    <select
                      value={voice}
                      onChange={(e) => setVoice(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option>en-US-Wavenet-G (Male)</option>
                      <option>en-US-Wavenet-A (Female)</option>
                      <option>en-US-Wavenet-B (Male)</option>
                      <option>en-US-Neural2-C (Female)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Behavior & Safety Section */}
              <div style={{ paddingTop: '24px' }}>
                <h6 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Behavior & Safety</h6>
                
                <div className="behavior-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Greeting Prompt
                    </label>
                    <textarea
                      value={greetingPrompt}
                      onChange={(e) => setGreetingPrompt(e.target.value)}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937',
                        resize: 'vertical'
                      }}
                    />
                    
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                        System Prompt:
                      </label>
                      <input
                        type="text"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#9ca3af'
                        }}
                      />
                    </div>

                    <div className="behavior-toggles" style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>Complete Context</span>
                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                          <input 
                            type="checkbox" 
                            checked={completeContext}
                            onChange={(e) => setCompleteContext(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: completeContext ? '#10b981' : '#cbd5e0',
                            transition: '0.3s',
                            borderRadius: '24px'
                          }}>
                            <span style={{
                              position: 'absolute',
                              height: '18px',
                              width: '18px',
                              left: completeContext ? '23px' : '3px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              transition: '0.3s',
                              borderRadius: '50%'
                            }}></span>
                          </span>
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>Recording Consent</span>
                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                          <input 
                            type="checkbox" 
                            checked={recordingConsent}
                            onChange={(e) => setRecordingConsent(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: recordingConsent ? '#10b981' : '#cbd5e0',
                            transition: '0.3s',
                            borderRadius: '24px'
                          }}>
                            <span style={{
                              position: 'absolute',
                              height: '18px',
                              width: '18px',
                              left: recordingConsent ? '23px' : '3px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              transition: '0.3s',
                              borderRadius: '50%'
                            }}></span>
                          </span>
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>DNC Registry Check</span>
                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                          <input 
                            type="checkbox" 
                            checked={dncrCheck}
                            onChange={(e) => setDncrCheck(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: dncrCheck ? '#10b981' : '#cbd5e0',
                            transition: '0.3s',
                            borderRadius: '24px'
                          }}>
                            <span style={{
                              position: 'absolute',
                              height: '18px',
                              width: '18px',
                              left: dncrCheck ? '23px' : '3px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              transition: '0.3s',
                              borderRadius: '50%'
                            }}></span>
                          </span>
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>Callback Waiting</span>
                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                          <input 
                            type="checkbox" 
                            checked={callbackWaiting}
                            onChange={(e) => setCallbackWaiting(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: callbackWaiting ? '#10b981' : '#cbd5e0',
                            transition: '0.3s',
                            borderRadius: '24px'
                          }}>
                            <span style={{
                              position: 'absolute',
                              height: '18px',
                              width: '18px',
                              left: callbackWaiting ? '23px' : '3px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              transition: '0.3s',
                              borderRadius: '50%'
                            }}></span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                        Concurrency Limit:
                      </label>
                      <select
                        value={concurrency}
                        onChange={(e) => setConcurrency(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#1f2937',
                          backgroundColor: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <option>Max 10 Calls</option>
                        <option>Max 20 Calls</option>
                        <option>Max 50 Calls</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                        Timezone:
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#1f2937',
                          backgroundColor: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <option>Pacific Time</option>
                        <option>Eastern Time</option>
                        <option>Central Time</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                        Business Hours:
                      </label>
                      <select
                        value={businessHours}
                        onChange={(e) => setBusinessHours(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: businessHours === '0 Selected' ? '#9ca3af' : '#1f2937',
                          backgroundColor: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="0 Selected" disabled>Select Business Hours</option>
                        <option value="24/7">24/7 - Always Available</option>
                        <option value="Business Hours">Mon-Fri, 9 AM - 5 PM</option>
                        <option value="Extended Hours">Mon-Fri, 8 AM - 8 PM</option>
                        <option value="Weekend Included">Mon-Sun, 9 AM - 6 PM</option>
                        <option value="Custom Schedule">Custom Schedule</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

      {/* Right Column - Live Preview */}
      <div style={{ position: 'sticky', top: '24px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h6 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Live Preview</h6>
            <MoreVertical size={20} color="#9ca3af" style={{ cursor: 'pointer' }} />
          </div>

          {/* Phone Preview */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            borderRadius: '12px',
            padding: '32px 24px',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <Phone size={32} color="rgba(255,255,255,0.6)" style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                {callerId || 'No Caller ID'}
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                {region || 'No Region'}
              </div>
            </div>

            {/* Waveform Animation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              height: '60px',
              marginBottom: '24px'
            }}>
              {[...new Array(40)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: isPlaying ? `${Math.random() * 50 + 10}px` : '10px',
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: '2px',
                    transition: 'height 0.1s ease',
                    animation: isPlaying ? `wave 0.5s ease-in-out infinite ${i * 0.05}s` : 'none'
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleRunTest}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            >
              <Play size={16} fill="white" />
              Run Quick Test
            </button>
          </div>

          {/* Validation Checklist */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h6 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
                Validation Checklist
              </h6>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {validationItems.filter(item => item.checked).length}/{validationItems.length} Complete
              </span>
            </div>
            {validationItems.map((item, index) => (
              <div
                key={item.id}
                style={{
                  borderBottom: index < validationItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                  paddingBottom: expandedValidation === item.id ? '12px' : '0'
                }}
              >
                <div
                  onClick={() => setExpandedValidation(expandedValidation === item.id ? null : item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: item.checked ? '#d1fae5' : '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      {item.checked ? (
                        <Check size={14} color="#059669" />
                      ) : (
                        <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold' }}>!</span>
                      )}
                    </div>
                    <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    color="#9ca3af" 
                    style={{
                      transform: expandedValidation === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                </div>
                {expandedValidation === item.id && (
                  <div style={{
                    paddingLeft: '30px',
                    paddingRight: '10px',
                    fontSize: '13px',
                    color: item.checked ? '#059669' : '#dc2626',
                    backgroundColor: item.checked ? '#f0fdf4' : '#fef2f2',
                    padding: '8px 12px 8px 30px',
                    borderRadius: '6px',
                    marginTop: '4px',
                    animation: 'fadeIn 0.2s ease-in'
                  }}>
                    {item.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Action Buttons */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '32px',
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <button 
        onClick={handleCancel}
        disabled={isSubmitting}
        style={{
          padding: '10px 24px',
          backgroundColor: 'transparent',
          border: 'none',
          color: '#6b7280',
          fontSize: '14px',
          fontWeight: 500,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: isSubmitting ? 0.6 : 1
        }}
      >
        ← Cancel
      </button>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting || !botName.trim()}
          style={{
            padding: '10px 24px',
            backgroundColor: 'transparent',
            border: '1px solid #e5e7eb',
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '8px',
            cursor: (isSubmitting || !botName.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: (isSubmitting || !botName.trim()) ? 0.6 : 1
          }}
        >
          📄 Save Draft
        </button>

        <button 
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting || !botName.trim()}
          style={{
            padding: '10px 32px',
            backgroundColor: isSubmitting || !botName.trim() ? '#9ca3af' : '#667eea',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '8px',
            cursor: (isSubmitting || !botName.trim()) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting && botName.trim()) {
              e.currentTarget.style.backgroundColor = '#5568d3';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting && botName.trim()) {
              e.currentTarget.style.backgroundColor = '#667eea';
            }
          }}
        >
          {isSubmitting ? 'Updating...' : 'Update & Continue'}
        </button>
      </div>
    </div>
  </div>

  <style>{`
    @keyframes wave {
      0%, 100% {
        height: 10px;
      }
      50% {
        height: 50px;
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    select:focus, input:focus, textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    /* Desktop */
    @media (min-width: 768px) {
      .breadcrumb-desktop {
        display: inline !important;
      }
    }

    /* Tablet */
    @media (max-width: 1200px) {
      .content-grid {
        grid-template-columns: 1fr !important;
      }
    }

    /* Mobile and Tablet */
    @media (max-width: 768px) {
      .basics-grid,
      .telephony-grid,
      .voice-grid,
      .behavior-toggles {
        grid-template-columns: 1fr !important;
      }

      .behavior-main-grid {
        grid-template-columns: 1fr !important;
      }
    }

    /* Small Mobile */
    @media (max-width: 480px) {
      .content-grid {
        padding: 12px !important;
      }
    }
  `}</style>

    </React.Fragment>
  );
};

VoiceBotEdit.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default VoiceBotEdit;
