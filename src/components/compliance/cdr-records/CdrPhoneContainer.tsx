import parsePhoneNumber from "libphonenumber-js";
import React, { useCallback, useMemo, useState } from "react";
import { Badge, Button, Popover, OverlayTrigger } from "react-bootstrap";
import { Phone } from "lucide-react";

import "./cdrRecordsPage.scss";

export interface CdrPhoneContainerProps {
  phone: string;
  onClick?: () => void;
}

export function CdrPhoneContainer(
  props: Readonly<CdrPhoneContainerProps>,
): React.ReactElement {
  const { phone, onClick } = props;
  const [showPopover, setShowPopover] = useState(false);

  const parsePhone = useCallback((raw: string) => {
    if (!raw)
      return {
        phone: "N/A",
        countryCode: "",
      };
    try {
      const parsedPhone = parsePhoneNumber(raw);
      return {
        phone: parsedPhone?.formatInternational() || raw,
        countryCode: parsedPhone?.country || "",
      };
    } catch (e) {
      console.error(e);
      return {
        phone: raw,
        countryCode: "",
      };
    }
  }, []);

  const getFlagImgSrc = useCallback((countryCode: string) => {
    return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
  }, []);

  const phoneNumber = useMemo(() => {
    return phone
      ? parsePhone(phone)
      : {
          phone: "N/A",
          countryCode: "",
        };
  }, [phone, parsePhone]);

  const flagImgSrc = getFlagImgSrc(phoneNumber.countryCode);

  const phoneBadge = (
    <Badge
      bg="info"
      className={`bg-opacity-10 text-dark cdrRecords-phoneBadge${
        onClick ? " cdrRecords-phoneBadge--clickable" : ""
      }`}
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <div className="d-flex align-items-center gap-2">
        {phoneNumber?.countryCode && (
          <img src={flagImgSrc} alt={phoneNumber.countryCode} />
        )}
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
      className="cdrRecords-popover"
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <Popover.Body className="p-0 cdrRecords-popoverBody">
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
            setShowPopover(false);
          }}
          className="d-flex align-items-center justify-content-center gap-2 w-100 cdrRecords-callBtn"
        >
          <Phone size={18} className="cdrRecords-callBtnIcon" />
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
      <span className="cdrRecords-overlayAnchor">{phoneBadge}</span>
    </OverlayTrigger>
  );
}
