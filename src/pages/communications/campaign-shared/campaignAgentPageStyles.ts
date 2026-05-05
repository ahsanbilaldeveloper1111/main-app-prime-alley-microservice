/** Inline styles for Campaign Agent page layout (injected once). */
export const CAMPAIGN_AGENT_PAGE_STYLES = `
  .campaign-agent-page .agent-hero {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  .campaign-agent-page .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }
  .campaign-agent-page .detail-tile {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 18px;
  }
  .campaign-agent-page .detail-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    margin-bottom: 6px;
  }
  .campaign-agent-page .detail-value {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    word-break: break-word;
  }
  .campaign-agent-page .state-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 600;
  }
`;
