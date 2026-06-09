import React from 'react';
import { LucideIcon, Circle } from 'lucide-react';

export interface StatsCardData {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  subtitle?: string;
  badge?: {
    text: string;
    bgColor: string;
    textColor: string;
  };
  metric?: {
    text: string;
    dotColor: string;
  };
  link?: {
    text: string;
    onClick: () => void;
  };
  additionalText?: string;
  /** When set, the whole card is clickable (e.g. apply a list filter). */
  onClick?: () => void;
}

interface StatsCardsProps {
  data: StatsCardData[];
  gridMinWidth?: string;
  columns?: number;
  /** Font size for the stat value (e.g. '24px', '36px'). Defaults to '36px'. */
  valueFontSize?: string;
  /** When true, omits outer card chrome for use inside `.gt-metrics-panel`. */
  embedded?: boolean;
}

const INTERACTIVE_SHELL_BASE: React.CSSProperties = {
  cursor: 'pointer',
  background: 'transparent',
  width: '100%',
  font: 'inherit',
};

const DOT_LINE_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'nowrap',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  minWidth: 0,
  gap: '6px',
  color: '#374151',
  textAlign: 'center',
};

function getGridTemplateColumns(
  columns: number | undefined,
  embedded: boolean,
  gridMinWidth: string,
): string {
  if (!columns) {
    return `repeat(auto-fit, minmax(${gridMinWidth}, 1fr))`;
  }
  if (embedded) {
    return `repeat(${columns}, minmax(0, 1fr))`;
  }
  return `repeat(${columns}, 1fr)`;
}

function buildCardKey(card: StatsCardData): string {
  return `${card.title}|${String(card.value)}|${card.subtitle || ''}|${card.additionalText || ''}`;
}

function getInteractiveShellStyle(embedded: boolean): React.CSSProperties {
  if (embedded) {
    return {
      ...INTERACTIVE_SHELL_BASE,
      borderTop: 'none',
      borderRight: 'none',
      borderBottom: 'none',
      textAlign: 'center',
    };
  }

  return {
    ...INTERACTIVE_SHELL_BASE,
    border: 'none',
    textAlign: 'inherit',
    display: 'block',
  };
}

function getShellStyle(
  embedded: boolean,
  interactive: boolean,
  showColumnDivider: boolean,
): React.CSSProperties {
  const shared: React.CSSProperties = {
    padding: '16px 12px',
    borderRadius: interactive ? '8px' : undefined,
    transition: interactive ? 'background-color 0.15s ease' : undefined,
    overflow: 'hidden',
    minWidth: 0,
  };

  if (embedded) {
    return {
      ...shared,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      boxSizing: 'border-box',
      borderLeft: showColumnDivider ? '1px solid #e5e7eb' : undefined,
      ...(interactive ? getInteractiveShellStyle(true) : {}),
    };
  }

  return {
    ...shared,
    ...(interactive ? getInteractiveShellStyle(false) : {}),
  };
}

function formatSubtitle(subtitle: string): string {
  return subtitle.length > 15 ? `${subtitle.substring(0, 15)}...` : subtitle;
}

function cardHasFooterContent(card: StatsCardData): boolean {
  return Boolean(card.metric || card.subtitle || card.additionalText || card.badge);
}

interface DotMetricLineProps {
  text: string;
  dotColor: string;
  fontSize: string;
  marginTop: string;
  embedded?: boolean;
  truncateToFifteen?: boolean;
}

function getDotMetricSpanProps(
  text: string,
  embedded: boolean,
  truncateToFifteen: boolean,
): { title?: string; style?: React.CSSProperties } {
  if (truncateToFifteen) {
    return { title: text };
  }
  if (embedded) {
    return {
      title: text,
      style: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
      },
    };
  }
  return {};
}

function DotMetricLine({
  text,
  dotColor,
  fontSize,
  marginTop,
  embedded = false,
  truncateToFifteen = false,
}: Readonly<DotMetricLineProps>) {
  const displayText = truncateToFifteen ? formatSubtitle(text) : text;
  const spanProps = getDotMetricSpanProps(text, embedded, truncateToFifteen);

  return (
    <div
      style={{
        ...DOT_LINE_ROW_STYLE,
        fontSize,
        marginTop,
        overflow: truncateToFifteen ? 'hidden' : undefined,
      }}
    >
      <Circle size={8} fill={dotColor} color={dotColor} style={{ flexShrink: 0 }} />
      <span {...spanProps}>{displayText}</span>
    </div>
  );
}

