import React, { useState, useRef, useCallback, useEffect } from "react";
import { FileText, MapPin, Mail, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KanbanCardData {
  id: string | number;
  /** Primary title – shown as teal link */
  name: string;
  /** Contact email */
  email?: string;
  /** Initials for mini avatar – omit to show dash placeholder */
  avatarInitials?: string;
  avatarColor?: string;
  /** Extra text lines shown below email (e.g. deal count, value) */
  metaLines?: string[];
  /** Raw source record – returned in callbacks */
  raw?: any;
}

export interface KanbanColumnDef {
  id: string;
  title: string;
  cards: KanbanCardData[];
}

export interface KanbanBoardProps {
  columns: KanbanColumnDef[];
  onCardClick?: (card: KanbanCardData) => void;
  /** Called when an action icon is clicked */
  onCardAction?: (
    action: "view" | "pin" | "email" | "external",
    card: KanbanCardData
  ) => void;
  /** Called after a drag-drop moves a card between columns */
  onCardMove?: (
    cardId: string | number,
    fromColumnId: string,
    toColumnId: string
  ) => void;
  /** Filters card names + emails live */
  searchValue?: string;
}

// ─── Tiny avatar / dash placeholder ──────────────────────────────────────────

const MiniAvatar: React.FC<{ initials: string; color: string }> = ({
  initials,
  color,
}) => (
  <div
    style={{
      width: 17,
      height: 17,
      borderRadius: "50%",
      background: color,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 7,
      fontWeight: 700,
      flexShrink: 0,
      userSelect: "none",
    }}
  >
    {initials}
  </div>
);

const DashAvatar: React.FC = () => (
  <div
    style={{
      width: 17,
      height: 17,
      borderRadius: "50%",
      background: "#e0e0e0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      color: "#999",
      fontWeight: 600,
      flexShrink: 0,
    }}
  >
    –
  </div>
);

// ─── Icon action button ───────────────────────────────────────────────────────

const ActBtn: React.FC<{
  icon: React.ReactNode;
  title: string;
  onClick: (e: React.MouseEvent) => void;
}> = ({ icon, title, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "3px 4px",
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: hov ? "#444" : "#b0b0b0",
        transition: "color .1s",
      }}
    >
      {icon}
    </button>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────

const Card: React.FC<{
  card: KanbanCardData;
  columnId: string;
  onCardClick?: (c: KanbanCardData) => void;
  onCardAction?: (a: "view" | "pin" | "email" | "external", c: KanbanCardData) => void;
  onDragStart?: (e: React.DragEvent, id: string | number, colId: string) => void;
}> = ({ card, columnId, onCardClick, onCardAction, onDragStart }) => {
  const [hov, setHov] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, card.id, columnId)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 3,
        padding: "8px 10px 6px",
        marginBottom: 5,
        cursor: "grab",
        boxShadow: hov ? "0 2px 7px rgba(0,0,0,.10)" : "0 1px 1px rgba(0,0,0,.04)",
        transition: "box-shadow .12s",
      }}
    >
      {/* Name */}
      <div style={{ marginBottom: 3 }}>
        <span
          onClick={(e) => { e.stopPropagation(); onCardClick?.(card); }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "#1a6e6e",
            cursor: "pointer",
            fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
          }}
        >
          {card.name || "--"}
        </span>
      </div>

      {/* Email row */}
      {card.email && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, margin: "5px 0 7px" }}>
          {card.avatarInitials && card.avatarColor ? (
            <MiniAvatar initials={card.avatarInitials} color={card.avatarColor} />
          ) : (
            <DashAvatar />
          )}
          <span
            title={card.email}
            style={{
              fontSize: 11.5,
              color: "#555",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 175,
              fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
            }}
          >
            {card.email}
          </span>
        </div>
      )}

      {/* Meta lines */}
      {card.metaLines && card.metaLines.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {card.metaLines.map((line, i) => (
            <div
              key={i}
              style={{
                fontSize: 11.5,
                color: "#555",
                lineHeight: 1.6,
                fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
              }}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Action icons */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1,
          borderTop: "1px solid #f0f0f0",
          paddingTop: 5,
          marginTop: 2,
        }}
      >
        <ActBtn icon={<FileText size={13} />} title="View record"   onClick={() => onCardAction?.("view",     card)} />
        <ActBtn icon={<MapPin    size={13} />} title="Pin"          onClick={() => onCardAction?.("pin",      card)} />
        <ActBtn icon={<Mail      size={13} />} title="Send email"   onClick={() => onCardAction?.("email",    card)} />
        <ActBtn icon={<ExternalLink size={13}/>} title="Open record" onClick={() => onCardAction?.("external", card)} />
      </div>
    </div>
  );
};

