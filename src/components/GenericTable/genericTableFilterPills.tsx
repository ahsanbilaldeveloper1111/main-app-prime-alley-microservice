import React from "react";
import { Dropdown, Form } from "react-bootstrap";
import { Check, X } from "lucide-react";
import type { FilterPill } from "./genericTableTypes";

function filterPillOptionsForQuery(
  pill: FilterPill,
  filterPillSearch: Record<string, string>,
): NonNullable<FilterPill["dropdownOptions"]> {
  const opts = pill.dropdownOptions ?? [];
  if (opts.length === 0) return [];
  const q = (filterPillSearch[pill.id] ?? "").trim().toLowerCase();
  if (!pill.searchable || q.length === 0) return opts;
  return opts.filter(
    (o) =>
      (o.label ?? "").toLowerCase().includes(q) ||
      String(o.value ?? "")
        .toLowerCase()
        .includes(q),
  );
}

function GenericTableFilterPillMenuBody({
  pill,
  filterPillSearch,
  setFilterPillSearch,
  closeMenu,
}: Readonly<{
  pill: FilterPill;
  filterPillSearch: Record<string, string>;
  setFilterPillSearch: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  closeMenu: () => void;
}>) {
  if (pill.dropdownContent) {
    return (
      <div className="px-2 py-2">
        {typeof pill.dropdownContent === "function"
          ? pill.dropdownContent({ closeMenu })
          : pill.dropdownContent}
      </div>
    );
  }

  const hasOptions = Boolean(
    pill.dropdownOptions && pill.dropdownOptions.length > 0,
  );
  const optionsToShow = hasOptions
    ? filterPillOptionsForQuery(pill, filterPillSearch)
    : [];

  const clearPillQuery = () => {
    setFilterPillSearch((prev) => ({ ...prev, [pill.id]: "" }));
  };

  return (
    <>
      {pill.searchable && hasOptions && (
        <div className="px-2 pb-2">
          <Form.Control
            size="sm"
            type="text"
            placeholder="Search..."
            value={filterPillSearch[pill.id] ?? ""}
            onChange={(e) =>
              setFilterPillSearch((prev) => ({
                ...prev,
                [pill.id]: e.target.value,
              }))
            }
            autoFocus
          />
        </div>
      )}
      {pill.multiSelect && pill.onSelectAll && hasOptions && (
        <>
          <Dropdown.Item
            key={`${pill.id}:__select_all__`}
            className="fw-semibold"
            onClick={() => {
              pill.onSelectAll?.();
            }}
          >
            {pill.selectAllLabel ?? "Select all"}
          </Dropdown.Item>
          <Dropdown.Divider className="my-0" />
        </>
      )}
      {hasOptions ? (
        <>
          {optionsToShow.map((option) => (
            <Dropdown.Item
              key={`${pill.id}:${option.value}:${option.label}`}
              onClick={() => {
                (option.onClick || pill.onClick)?.();
                clearPillQuery();
                if (!pill.multiSelect) {
                  closeMenu();
                }
              }}
            >
              <div className="d-flex align-items-center justify-content-between gap-2">
                <span>{option.label}</span>
                {option.selected && <Check size={14} aria-hidden />}
              </div>
            </Dropdown.Item>
          ))}
        </>
      ) : (
        <>
          <Dropdown.Item
            onClick={() => {
              pill.onClick?.();
              closeMenu();
            }}
          >
            All
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              pill.onClick?.();
              closeMenu();
            }}
          >
            Active
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              pill.onClick?.();
              closeMenu();
            }}
          >
            Inactive
          </Dropdown.Item>
        </>
      )}
    </>
  );
}

function orderFilterPillsForDisplay(pills: FilterPill[]) {
  const activePills = pills.filter((pill) => pill.active);
  const inactivePills = pills.filter((pill) => !pill.active);
  const allPills = [...activePills, ...inactivePills];
  const separatorIndex =
    activePills.length > 0 && inactivePills.length > 0
      ? activePills.length
      : -1;
  return { allPills, separatorIndex };
}

function stopFilterPillMenuMouseDown(e: React.MouseEvent) {
  e.stopPropagation();
}

function handleFilterPillClearClick(
  e: React.MouseEvent,
  onClear?: () => void,
) {
  e.preventDefault();
  e.stopPropagation();
  onClear?.();
}

export type FilterPillMenuPopperConfig = React.ComponentProps<
  typeof Dropdown.Menu
>["popperConfig"];

type GenericTableFilterPillDropdownItemProps = Readonly<{
  pill: FilterPill;
  isOpen: boolean;
  onOpenChange: (pillId: string | null) => void;
  filterPillSearch: Record<string, string>;
  setFilterPillSearch: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  filterPillMenuPopperConfig: FilterPillMenuPopperConfig;
}>;

