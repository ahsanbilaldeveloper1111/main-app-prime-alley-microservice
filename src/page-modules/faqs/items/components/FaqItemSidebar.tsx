import RichTextEditor from "@page-modules/help-center/partials/RichTextEditor";
import { Info, HelpCircle, X } from "lucide-react";
import React from "react";
import Select from "react-select";
import type { FAQItemFormData, FAQItemSidebarConfig } from "../faqItemsTypes";

export type { FAQItemSidebarConfig };

interface ItemTopicFieldProps {
  topicOptions: { value: unknown; label: string }[];
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
}

const ItemTopicField: React.FC<ItemTopicFieldProps> = ({
  topicOptions,
  value,
  onChange,
  isLoading,
}) => (
  <div style={{ marginBottom: "20px" }}>
    {(() => {
      const topicSelectId = "faq-item-topic";
      return (
        <>
          <label
            htmlFor={topicSelectId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#141414",
              marginBottom: "8px",
            }}
          >
            FAQ Topic <span style={{ color: "#f2545b" }}>*</span>
            <span title="Select the FAQ topic" style={{ cursor: "help", color: "#6c757d" }}>
              <Info size={14} />
            </span>
          </label>
          <Select
            inputId={topicSelectId}
            options={topicOptions}
            value={topicOptions.find((opt) => opt.value?.toString() === value) ?? null}
            onChange={(option: { value?: unknown } | null) =>
              onChange(option?.value?.toString() ?? "")
            }
            placeholder="Select topic..."
            isLoading={isLoading}
            isClearable={false}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: 40,
                border: "1px solid #8a8a8a",
                borderRadius: "4px",
                fontSize: "14px",
              }),
            }}
          />
          <p
            style={{
              fontSize: "0.813rem",
              color: "#6c757d",
              marginTop: "6px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Info size={12} />
            Select the FAQ topic this item belongs to
          </p>
        </>
      );
    })()}
  </div>
);

interface ItemQuestionFieldProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}

const ItemQuestionField: React.FC<ItemQuestionFieldProps> = ({ id, value, onChange, placeholder }) => (
  <div style={{ marginBottom: "20px" }}>
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#141414",
        marginBottom: "8px",
      }}
    >
      Question <span style={{ color: "#f2545b" }}>*</span>
      <span title="Enter the question" style={{ cursor: "help", color: "#6c757d" }}>
        <Info size={14} />
      </span>
    </label>
    <input
      id={id}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #8a8a8a",
        borderRadius: "4px",
        fontSize: "14px",
        outline: "none",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#0091ae";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#8a8a8a";
      }}
    />
  </div>
);

interface ItemAnswerFieldProps {
  value: string;
  onChange: (html: string) => void;
  editorKey: string;
}

const ItemAnswerField: React.FC<ItemAnswerFieldProps> = ({ value, onChange, editorKey }) => (
  <div style={{ marginBottom: "20px" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#141414",
        marginBottom: "8px",
      }}
    >
      Answer <span style={{ color: "#f2545b" }}>*</span>
      <span title="Enter the answer" style={{ cursor: "help", color: "#6c757d" }}>
        <Info size={14} />
      </span>
    </div>
    <div style={{ border: "1px solid #8a8a8a", borderRadius: "4px" }}>
      <RichTextEditor
        key={editorKey}
        value={value}
        onChange={onChange}
        placeholder="Enter the answer..."
        minHeight="150px"
      />
    </div>
    <p
      style={{
        fontSize: "0.813rem",
        color: "#6c757d",
        marginTop: "6px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <Info size={12} />
      Use the rich text editor to format your answer with headings, lists, and more
    </p>
  </div>
);

interface ItemDescriptionFieldProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
}

const ItemDescriptionField: React.FC<ItemDescriptionFieldProps> = ({
  id,
  value,
  onChange,
  placeholder,
}) => (
  <div style={{ marginBottom: "20px" }}>
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#141414",
        marginBottom: "8px",
      }}
    >
      Description{" "}
      <span title="Enter an optional description" style={{ cursor: "help", color: "#6c757d" }}>
        <Info size={14} />
      </span>
    </label>
    <textarea
      id={id}
      rows={3}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #8a8a8a",
        borderRadius: "4px",
        fontSize: "14px",
        outline: "none",
        resize: "vertical",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#0091ae";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#8a8a8a";
      }}
    />
  </div>
);

interface ItemTypeFieldProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ItemTypeField: React.FC<ItemTypeFieldProps> = ({ id, value, onChange }) => (
  <div style={{ marginBottom: "20px" }}>
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#141414",
        marginBottom: "8px",
      }}
    >
      Type{" "}
      <span title="Enter the FAQ type" style={{ cursor: "help", color: "#6c757d" }}>
        <Info size={14} />
      </span>
    </label>
    <input
      id={id}
      type="text"
      value={value}
      onChange={onChange}
      placeholder="e.g., general, technical, billing"
      style={{
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #8a8a8a",
        borderRadius: "4px",
        fontSize: "14px",
        outline: "none",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#0091ae";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#8a8a8a";
      }}
    />
  </div>
);

export type FaqItemSidebarProps = Readonly<{
  isOpen: boolean;
  config: FAQItemSidebarConfig;
  selectedItemId: unknown;
  formData: FAQItemFormData;
  topicOptions: { value: unknown; label: string }[];
  isLoadingTopics: boolean;
  onTopicChange: (value: string) => void;
  onQuestionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnswerChange: (html: string) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTypeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}>;

export const FaqItemSidebar: React.FC<FaqItemSidebarProps> = ({
  isOpen,
  config,
  selectedItemId,
  formData,
  topicOptions,
  isLoadingTopics,
  onTopicChange,
  onQuestionChange,
  onAnswerChange,
  onDescriptionChange,
  onTypeChange,
  onSubmit,
  onClose,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  const canSubmit =
    formData.topic_id !== "" &&
    formData.question.trim() !== "" &&
    formData.answer.trim() !== "" &&
    !isSubmitting;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit();
  };

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "transparent",
        }}
      />

      <div
        className="contact-sidebar-container"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="contact-sidebar-header"
          style={{
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <HelpCircle size={20} style={{ color: "#0091ae" }} />
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#141414", margin: 0 }}>
              {config.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        <form
          onSubmit={handleFormSubmit}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <div className="contact-sidebar-content" style={{ flex: 1, overflowY: "auto" }}>
            <ItemTopicField
              topicOptions={topicOptions}
              value={formData.topic_id}
              onChange={onTopicChange}
              isLoading={isLoadingTopics}
            />
            <ItemQuestionField
              id={config.questionInputId}
              value={formData.question}
              onChange={onQuestionChange}
              placeholder={config.questionPlaceholder}
            />
            <ItemAnswerField
              value={formData.answer}
              onChange={onAnswerChange}
              editorKey={config.editorKey(selectedItemId, isOpen)}
            />
            <ItemDescriptionField
              id={config.descInputId}
              value={formData.description}
              onChange={onDescriptionChange}
              placeholder={config.descPlaceholder}
            />
            <ItemTypeField id={config.typeInputId} value={formData.type} onChange={onTypeChange} />
          </div>

          <div
            className="contact-sidebar-footer"
            style={{
              borderTop: "1px solid #eaf0f6",
              display: "flex",
              gap: "12px",
            }}
          >
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: "10px 20px",
                backgroundColor: canSubmit ? "#0091ae" : "#cbd5e0",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (canSubmit) e.currentTarget.style.backgroundColor = "#007a94";
              }}
              onMouseLeave={(e) => {
                if (canSubmit) e.currentTarget.style.backgroundColor = "#0091ae";
              }}
            >
              {isSubmitting ? config.submittingLabel : config.submitLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: "#141414",
                border: "1px solid #8a8a8a",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
