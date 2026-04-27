import React from 'react';
import { Info } from 'lucide-react';
import Select from 'react-select';
import { faqFormFieldStyles } from './faqSidebarStyles';

// ===== FaqLabeledTextInput =====
interface FaqLabeledTextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  helpTitle?: string;
  hint?: string;
  placeholder?: string;
}

export const FaqLabeledTextInput: React.FC<FaqLabeledTextInputProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  helpTitle,
  hint,
  placeholder = '',
}) => (
  <div style={faqFormFieldStyles.container}>
    <label htmlFor={id} style={faqFormFieldStyles.label}>
      {label}
      {required && <span style={faqFormFieldStyles.required}>*</span>}
      {helpTitle && (
        <span title={helpTitle} style={faqFormFieldStyles.helpIcon}>
          <Info size={14} />
        </span>
      )}
    </label>
    <input
      id={id}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={faqFormFieldStyles.input}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = faqFormFieldStyles.inputFocus;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = faqFormFieldStyles.inputBlur;
      }}
    />
    {hint && (
      <p style={faqFormFieldStyles.hint}>
        <Info size={12} />
        {hint}
      </p>
    )}
  </div>
);

// ===== FaqLabeledTextarea =====
interface FaqLabeledTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  helpTitle?: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
}

export const FaqLabeledTextarea: React.FC<FaqLabeledTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  helpTitle,
  hint,
  placeholder = '',
  rows = 3,
}) => (
  <div style={faqFormFieldStyles.container}>
    <label htmlFor={id} style={faqFormFieldStyles.label}>
      {label}
      {required && <span style={faqFormFieldStyles.required}>*</span>}
      {helpTitle && (
        <span title={helpTitle} style={faqFormFieldStyles.helpIcon}>
          <Info size={14} />
        </span>
      )}
    </label>
    <textarea
      id={id}
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={faqFormFieldStyles.textarea}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = faqFormFieldStyles.inputFocus;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = faqFormFieldStyles.inputBlur;
      }}
    />
    {hint && (
      <p style={faqFormFieldStyles.hint}>
        <Info size={12} />
        {hint}
      </p>
    )}
  </div>
);

// ===== FaqLabeledSelect =====
interface SelectOption {
  value: any;
  label: string;
}

interface FaqLabeledSelectProps {
  inputId: string;
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helpTitle?: string;
  hint?: string;
  placeholder?: string;
  isLoading?: boolean;
}

export const FaqLabeledSelect: React.FC<FaqLabeledSelectProps> = ({
  inputId,
  label,
  options,
  value,
  onChange,
  required = false,
  helpTitle,
  hint,
  placeholder = 'Select an option...',
  isLoading = false,
}) => (
  <div style={faqFormFieldStyles.container}>
    <label htmlFor={inputId} style={faqFormFieldStyles.label}>
      {label}
      {required && <span style={faqFormFieldStyles.required}>*</span>}
      {helpTitle && (
        <span title={helpTitle} style={faqFormFieldStyles.helpIcon}>
          <Info size={14} />
        </span>
      )}
    </label>
    <Select
      inputId={inputId}
      options={options}
      value={options.find((opt) => opt.value.toString() === value) ?? null}
      onChange={(option: any) => onChange(option?.value?.toString() ?? '')}
      placeholder={placeholder}
      isLoading={isLoading}
      isClearable={false}
      styles={{
        control: (base) => ({
          ...base,
          ...faqFormFieldStyles.selectControl,
        }),
      }}
    />
    {hint && (
      <p style={faqFormFieldStyles.hint}>
        <Info size={12} />
        {hint}
      </p>
    )}
  </div>
);
