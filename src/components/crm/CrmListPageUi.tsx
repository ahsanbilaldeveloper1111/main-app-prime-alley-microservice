import React, { useCallback, useMemo, useState } from "react";
import parsePhoneNumber from "libphonenumber-js";
import {
  Badge,
  Button,
  Card,
  Form,
  InputGroup,
  OverlayTrigger,
  Popover,
} from "react-bootstrap";
import { FiFilter, FiSearch } from "react-icons/fi";
import { ArrowDown, ArrowUp, Phone } from "lucide-react";
import {
  applyCrmKpiCardHover,
  applyCrmPopoverCallButtonHover,
  buildCrmQuickFilterButtonStyle,
  crmPopoverCallButtonInlineStyle,
  getCrmKpiCardStyle,
  quickFilterButtonVariant,
  resetCrmKpiCardHover,
  resetCrmPopoverCallButtonHover,
} from "./crmListPageUiHelpers";

export type ParsedPhoneForDisplay = {
  phone: string;
  countryCode: string;
};

export function parsePhoneForDisplay(phone: string): ParsedPhoneForDisplay {
  if (!phone) {
    return { phone: "N/A", countryCode: "" };
  }
  try {
    const parsedPhone = parsePhoneNumber(phone);
    return {
      phone: parsedPhone?.formatInternational() || phone,
      countryCode: parsedPhone?.country || "",
    };
  } catch (e) {
    console.error(e);
    return { phone, countryCode: "" };
  }
}

export function flagImgSrcForCountry(countryCode: string): string {
  return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
}

export const CrmPhoneDisplay: React.FC<{ phone: string }> = ({ phone }) => {
  const phoneNumber = useMemo(() => parsePhoneForDisplay(phone), [phone]);
  const flagSrc = flagImgSrcForCountry(phoneNumber.countryCode);
  return (
    <div className="d-flex align-items-center gap-2">
      {phoneNumber.countryCode ? (
        <img src={flagSrc} alt={phoneNumber.countryCode} />
      ) : null}
      {phoneNumber.phone}
    </div>
  );
};

export const CrmPhoneContainer: React.FC<{
  phone: string;
  onClick?: () => void;
}> = ({ phone, onClick }) => {
  const [showPopover, setShowPopover] = useState(false);

  const parsePhone = useCallback((raw: string) => parsePhoneForDisplay(raw), []);

  const phoneNumber = useMemo(
    () => (phone ? parsePhone(phone) : { phone: "N/A", countryCode: "" }),
    [phone, parsePhone],
  );

  const flagImgSrc = flagImgSrcForCountry(phoneNumber.countryCode);

  const phoneBadge = (
    <Badge
      bg="info"
      className="bg-opacity-10 text-dark"
      style={{ cursor: onClick ? "pointer" : "default" }}
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <div className="d-flex align-items-center gap-2">
        {phoneNumber.countryCode ? (
          <img src={flagImgSrc} alt={phoneNumber.countryCode} />
        ) : null}
        {phoneNumber.phone}
      </div>
    </Badge>
  );

  if (!onClick) {
    return phoneBadge;
  }

  const popover = (
    <Popover
      id={`phone-popover-${phone}`}
      style={{
        maxWidth: "160px",
        pointerEvents: "auto",
        border: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
      }}
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <Popover.Body
        className="p-0"
        style={{
          padding: "8px",
          borderRadius: "8px",
        }}
      >
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
            setShowPopover(false);
          }}
          className="d-flex align-items-center justify-content-center gap-2 w-100"
          style={crmPopoverCallButtonInlineStyle}
          onMouseEnter={(e) => applyCrmPopoverCallButtonHover(e.currentTarget)}
          onMouseLeave={(e) => resetCrmPopoverCallButtonHover(e.currentTarget)}
        >
          <Phone size={18} style={{ strokeWidth: 2.5 }} />
          <span>Call</span>
        </Button>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      show={showPopover}
      placement="top"
      overlay={popover}
      trigger={[]}
    >
      <span style={{ display: "inline-block" }}>{phoneBadge}</span>
    </OverlayTrigger>
  );
};

export interface CrmKPICardData {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

export const CrmKPICard: React.FC<CrmKPICardData> = ({
  title,
  value,
  change,
  isPositive,
  icon,
  color,
  onClick,
}) => {
  return (
    <Card
      className={onClick ? "h-100" : ""}
      style={getCrmKpiCardStyle(onClick)}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) applyCrmKpiCardHover(e.currentTarget);
      }}
      onMouseLeave={(e) => {
        if (onClick) resetCrmKpiCardHover(e.currentTarget);
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`bg-${color} bg-opacity-10 rounded p-3`}>
            <div className={`text-${color}`}>{icon}</div>
          </div>
          {change ? (
            <Badge
              bg={isPositive ? "success" : "danger"}
              className="bg-opacity-10"
            >
              {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {change}
            </Badge>
          ) : null}
        </div>
        <h3 className="mb-1">{value}</h3>
        <p className="text-muted mb-0 small">{title}</p>
      </Card.Body>
    </Card>
  );
};

export interface CrmFilterBarQuickFilter {
  id: string;
  label: string;
  count?: number;
  variant?: string;
  color?: string;
  icon?: React.ReactNode;
}

export interface CrmFilterBarProps {
  quickFilters: CrmFilterBarQuickFilter[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;
  searchPlaceholder?: string;
  showAdvancedFilters?: boolean;
  onToggleAdvancedFilters?: () => void;
  advancedFilterCount?: number;
}

export const CrmFilterBar: React.FC<CrmFilterBarProps> = ({
  quickFilters,
  activeFilter,
  onFilterChange,
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = "Search...",
  showAdvancedFilters,
  onToggleAdvancedFilters,
  advancedFilterCount = 0,
}) => {
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body className="p-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3">
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map((filter) => {
              const isActive = activeFilter === filter.id;
              const hasCustomColor = Boolean(filter.color);
              const buttonStyle = buildCrmQuickFilterButtonStyle(
                filter,
                isActive,
              );

              return (
                <Button
                  key={filter.id}
                  variant={quickFilterButtonVariant(
                    hasCustomColor,
                    isActive,
                    filter,
                  )}
                  onClick={() => onFilterChange?.(filter.id)}
                  className="d-flex align-items-center gap-2 "
                  style={buttonStyle}
                >
                  <span className="d-flex align-items-center gap-2">
                    {filter.icon ? (
                      <span className="d-flex align-items-center">
                        {filter.icon}
                      </span>
                    ) : null}
                    {filter.label}
                  </span>
                </Button>
              );
            })}
          </div>

          {(onSearchChange || onToggleAdvancedFilters) && (
            <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center flex-shrink-0">
              {onSearchChange && onSearch ? (
                <InputGroup
                  style={{ width: "300px", minWidth: "200px" }}
                  className="flex-shrink-0"
                >
                  <Form.Control
                    style={{ height: "41px" }}
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue || ""}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && onSearch) {
                        onSearch();
                      }
                    }}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => onSearch?.()}
                  >
                    <FiSearch size={16} />
                  </Button>
                </InputGroup>
              ) : null}
              {onToggleAdvancedFilters ? (
                <Button
                  variant={
                    showAdvancedFilters ? "primary" : "outline-secondary"
                  }
                  onClick={onToggleAdvancedFilters}
                  className="d-flex align-items-center flex-shrink-0"
                >
                  <FiFilter size={16} className="me-2" />
                  Filters
                  {(advancedFilterCount ?? 0) > 0 ? (
                    <Badge bg="light" text="dark" className="ms-2">
                      {advancedFilterCount}
                    </Badge>
                  ) : null}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};
