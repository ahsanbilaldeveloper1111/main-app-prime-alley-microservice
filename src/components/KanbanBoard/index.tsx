import React, { useState, useRef, useCallback, useEffect } from "react";
import { FileText, MapPin, Mail, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import type { BoundTableContextMenuItem } from "@components/GenericTable";
import "@assets/css/GenericTable.css";
import type { TableAction } from "@components/GenericTable";

const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";
const TEAL = "#006162";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KanbanCardData {
  id: string | number;
  name: string;
  email?: string;
  avatarInitials?: string;
  avatarColor?: string;
  metaLines?: string[];
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
  onCardAction?: (
    action: "view" | "pin" | "email" | "external",
    card: KanbanCardData
  ) => void;
  /** Optional right-click actions for each card (mirrors `GenericTable` context menu behavior). */
  cardActions?: TableAction<any>[];
  /** Row object passed into actions; defaults to `card.raw`. */
  getCardContextMenuRow?: (card: KanbanCardData) => any;
  onCardMove?: (
    cardId: string | number,
    fromColumnId: string,
    toColumnId: string
  ) => void;
  /** Right-click menu items (same rules as GenericTable row actions). */
  cardContextMenuItems?: (card: KanbanCardData) => BoundTableContextMenuItem[];
  searchValue?: string;
}

// ─── Mini avatar ──────────────────────────────────────────────────────────────

const MiniAvatar: React.FC<{ initials: string; color: string }> = ({ initials, color }) => (
  <div style={{
    width: 18, height: 18, borderRadius: "50%", background: color,
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 7, fontWeight: 700, flexShrink: 0, userSelect: "none", fontFamily: FONT,
  }}>
    {initials}
  </div>
);

const DashAvatar: React.FC = () => (
  <div style={{
    width: 18, height: 18, borderRadius: "50%", background: "#e0e0e0",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 10, color: "#999", fontWeight: 500, flexShrink: 0,
  }}>–</div>
);

// ─── Action icon button ───────────────────────────────────────────────────────

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
        background: "none", border: "none", cursor: "pointer",
        padding: "3px 4px", borderRadius: 3,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: hov ? "#000" : "#141414",
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
  onCardContextMenu?: (e: React.MouseEvent<HTMLDivElement>, c: KanbanCardData) => void;
  onDragStart?: (e: React.DragEvent, id: string | number, colId: string) => void;
}> = ({ card, columnId, onCardClick, onCardAction, onCardContextMenu, onDragStart }) => {
  const [hov, setHov] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, card.id, columnId)}
      onContextMenu={(e) => onCardContextMenu?.(e, card)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: "11px 13px 12px",
        marginBottom: 11,
        cursor: "grab",
        boxShadow: hov
          ? "0 2px 8px rgba(0,0,0,.10)"
          : "0 1px 2px rgba(0,0,0,.05)",
        transition: "box-shadow .12s",
        fontFamily: FONT,
      }}
    >
      {/* Name link */}
      <div style={{ marginBottom: 2 }}>
        <span
          onClick={(e) => { e.stopPropagation(); onCardClick?.(card); }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: TEAL,
            cursor: "pointer",
            fontFamily: FONT,
            lineHeight: "18px",
          }}
        >
          {card.name || "--"}
        </span>
      </div>

      {/* Email row */}
      {card.email && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, margin: "5px 0 6px" }}>
          {card.avatarInitials && card.avatarColor
            ? <MiniAvatar initials={card.avatarInitials} color={card.avatarColor} />
            : <DashAvatar />
          }
          <span
            title={card.email}
            style={{
              fontSize: 11.5, color: TEAL, fontFamily: FONT,
              overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", maxWidth: 180, lineHeight: "18px",
            }}
          >
            {card.email}
          </span>
        </div>
      )}

      {/* Meta lines */}
      {card.metaLines && card.metaLines.length > 0 && (
        <div style={{ marginBottom: 5 }}>
          {card.metaLines.map((line, i) => (
            <div key={i} style={{ fontSize: 11.5, color: "#555", lineHeight: "18px", fontFamily: FONT }}>
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Action row */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: 0, paddingTop: 4, marginTop: 4,
        }}
      >
        <ActBtn icon={<FileText    size={13} />} title="View record"  onClick={() => onCardAction?.("view",     card)} />
        <ActBtn icon={<MapPin      size={13} />} title="Pin"          onClick={() => onCardAction?.("pin",      card)} />
        <ActBtn icon={<Mail        size={13} />} title="Send email"   onClick={() => onCardAction?.("email",    card)} />
        <ActBtn icon={<ExternalLink size={13} />} title="Open record" onClick={() => onCardAction?.("external", card)} />
      </div>
    </div>
  );
};

// ─── Column header with arrow/chevron shape ───────────────────────────────────
// The header is a full-width bar with a right-pointing arrow clip-path.
// We achieve the "arrow" shape using an absolutely-positioned right-side
// triangle that overlaps the next column, exactly as in the design image.

const HEADER_H = 34;
const ARROW_W  = 10; // width of the arrow tip that overlaps next column

const ColumnHeader: React.FC<{
  title: string;
  count: number;
  isCollapsed: boolean;
  isLast: boolean;
  onToggle: () => void;
}> = ({ title, count, isCollapsed, isLast, onToggle }) => {
  const [hov, setHov] = useState(false);

  if (isCollapsed) {
    return (
      <div
        style={{
          position: "relative",
          height: "100%",
          minHeight: 120,
        }}
      >
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            height: HEADER_H,
            backgroundColor: "#f7f2f7",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "3px",
            transition: "all 0.2s",
            opacity: hov ? 0.9 : 1,
            boxShadow: hov ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
            marginBottom: 8,
            border: "1px solid #ccc",
          }}
          title={`${title} (${count}) - Click to expand`}
        >
          <ChevronRight size={16} style={{ color: "#141414", marginBottom: 2 }} />
          {count > 0 && (
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              color: "#141414",
              fontFamily: FONT,
              backgroundColor: "#e2e8f0",
              borderRadius: "8px",
              padding: "1px 4px",
              minWidth: 16,
              textAlign: "center",
            }}>
              {count}
            </span>
          )}
        </div>
        {/* Vertical column name */}
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            fontSize: 11,
            fontWeight: 600,
            color: "#666",
            fontFamily: FONT,
            cursor: "pointer",
            textAlign: "center",
            margin: "8px auto",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
          title={`${title} - Click to expand`}
        >
          {title}
        </div>
      </div>
    );
  }

  const clipPathValue = isLast
    ? `polygon(0px 0px, 100% 0px, 100% 100%, 0px 100%, ${ARROW_W}px 50%)`
    : `polygon(0px 0px, calc(100% - ${ARROW_W}px) 0px, 100% 50%, calc(100% - ${ARROW_W}px) 100%, 0px 100%, ${ARROW_W}px 50%)`;

  return (
    <div
      style={{
        position: "relative",
        height: HEADER_H,
        flexShrink: 0,
        backgroundColor: "#ccc",
        borderTopLeftRadius: 0,
        clipPath: clipPathValue,
        zIndex: 1,
        width: "102%",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 1,
          left: 1,
          right: isLast ? 1 : 0,
          bottom: 1,
          backgroundColor: "#f7f2f7",
          borderTopLeftRadius: 0,
          display: "flex",
          alignItems: "center",
          paddingLeft: ARROW_W + 6,
          paddingRight: isLast ? 7 : ARROW_W + 5,
          clipPath: isLast
            ? `polygon(1px 0px, 100% 0px, 100% 100%, 1px 100%, ${ARROW_W}px 50%)`
            : `polygon(1px 0px, calc(100% - ${ARROW_W}px) 0px, calc(100% - 1px) 50%, calc(100% - ${ARROW_W}px) 100%, 1px 100%, ${ARROW_W}px 50%)`,
          cursor: "default",
          userSelect: "none",
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <span style={{
          fontSize: 12,
          fontStyle: "normal",
          fontWeight: 600,
          textTransform: "unset",
          margin: 0,
          padding: 0,
          backgroundColor: "unset",
          fontFamily: FONT,
          letterSpacing: 0,
          lineHeight: "18px",
          color: "#141414",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
        }}>
          {title}
        </span>

        <span style={{
          fontSize: 12, fontWeight: 400, color: "#888",
          fontFamily: FONT, marginLeft: 5, marginRight: 4, flexShrink: 0, width: 27, height: 20, borderRadius: 20, background: "#fff", textAlign: "center"
        }}>
          {count}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          title={isCollapsed ? "Expand" : "Collapse"}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "2px 3px", borderRadius: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: hov ? "#555" : "#141414", flexShrink: 0,
            transition: "color .12s",
          }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );
};

// ─── Column ───────────────────────────────────────────────────────────────────

const Column: React.FC<{
  col: KanbanColumnDef;
  filteredCards: KanbanCardData[];
  isCollapsed: boolean;
  isLast: boolean;
  onToggle: () => void;
  onCardClick?: (c: KanbanCardData) => void;
  onCardAction?: (a: "view" | "pin" | "email" | "external", c: KanbanCardData) => void;
  onCardContextMenu?: (
    e: React.MouseEvent<HTMLDivElement>,
    c: KanbanCardData,
  ) => void;
  onDragStart?: (e: React.DragEvent, id: string | number, colId: string) => void;
  onDrop?: (e: React.DragEvent, colId: string) => void;
}> = ({
  col, filteredCards, isCollapsed, isLast,
  onToggle, onCardClick, onCardAction, onCardContextMenu, onDragStart, onDrop,
}) => {
  const [dragOver, setDragOver] = useState(false);

  const COL_W = 280;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        width: isCollapsed ? 36 : COL_W,
        minWidth: isCollapsed ? 36 : COL_W,
        maxHeight: "100%",
        overflow: "hidden",
        transition: "width .15s ease",
        backgroundColor: "#ffffff",
        
      }}
    >
      {/* White top bar that contains the arrow header */}
      <div style={{
        backgroundColor: "#ffffff",
        flexShrink: 0,
        padding: "5px 5px 0 5px",
      }}>
        <ColumnHeader
          title={col.title}
          count={filteredCards.length}
          isCollapsed={isCollapsed}
          isLast={isLast}
          onToggle={onToggle}
        />
      </div>

      {/* Cards area with 5px margin on all sides */}
      {!isCollapsed && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => {
            const el = e.currentTarget;
            if (!el.contains(e.relatedTarget as Node)) setDragOver(false);
          }}
          onDrop={(e) => { setDragOver(false); onDrop?.(e, col.id); }}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            margin: "5px",
            padding: "9px 10px 10px",
            borderRadius: 3,
            background: dragOver ? "#dde8f3" : "whitesmoke",
            transition: "background .12s",
            scrollbarWidth: "thin",
            scrollbarColor: "#c8c8c8 transparent",
            borderTop: "1px solid #cccccc",
          }}
        >
          {filteredCards.length === 0 ? (
            <div style={{
              padding: "28px 8px", textAlign: "center",
              color: "#ccc", fontSize: 12, fontFamily: FONT,
            }}>
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
                onCardContextMenu={onCardContextMenu}
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
  cardActions,
  getCardContextMenuRow,
  onCardMove,
  cardContextMenuItems,
  searchValue,
}) => {
  const [columns, setColumns]     = useState<KanbanColumnDef[]>(initialColumns);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [cardContextMenu, setCardContextMenu] = useState<{
    x: number;
    y: number;
    items: BoundTableContextMenuItem[];
  } | null>(null);
  const cardContextMenuRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ cardId: string | number; fromColId: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    card: KanbanCardData;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setColumns(initialColumns); }, [initialColumns]);

  useEffect(() => {
    if (!cardContextMenu) return;
    const close = () => setCardContextMenu(null);
    const onMouseDown = (e: MouseEvent) => {
      if (
        cardContextMenuRef.current &&
        !cardContextMenuRef.current.contains(e.target as Node)
      )
        close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [cardContextMenu]);

  const getRow = useCallback(
    (card: KanbanCardData) => getCardContextMenuRow?.(card) ?? card.raw,
    [getCardContextMenuRow],
  );

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

  type ContextMenuItem = {
    label: string;
    icon?: React.ReactNode;
    onClick: (row: any) => void;
    divider?: boolean;
    className?: string;
    disabled?: boolean;
    disabledTitle?: string;
    disabledClassName?: string;
  };

  const getContextMenuItems = useCallback(
    (row: any): ContextMenuItem[] => {
      const actions = cardActions ?? [];
      const items: ContextMenuItem[] = [];
      for (const action of actions) {
        if (action.show && !action.show(row)) continue;

        if (action.dropdown) {
          const opts = action.dropdown.options.filter(
            (o) => !o.show || o.show(row),
          );
          for (const o of opts) {
            items.push({
              label: o.label,
              icon: o.icon,
              onClick: o.onClick,
              divider: o.divider ?? false,
              className: o.className,
            });
          }
          continue;
        }

        if (action.onClick && !action.render) {
          const isDisabled = action.disabled?.(row) ?? false;
          items.push({
            label: action.label,
            icon: action.icon,
            onClick: action.onClick,
            divider: false,
            className: isDisabled
              ? action.disabledClassName || "text-muted"
              : action.className,
            disabled: isDisabled,
            disabledTitle: action.disabledTitle,
            disabledClassName: action.disabledClassName,
          });
        }
      }
      return items;
    },
    [cardActions],
  );

  const handleCardContextMenu = useCallback(
    (e: React.MouseEvent, card: KanbanCardData) => {
      if (cardContextMenuItems) {
        const items = cardContextMenuItems(card);
        if (items.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          setCardContextMenu({ x: e.clientX, y: e.clientY, items });
          return;
        }
      }
      if (!cardActions || cardActions.length === 0) return;
      const row = getRow(card);
      const actionItems = getContextMenuItems(row);
      if (actionItems.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, card });
    },
    [cardContextMenuItems, cardActions, getRow, getContextMenuItems],
  );

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onMouseDown = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu]);

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
    <>
      {cardContextMenu && (
        <div
          ref={cardContextMenuRef}
          className="gt-context-menu"
          style={{ left: cardContextMenu.x, top: cardContextMenu.y }}
          role="menu"
        >
          {cardContextMenu.items.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.disabled && item.disabledTitle ? (
                <span
                  className="gt-context-menu-disabled-wrapper"
                  title={item.disabledTitle}
                >
                  <button
                    type="button"
                    className={`gt-context-menu-item ${item.className || ""}`}
                    disabled
                    onClick={(e) => e.stopPropagation()}
                    role="menuitem"
                  >
                    {item.icon && (
                      <span className="gt-context-menu-icon">{item.icon}</span>
                    )}
                    {item.label}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className={`gt-context-menu-item ${item.className || ""}`}
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.disabled) {
                      item.onClick();
                      setCardContextMenu(null);
                    }
                  }}
                  role="menuitem"
                  title={item.disabled ? item.disabledTitle : undefined}
                >
                  {item.icon && (
                    <span className="gt-context-menu-icon">{item.icon}</span>
                  )}
                  {item.label}
                </button>
              )}
              {item.divider && <div className="gt-context-menu-divider" />}
            </React.Fragment>
          ))}
        </div>
      )}
      <style>{`
        .kb-scroll::-webkit-scrollbar { height: 6px; }
        .kb-scroll::-webkit-scrollbar-track { background: transparent; }
        .kb-scroll::-webkit-scrollbar-thumb { background: #c4c4c4; border-radius: 3px; }
        .kb-col-cards::-webkit-scrollbar { width: 4px; }
        .kb-col-cards::-webkit-scrollbar-track { background: transparent; }
        .kb-col-cards::-webkit-scrollbar-thumb { background: #c8c8c8; border-radius: 3px; }
      `}</style>
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="gt-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
        >
          {getContextMenuItems(getRow(contextMenu.card)).map((item) => (
            <React.Fragment key={`${item.label}-${item.className ?? ""}`}>
              {item.disabled && item.disabledTitle ? (
                <span
                  className="gt-context-menu-disabled-wrapper"
                  title={item.disabledTitle}
                >
                  <button
                    type="button"
                    className={`gt-context-menu-item ${item.className || ""}`}
                    disabled
                    onClick={(e) => e.stopPropagation()}
                    role="menuitem"
                  >
                    {item.icon && (
                      <span className="gt-context-menu-icon">{item.icon}</span>
                    )}
                    {item.label}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className={`gt-context-menu-item ${item.className || ""}`}
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.disabled) {
                      item.onClick(getRow(contextMenu.card));
                      setContextMenu(null);
                    }
                  }}
                  role="menuitem"
                  title={item.disabled ? item.disabledTitle : undefined}
                >
                  {item.icon && (
                    <span className="gt-context-menu-icon">{item.icon}</span>
                  )}
                  {item.label}
                </button>
              )}
              {item.divider && <div className="gt-context-menu-divider" />}
            </React.Fragment>
          ))}
        </div>
      )}
      <div
        className="kb-scroll"
        style={{
          display: "flex",
          flexDirection: "row",
          height: "80vh",
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          background: "#ffffff",
          // Columns sit flush against each other — the arrow header creates the visual separation
          gap: 0,
        }}
      >
        {columns.map((col, idx) => {
          const filteredCards = getFiltered(col.cards);
          const isCollapsed   = !!collapsed[col.id];
          const isLast        = idx === columns.length - 1;

          return (
            <Column
              key={col.id}
              col={col}
              filteredCards={filteredCards}
              isCollapsed={isCollapsed}
              isLast={isLast}
              onToggle={() => setCollapsed((p) => ({ ...p, [col.id]: !p[col.id] }))}
              onCardClick={onCardClick}
              onCardAction={onCardAction}
              onCardContextMenu={
                cardContextMenuItems || (cardActions && cardActions.length > 0)
                  ? handleCardContextMenu
                  : undefined
              }
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          );
        })}
      </div>
    </>
  );
};

export default KanbanBoard;

// ─── Data transformer ─────────────────────────────────────────────────────────

export const LIFECYCLE_COLUMNS: { id: string; title: string }[] = [
  { id: "subscriber",               title: "Subscriber"               },
  { id: "lead",                     title: "Lead"                     },
  { id: "marketing_qualified_lead", title: "Marketing Qualified Lead" },
  { id: "sales_qualified_lead",     title: "Sales Qualified Lead"     },
  { id: "opportunity",              title: "Opportunity"              },
  { id: "customer",                 title: "Customer"                 },
  { id: "evangelist",               title: "Evangelist"               },
  { id: "other",                    title: "Other"                    },
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
  other:                        "other",
};

export function prospectsToKanbanColumns(
  prospects: any[],
  getInitials: (name: string) => string,
  getColor:    (name: string) => string
): KanbanColumnDef[] {
  const buckets: Record<string, KanbanCardData[]> = {};
  LIFECYCLE_COLUMNS.forEach((c) => (buckets[c.id] = []));

  for (const p of prospects) {
    const rawStage = (p.data?.lifecycle_stage ?? p.lifecycle_stage ?? "lead")
      .toLowerCase().trim();
    const colId = STAGE_MAP[rawStage] ?? "lead";

    const name  = p.name || "--";
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