interface StatsCardContentProps {
  card: StatsCardData;
  embedded: boolean;
  valueFontSize: string;
}

function StatsCardContent({ card, embedded, valueFontSize }: Readonly<StatsCardContentProps>) {
  return (
    <React.Fragment>
      <div
        title={card.title}
        style={{
          fontSize: 'clamp(10px, 0.8vw, 12px)',
          color: '#141414',
          fontWeight: '500',
          marginBottom: '8px',
          textAlign: 'center',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical' as const,
        }}
      >
        {card.title}
      </div>

      <div
        style={{
          fontSize: embedded ? valueFontSize : '28px',
          fontWeight: '500',
          color: '#0066CC',
          lineHeight: '1',
          textAlign: 'center',
          marginBottom: embedded && cardHasFooterContent(card) ? '8px' : 0,
        }}
      >
        {card.value}
      </div>

      {card.badge && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            background: card.badge.bgColor,
            color: card.badge.textColor,
          }}
        >
          {card.badge.text}
        </span>
      )}

      {card.metric && (
        <DotMetricLine
          text={card.metric.text}
          dotColor={card.metric.dotColor}
          fontSize="13px"
          marginTop={card.badge ? '8px' : '0'}
          embedded={embedded}
        />
      )}

      {card.additionalText && (
        <div
          style={{
            fontSize: '12px',
            color: '#9CA3AF',
            marginTop: '8px',
            ...(embedded ? { textAlign: 'center' as const, width: '100%' } : {}),
          }}
        >
          {card.additionalText}
        </div>
      )}

      {card.subtitle && (
        <DotMetricLine
          text={card.subtitle}
          dotColor="#0066CC"
          fontSize="clamp(9px, 0.7vw, 11px)"
          marginTop={card.badge || card.metric ? '8px' : '0'}
          truncateToFifteen
        />
      )}
    </React.Fragment>
  );
}

interface StatsCardItemProps {
  card: StatsCardData;
  index: number;
  embedded: boolean;
  columns?: number;
  valueFontSize: string;
}

function StatsCardItem({ card, index, embedded, columns, valueFontSize }: Readonly<StatsCardItemProps>) {
  const interactive = typeof card.onClick === 'function';
  const showColumnDivider = embedded && Boolean(columns) && index > 0;
  const shellStyle = getShellStyle(embedded, interactive, showColumnDivider);
  const content = <StatsCardContent card={card} embedded={embedded} valueFontSize={valueFontSize} />;

  if (interactive) {
    return (
      <button
        type="button"
        onClick={card.onClick}
        style={shellStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F9FAFB';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <div style={shellStyle}>
      {content}
    </div>
  );
}

const StatsCards: React.FC<StatsCardsProps> = ({
  data,
  gridMinWidth = 'clamp(120px, 12vw, 200px)',
  columns,
  valueFontSize = '28px',
  embedded = false,
}) => {
  const gridTemplateColumns = getGridTemplateColumns(columns, embedded, gridMinWidth);

  return (
    <div
      className={embedded ? 'generic-stats-cards' : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns,
        alignItems: embedded ? 'stretch' : undefined,
        gap: embedded && columns ? 0 : '16px',
        width: embedded ? '100%' : undefined,
        maxWidth: embedded ? '100%' : undefined,
        boxSizing: embedded ? 'border-box' : undefined,
        marginBottom: embedded ? 0 : '16px',
        background: '#FFFFFF',
        borderRadius: embedded ? 0 : '10px',
        border: embedded ? 'none' : '1px solid #cccccc',
        overflow: 'hidden',
      }}
    >
      {data.map((card, index) => (
        <StatsCardItem
          key={buildCardKey(card)}
          card={card}
          index={index}
          embedded={embedded}
          columns={columns}
          valueFontSize={valueFontSize}
        />
      ))}
    </div>
  );
};

export default StatsCards;
