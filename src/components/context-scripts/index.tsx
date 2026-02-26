import React, { useState } from 'react';
import {
  Search,
  Upload,
  Plus,
  MoreHorizontal,
  CheckCircle,
  Phone,
  RefreshCw,
  Play,
  Volume2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Variable {
  name: string;
  type: string;
  value?: string;
}

interface ValidationItem {
  label: string;
  checked: boolean;
  hasToggle?: boolean;
}

const ContextScriptScreen: React.FC = () => {
  const [scriptContent, setScriptContent] = useState<string>(
    'Hello, this is the RingEdge support bot. How can I assist you today?'
  );
  const [variables] = useState<Variable[]>([
    { name: 'customer_name', type: 'String', value: 'John Doe' },
    { name: 'account_number', type: 'String', value: 'ACC-12345' },
    { name: 'order_id', type: 'String', value: 'ORD-98765' },
    { name: 'balance', type: 'Number', value: '$1,234.56' }
  ]);
  const [selectedVariable, setSelectedVariable] = useState<string>('');
  const [testUtterance, setTestUtterance] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('script');
  
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([
    { label: 'Script Completeness', checked: true, hasToggle: false },
    { label: 'Recording Consent', checked: true, hasToggle: true },
    { label: 'DNC Registry Check', checked: true, hasToggle: true },
    { label: 'Prompt Validation', checked: false, hasToggle: true }
  ]);

  const utteranceData = [
    { name: 'Greeting', confidence: 95 },
    { name: 'Intent', confidence: 88 },
    { name: 'Entity', confidence: 92 },
    { name: 'Sentiment', confidence: 85 }
  ];

  const toggleValidation = (index: number) => {
    setValidationItems(prev => prev.map((item, i) => 
      i === index ? { ...item, checked: !item.checked } : item
    ));
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '2rem', color: '#1f2937' }}>
        Context & Script Builder
      </h2>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Left Section - Variables */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }}
              />
              <input
                type="text"
                placeholder="Search variables..."
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  backgroundColor: '#f8f9fa'
                }}
              />
            </div>

            {/* Variables Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#495057', margin: 0 }}>
                  Dynamic Variables
                </h3>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: '#495057'
                }}>
                  <Upload size={14} />
                  Import
                </button>
              </div>

              {/* Variables Table */}
              <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                  <div style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>Variable</div>
                  <div style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#495057' }}>Type</div>
                </div>
                {variables.map((variable, index) => (
                  <div key={index} style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    borderBottom: index < variables.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}>
                    <div style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937', fontFamily: 'monospace' }}>
                      {variable.name}
                    </div>
                    <div style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6c757d' }}>
                      {variable.type}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: '#495057'
                }}>
                  <Upload size={14} />
                  Import CSV
                </button>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #0d6efd',
                  borderRadius: '6px',
                  backgroundColor: '#0d6efd',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'white'
                }}>
                  <Plus size={14} />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Script Builder */}
        <div style={{ flex: 1, minWidth: '500px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #f3f4f6' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setActiveTab('script')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: activeTab === 'script' ? '#e7f1ff' : 'transparent',
                    color: activeTab === 'script' ? '#0d6efd' : '#6c757d',
                    fontSize: '1rem',
                    fontWeight: activeTab === 'script' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Script Builder
                </button>
                <button
                  onClick={() => setActiveTab('prompts')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: activeTab === 'prompts' ? '#e7f1ff' : 'transparent',
                    color: activeTab === 'prompts' ? '#0d6efd' : '#6c757d',
                    fontSize: '1rem',
                    fontWeight: activeTab === 'prompts' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  System Prompts
                </button>
                <button
                  onClick={() => setActiveTab('responses')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: activeTab === 'responses' ? '#e7f1ff' : 'transparent',
                    color: activeTab === 'responses' ? '#0d6efd' : '#6c757d',
                    fontSize: '1rem',
                    fontWeight: activeTab === 'responses' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Response Templates
                </button>
              </div>
              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6c757d'
              }}>
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Formatting Toolbar */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button style={{ padding: '0.5rem 0.75rem', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>B</button>
              <button style={{ padding: '0.5rem 0.75rem', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer', fontStyle: 'italic' }}>I</button>
              <button style={{ padding: '0.5rem 0.75rem', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>U</button>
              <div style={{ width: '1px', backgroundColor: '#ced4da', margin: '0 0.25rem' }}></div>
              <button style={{ padding: '0.5rem 0.75rem', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>≡</button>
              <button style={{ padding: '0.5rem 0.75rem', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>⋮</button>
              <button style={{ padding: '0.5rem 0.75rem', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>🔗</button>
              <button style={{ padding: '0.5rem 0.75rem', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}>↶</button>
            </div>

            {/* Script Content */}
            <textarea
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '1rem',
                lineHeight: '1.6',
                resize: 'vertical',
                minHeight: '200px',
                marginBottom: '1.5rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            />

            {/* Variable Selector and Test */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057', fontSize: '0.95rem' }}>
                  Insert Variable
                </label>
                <select
                  value={selectedVariable}
                  onChange={(e) => setSelectedVariable(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    color: '#6c757d',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select variable...</option>
                  {variables.map((v, i) => (
                    <option key={i} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057', fontSize: '0.95rem' }}>
                  Voice Test
                </label>
                <button style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  border: '1px solid #0d6efd',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#0d6efd',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}>
                  <Volume2 size={18} />
                  Play
                </button>
              </div>
            </div>

            {/* Test Utterance Input */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057', fontSize: '0.95rem' }}>
                  Test Input
                </label>
                <input
                  type="text"
                  value={testUtterance}
                  onChange={(e) => setTestUtterance(e.target.value)}
                  placeholder="Enter sample customer input..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057', fontSize: '0.95rem' }}>
                  &nbsp;
                </label>
                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#0d6efd',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Test Response
                </button>
              </div>
            </div>

            {/* Confidence Chart */}
            {testUtterance && (
              <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#495057' }}>
                  Confidence Analysis
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={utteranceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="confidence" fill="#0d6efd" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Simulate Call */}
        <div style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Live Preview
              </h3>
              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6c757d'
              }}>
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Phone Number Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #667eea 100%)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Phone size={24} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white' }}>
                    +1 (222) 333-4455
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                    United States
                  </div>
                </div>
              </div>
            </div>

            {/* Bot Message */}
            <div style={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              borderLeft: '4px solid #0d6efd'
            }}>
              <p style={{ margin: 0, color: '#495057', lineHeight: '1.6', fontSize: '0.95rem' }}>
                {scriptContent}
              </p>
            </div>

            {/* Validation Section */}
            <div>
              <h4 style={{ 
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#6c757d',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '1rem'
              }}>
                Validation Status
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {validationItems.map((item, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: item.checked ? '#d1fae5' : '#f8f9fa',
                      border: `1px solid ${item.checked ? '#a7f3d0' : '#e9ecef'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <CheckCircle 
                        size={20} 
                        color={item.checked ? '#059669' : '#9ca3af'}
                        fill={item.checked ? '#059669' : 'none'}
                      />
                      <span style={{ 
                        fontSize: '0.875rem',
                        fontWeight: item.checked ? '500' : '400',
                        color: item.checked ? '#047857' : '#6c757d'
                      }}>
                        {item.label}
                      </span>
                    </div>
                    {item.hasToggle && (
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleValidation(index)}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: '44px',
                          height: '24px',
                          borderRadius: '12px',
                          backgroundColor: item.checked ? '#0d6efd' : '#ced4da',
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
                            left: item.checked ? '22px' : '2px',
                            transition: 'left 0.2s'
                          }} />
                        </div>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextScriptScreen;