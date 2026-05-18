import React from "react";

function SkeletonField() {
  return (
    <div className="ai-chatbot-settings__field">
      <div className="ai-chatbot-settings__skeleton ai-chatbot-settings__skeleton--label" />
      <div className="ai-chatbot-settings__skeleton ai-chatbot-settings__skeleton--input" />
    </div>
  );
}

function SkeletonSection(props: Readonly<{ titleWidth?: string; children: React.ReactNode }>) {
  const { titleWidth = "40%", children } = props;
  return (
    <section className="ai-chatbot-settings__section" aria-hidden>
      <div
        className="ai-chatbot-settings__skeleton ai-chatbot-settings__skeleton--row-label"
        style={{ width: titleWidth }}
      />
      {children}
    </section>
  );
}

export function AIChatbotSettingsFormSkeleton() {
  return (
    <div className="ai-chatbot-settings__skeleton-form" aria-busy="true" aria-label="Loading settings">
      <SkeletonSection titleWidth="28%">
        <div className="ai-chatbot-settings__grid-4">
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
        </div>
      </SkeletonSection>

      <SkeletonSection titleWidth="32%">
        <div className="ai-chatbot-settings__grid-2">
          <SkeletonField />
          <SkeletonField />
        </div>
        <div className="ai-chatbot-settings__skeleton ai-chatbot-settings__skeleton--hint" />
      </SkeletonSection>

      <SkeletonSection titleWidth="48%">
        <div className="ai-chatbot-settings__grid-2">
          <SkeletonField />
          <SkeletonField />
        </div>
        <div className="ai-chatbot-settings__skeleton ai-chatbot-settings__skeleton--progress" />
      </SkeletonSection>

      <SkeletonSection titleWidth="36%">
        <div className="ai-chatbot-settings__grid-3">
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
        </div>
      </SkeletonSection>

      <SkeletonSection titleWidth="52%">
        <div className="ai-chatbot-settings__skeleton ai-chatbot-settings__skeleton--table" />
      </SkeletonSection>

      <div className="ai-chatbot-settings__skeleton ai-chatbot-settings__skeleton--save" />
    </div>
  );
}