// ─── Column ───────────────────────────────────────────────────────────────────

const Column: React.FC<{
  col: KanbanColumnDef;
  filteredCards: KanbanCardData[];
  isCollapsed: boolean;
  onToggle: () => void;
  onCardClick?: (c: KanbanCardData) => void;
  onCardAction?: (a: "view" | "pin" | "email" | "external", c: KanbanCardData) => void;
  onDragStart?: (e: React.DragEvent, id: string | number, colId: string) => void;
  onDrop?: (e: React.DragEvent, colId: string) => void;
}> = ({ col, filteredCards, isCollapsed, onToggle, onCardClick, onCardAction, onDragStart, onDrop }) => {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        width: isCollapsed ? "auto" : 252,
        minWidth: isCollapsed ? 0 : 252,
        background: "#ebebeb",
        borderRight: "1px solid #dcdcdc",
        maxHeight: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 8px 0 10px",
          height: 34,
          flexShrink: 0,
          borderBottom: "1px solid #dcdcdc",
          background: "#ebebeb",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "#1a1a1a",
            fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
          }}
        >
          {col.title}
        </span>
        <span
          style={{
            fontSize: 12,
            color: "#888",
            fontWeight: 400,
            fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
          }}
        >
          {filteredCards.length}
        </span>
        <button
          onClick={onToggle}
          title={isCollapsed ? "Expand" : "Collapse"}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#999",
            padding: "2px 3px",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Cards */}
      {!isCollapsed && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => {
            // only clear if leaving the column entirely
            const col = e.currentTarget;
            if (!col.contains(e.relatedTarget as Node)) setDragOver(false);
          }}
          onDrop={(e) => { setDragOver(false); onDrop?.(e, col.id); }}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "6px 6px 10px",
            background: dragOver ? "#e3edf7" : "#ebebeb",
            transition: "background .12s",
            scrollbarWidth: "thin",
            scrollbarColor: "#c8c8c8 transparent",
          }}
        >
          {filteredCards.length === 0 ? (
            <div
              style={{
                padding: "24px 8px",
                textAlign: "center",
                color: "#ccc",
                fontSize: 12,
                fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
              }}
            >
              No records
            </div>
          ) : (
            filteredCards.map((card) => (
              <Card
                key={card.id}
                card={card}
                columnId={col.id}
                onCardClick={onCardClick}
                onCardAction={onCardAction}
                onDragStart={onDragStart}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Board ────────────────────────────────────────────────────────────────────

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns: initialColumns,
  onCardClick,
  onCardAction,
  onCardMove,
  searchValue,
}) => {
  const [columns, setColumns]   = useState<KanbanColumnDef[]>(initialColumns);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const drag = useRef<{ cardId: string | number; fromColId: string } | null>(null);

  useEffect(() => { setColumns(initialColumns); }, [initialColumns]);

  const getFiltered = useCallback(
    (cards: KanbanCardData[]) => {
      const q = searchValue?.trim().toLowerCase();
      if (!q) return cards;
      return cards.filter(
        (c) =>
          (c.name  || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q)
      );
    },
    [searchValue]
  );

  const handleDragStart = (e: React.DragEvent, cardId: string | number, fromColId: string) => {
    drag.current = { cardId, fromColId };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, toColId: string) => {
    e.preventDefault();
    if (!drag.current) return;
    const { cardId, fromColId } = drag.current;
    if (fromColId === toColId) { drag.current = null; return; }

    setColumns((prev) => {
      const next = prev.map((c) => ({ ...c, cards: [...c.cards] }));
      const from = next.find((c) => c.id === fromColId);
      const to   = next.find((c) => c.id === toColId);
      if (!from || !to) return prev;
      const idx = from.cards.findIndex((c) => c.id === cardId);
      if (idx === -1) return prev;
      const [card] = from.cards.splice(idx, 1);
      to.cards.unshift(card);
      return next;
    });

    onCardMove?.(cardId, fromColId, toColId);
    drag.current = null;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        width: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        background: "#ebebeb",
        scrollbarWidth: "thin",
        scrollbarColor: "#c4c4c4 transparent",
      }}
    >
      {columns.map((col, idx) => {
        const filteredCards = getFiltered(col.cards);
        const isCollapsed   = !!collapsed[col.id];

        return (
          <React.Fragment key={col.id}>
            {/* Chevron separator */}
            {idx > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingTop: 10,
                  width: 12,
                  flexShrink: 0,
                  pointerEvents: "none",
                }}
              >
                <ChevronRight size={11} color="#b8b8b8" />
              </div>
            )}

            <Column
              col={col}
              filteredCards={filteredCards}
              isCollapsed={isCollapsed}
              onToggle={() => setCollapsed((p) => ({ ...p, [col.id]: !p[col.id] }))}
              onCardClick={onCardClick}
              onCardAction={onCardAction}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default KanbanBoard;

// ─── Data transformer ─────────────────────────────────────────────────────────

/** Pipeline stages – edit to match your app's lifecycle_stage values */
export const LIFECYCLE_COLUMNS: { id: string; title: string }[] = [
  { id: "subscriber",               title: "Subscriber"               },
  { id: "lead",                     title: "Lead"                     },
  { id: "marketing_qualified_lead", title: "Marketing Qualified Lead" },
  { id: "sales_qualified_lead",     title: "Sales Qualified Lead"     },
  { id: "opportunity",              title: "Opportunity"              },
  { id: "customer",                 title: "Customer"                 },
  { id: "evangelist",               title: "Evangelist"               },
];

const STAGE_MAP: Record<string, string> = {
  subscriber:                   "subscriber",
  lead:                         "lead",
  prospect:                     "lead",
  "marketing qualified lead":   "marketing_qualified_lead",
  marketing_qualified_lead:     "marketing_qualified_lead",
  "sales qualified lead":       "sales_qualified_lead",
  sales_qualified_lead:         "sales_qualified_lead",
  opportunity:                  "opportunity",
  customer:                     "customer",
  evangelist:                   "evangelist",
};

/**
 * Convert your raw CRM prospect array into KanbanColumnDef[].
 *
 * @param prospects  - raw records from your API / dataList
 * @param getInitials - same helper you use on the prospects page
 * @param getColor    - same colour helper you use on the prospects page
 */
export function prospectsToKanbanColumns(
  prospects: any[],
  getInitials: (name: string) => string,
  getColor:    (name: string) => string
): KanbanColumnDef[] {
  const buckets: Record<string, KanbanCardData[]> = {};
  LIFECYCLE_COLUMNS.forEach((c) => (buckets[c.id] = []));

  for (const p of prospects) {
    const rawStage = (p.data?.lifecycle_stage ?? p.lifecycle_stage ?? "lead")
      .toLowerCase()
      .trim();
    const colId = STAGE_MAP[rawStage] ?? "lead";

    const name  = p.name  || "--";
    const email: string = p.data?.email ?? p.email ?? "";

    buckets[colId].push({
      id:             p.id,
      name,
      email,
      avatarInitials: email ? getInitials(name) : undefined,
      avatarColor:    email ? getColor(name)    : undefined,
      metaLines:      [],
      raw:            p,
    });
  }

  return LIFECYCLE_COLUMNS.map((def) => ({
    id:    def.id,
    title: def.title,
    cards: buckets[def.id],
  }));
}
