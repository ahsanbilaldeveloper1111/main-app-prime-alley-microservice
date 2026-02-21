// ============================================================================
// WHATSAPP MESSAGE MODAL (TEMPLATE MODE ONLY)
// ============================================================================
//
// USAGE:
//   <WhatsAppMessageModal
//     isOpen={isOpen}
//     onClose={() => setOpen(false)}
//     associatedRecords={['Record name']}
//     onSave={(data) => { ... }}  // data: { content_sid, content_variables }
//   />
//
// Template mode: user selects a template, fills required param fields, then sends.
// Parent is responsible for calling sendWhatsApp with number + data.content_sid + data.content_variables.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { ChevronDown, Maximize2, X } from 'lucide-react';
import { getWhatsAppTemplates } from '@utils/communication';
import type { WhatsAppTemplateItem } from '@utils/communication';

interface WhatsAppMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  associatedRecords?: string[];
  onSave: (data: {
    content_sid: string;
    content_variables: Record<string, string>;
  }) => void;
}

const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({
  isOpen,
  onClose,
  associatedRecords = [],
  onSave,
}) => {
  const [templates, setTemplates] = useState<WhatsAppTemplateItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateItem | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [isMaximized, setIsMaximized] = useState(false);

  // Fetch templates when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setTemplatesLoading(true);
    getWhatsAppTemplates()
      .then((list) => setTemplates(Array.isArray(list) ? list : []))
      .catch((e) => {
        console.error('Failed to fetch WhatsApp templates', e);
        setTemplates([]);
      })
      .finally(() => setTemplatesLoading(false));
  }, [isOpen]);

  // Reset selection when template list loads or mode changes
  useEffect(() => {
    if (!isOpen) return;
    setSelectedTemplate(null);
    setParamValues({});
  }, [isOpen]);

  // Clear param values when template changes
  useEffect(() => {
    setParamValues({});
  }, [selectedTemplate?.content_sid]);

  if (!isOpen) return null;

  const params = selectedTemplate?.params ?? [];
  const allParamsFilled = params.every(
    (_, i) => (paramValues[String(i + 1)] ?? '').trim() !== ''
  );
  const canSend =
    selectedTemplate != null &&
    selectedTemplate.content_sid &&
    (params.length === 0 || allParamsFilled);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contentSid = e.target.value;
    const template = contentSid
      ? templates.find((t) => t.content_sid === contentSid) ?? null
      : null;
    setSelectedTemplate(template);
  };

  const handleSave = () => {
    if (!selectedTemplate?.content_sid) return;
    const content_variables: Record<string, string> = {};
    (selectedTemplate.params ?? []).forEach((_, index) => {
      const key = String(index + 1);
      content_variables[key] = paramValues[key] ?? '';
    });
    onSave({
      content_sid: selectedTemplate.content_sid,
      content_variables: Object.keys(content_variables).length > 0 ? content_variables : {},
    });
    setSelectedTemplate(null);
    setParamValues({});
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: isMaximized ? '60px 20px 20px 20px' : 'auto 15vh 0.5vh auto',
        height: isMaximized ? 'auto' : 'auto',
        width: isMaximized ? 'auto' : '650px',
        backgroundColor: '#ffffff',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
        borderRadius: '8px',
        border: '1px solid #cbd5e0',
        overflow: 'hidden',
        animation: 'slideInUp 0.3s ease-out',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#141414',
              padding: '4px',
            }}
          >
            <ChevronDown size={20} style={{ transform: 'rotate(90deg)' }} />
          </button>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#141414', margin: 0 }}>
            Send WhatsApp (Template)
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#141414' }}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#141414' }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── Template dropdown ── */}
      <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '8px', fontWeight: '500' }}>
          Template
        </div>
        <select
          value={selectedTemplate?.content_sid ?? ''}
          onChange={handleTemplateChange}
          disabled={templatesLoading}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #cbd5e0',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#141414',
            backgroundColor: '#fff',
            cursor: templatesLoading ? 'wait' : 'pointer',
          }}
          aria-label="Select WhatsApp template"
        >
          <option value="">
            {templatesLoading ? 'Loading templates...' : 'Select a template'}
          </option>
          {templates.map((t) => (
            <option key={t.id} value={t.content_sid}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Template variables (required) ── */}
      {selectedTemplate && Array.isArray(selectedTemplate.params) && selectedTemplate.params.length > 0 && (
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#718096', marginBottom: '8px', fontWeight: '500' }}>
            Template variables (all required)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedTemplate.params.map((paramLabel, index) => {
              const key = String(index + 1);
              return (
                <div key={key}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#141414',
                      marginBottom: '4px',
                    }}
                  >
                    {paramLabel}
                  </label>
                  <input
                    type="text"
                    value={paramValues[key] ?? ''}
                    onChange={(e) =>
                      setParamValues((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder={paramLabel}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#141414',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Associated Records ── */}
      {associatedRecords.length > 0 && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', color: '#718096', fontWeight: '500' }}>
            Associated with {associatedRecords.length} record{associatedRecords.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={handleSave}
          disabled={!canSend}
          style={{
            padding: '8px 20px',
            backgroundColor: canSend ? '#25D366' : '#cbd5e0',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: canSend ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (canSend) e.currentTarget.style.backgroundColor = '#1da851';
          }}
          onMouseLeave={(e) => {
            if (canSend) e.currentTarget.style.backgroundColor = '#25D366';
          }}
        >
          Send WhatsApp
        </button>
      </div>
    </div>
  );
};

export default WhatsAppMessageModal;