function GenericTableFilterPillDropdownItem({
  pill,
  isOpen,
  onOpenChange,
  filterPillSearch,
  setFilterPillSearch,
  filterPillMenuPopperConfig,
}: GenericTableFilterPillDropdownItemProps) {
  const closeMenu = () => onOpenChange(null);
  const handleToggle = (nextShow: boolean) => {
    onOpenChange(nextShow ? pill.id : null);
  };

  return (
    <Dropdown
      show={isOpen}
      autoClose={pill.multiSelect ? "outside" : true}
      onToggle={handleToggle}
    >
      <Dropdown.Toggle
        variant={pill.active ? "primary" : "outline-secondary"}
        size="sm"
        className={`gt-filter-pill${pill.active ? " gt-filter-pill-active" : ""}`}
      >
        {pill.icon && <span className="me-1">{pill.icon}</span>}
        <span>
          {pill.active && pill.activeLabel && pill.activeLabelOnly
            ? pill.activeLabel
            : pill.label}
        </span>
        {pill.active && pill.activeLabel && !pill.activeLabelOnly && (
          <span className="gt-filter-pill-value">: {pill.activeLabel}</span>
        )}
        {pill.active && !pill.activeLabel && (
          <span className="gt-filter-pill-dot" title="Filter applied" />
        )}
        {pill.active && pill.onClear && (
          <button
            type="button"
            className="gt-filter-pill-clear"
            onClick={(e) => handleFilterPillClearClick(e, pill.onClear)}
            title="Clear filter"
            aria-label="Clear filter"
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu
        renderOnMount
        style={
          pill.dropdownMenuStyle ?? {
            maxHeight: "280px",
            overflowY: "auto",
            overflowX: "hidden",
            maxWidth: "min(320px, calc(100vw - 24px))",
          }
        }
        popperConfig={filterPillMenuPopperConfig}
        onMouseDown={stopFilterPillMenuMouseDown}
      >
        <GenericTableFilterPillMenuBody
          pill={pill}
          filterPillSearch={filterPillSearch}
          setFilterPillSearch={setFilterPillSearch}
          closeMenu={closeMenu}
        />
      </Dropdown.Menu>
    </Dropdown>
  );
}

type GenericTableFilterPillListItemProps = Readonly<
  GenericTableFilterPillDropdownItemProps & {
    showSeparatorBefore: boolean;
  }
>;

function GenericTableFilterPillListItem({
  pill,
  showSeparatorBefore,
  isOpen,
  onOpenChange,
  filterPillSearch,
  setFilterPillSearch,
  filterPillMenuPopperConfig,
}: GenericTableFilterPillListItemProps) {
  return (
    <React.Fragment>
      {showSeparatorBefore && (
        <span style={{ color: "#cbd5e1", fontSize: "16px", userSelect: "none" }}>
          |
        </span>
      )}
      {pill.showDropdown ? (
        <GenericTableFilterPillDropdownItem
          pill={pill}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          filterPillSearch={filterPillSearch}
          setFilterPillSearch={setFilterPillSearch}
          filterPillMenuPopperConfig={filterPillMenuPopperConfig}
        />
      ) : (
        <button className="gt-filter-pill" onClick={pill.onClick}>
          {pill.icon && <span className="me-1">{pill.icon}</span>}
          <span>{pill.label}</span>
        </button>
      )}
    </React.Fragment>
  );
}

type GenericTableFilterPillsListProps = Readonly<{
  filterPills: FilterPill[];
  openFilterPillId: string | null;
  onOpenChange: (pillId: string | null) => void;
  filterPillSearch: Record<string, string>;
  setFilterPillSearch: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  filterPillMenuPopperConfig: FilterPillMenuPopperConfig;
}>;

export function GenericTableFilterPillsList({
  filterPills,
  openFilterPillId,
  onOpenChange,
  filterPillSearch,
  setFilterPillSearch,
  filterPillMenuPopperConfig,
}: GenericTableFilterPillsListProps) {
  const { allPills, separatorIndex } = orderFilterPillsForDisplay(filterPills);

  return (
    <>
      {allPills.map((pill, idx) => (
        <GenericTableFilterPillListItem
          key={pill.id}
          pill={pill}
          showSeparatorBefore={idx === separatorIndex}
          isOpen={openFilterPillId === pill.id}
          onOpenChange={onOpenChange}
          filterPillSearch={filterPillSearch}
          setFilterPillSearch={setFilterPillSearch}
          filterPillMenuPopperConfig={filterPillMenuPopperConfig}
        />
      ))}
    </>
  );
}
