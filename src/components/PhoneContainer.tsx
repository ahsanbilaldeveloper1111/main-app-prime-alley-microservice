import React, { useCallback, useMemo } from 'react';
import { Badge } from 'react-bootstrap';
import parsePhoneNumber from 'libphonenumber-js';

interface PhoneContainerProps {
  phone: string;
  showBadge?: boolean;
}

const PhoneContainer: React.FC<PhoneContainerProps> = ({ phone, showBadge = true }) => {
  const parsePhone = useCallback((phone: string) => {
    if (!phone)
      return {
        phone: "N/A",
        countryCode: "",
      };
    try {
      const parsedPhone = parsePhoneNumber(phone);
      return {
        phone: parsedPhone?.formatInternational() || phone,
        countryCode: parsedPhone?.country || "",
      };
    } catch (e) {
      console.error(e);
      return {
        phone: phone,
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

  const phoneContent = (
    <div className="d-flex align-items-center gap-2">
      {phoneNumber?.countryCode && (
        <img src={flagImgSrc} alt={phoneNumber.countryCode} />
      )}
      {phoneNumber.phone}
    </div>
  );

  if (showBadge) {
    return (
      <Badge bg="info" className="bg-opacity-10 text-dark">
        {phoneContent}
      </Badge>
    );
  }

  return phoneContent;
};

export default PhoneContainer;

