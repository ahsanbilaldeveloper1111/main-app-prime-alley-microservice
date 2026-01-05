import "@assets/scss/datatable-style.scss";
import React, { useState,ReactElement } from 'react';
import { Settings, HelpCircle, User, Phone, ChevronDown, Check, Play, MoreVertical, Home, FileText, Mic, Shield, PlayCircle } from 'lucide-react';
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";



const VoiceBotCreate = () => {


  const [activeTab, setActiveTab] = useState('basics');
  const [botName, setBotName] = useState('Support Bot');
  const [description, setDescription] = useState('Handles support inquiries');
  const [tags, setTags] = useState('Description');
  const [category, setCategory] = useState('Acquisition');
  const [owner, setOwner] = useState('Tiffany Reid');
  const [status, setStatus] = useState('Active');
  const [trunk, setTrunk] = useState('sipTrunk1');
  const [callerId, setCallerId] = useState('+12223334455');
  const [region, setRegion] = useState('United States');
  const [ttsProvider, setTtsProvider] = useState('Google Cloud TTS');
  const [languageCode, setLanguageCode] = useState('en-US-Wavenet-G');
  const [voice, setVoice] = useState('en-US-Wavenet-G');
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
      checked: region.length > 0 && callerId.length > 0,
      message: region.length > 0 && callerId.length > 0
        ? `Configured for ${region} with caller ID ${callerId}`
        : 'Please select region and caller ID'
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
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Create Voice Bot" />

      <PageHeader
        title="Create Voice Bot"
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
                      <option>📁 Acquisition</option>
                      <option>📁 Sales</option>
                      <option>📁 Support</option>
                      <option>📁 Customer Service</option>
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
                        color: status === 'Active' ? '#059669' : status === 'Inactive' ? '#6b7280' : status === 'Draft' ? '#d97706' : '#3b82f6',
                        backgroundColor: status === 'Active' ? '#d1fae5' : status === 'Inactive' ? '#f3f4f6' : status === 'Draft' ? '#fef3c7' : '#dbeafe',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Active">✓ Active</option>
                      <option value="Inactive">○ Inactive</option>
                      <option value="Draft">✎ Draft</option>
                      <option value="Testing">⚡ Testing</option>
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
                      <option>sipTrunk1</option>
                      <option>sipTrunk2</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                      Caller ID:
                    </label>
                    <select
                      value={callerId}
                      onChange={(e) => setCallerId(e.target.value)}
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
                      <option>📞 +12223334455</option>
                      <option>📞 +19876543210</option>
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
                +1 (222) 333-4455
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                United States
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
              {[...Array(40)].map((_, i) => (
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
      <button style={{
        padding: '10px 24px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#6b7280',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        ← Cancel
      </button>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={{
          padding: '10px 24px',
          backgroundColor: 'transparent',
          border: '1px solid #e5e7eb',
          color: '#6b7280',
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          📄 Save Draft
        </button>

        <button style={{
          padding: '10px 32px',
          backgroundColor: '#667eea',
          border: 'none',
          color: 'white',
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5568d3'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
        >
          Save & Continue
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

VoiceBotCreate.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default VoiceBotCreate;
