import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: string | number;
  duration?: number;
  textColor?: string;
  suffix?: string;
  valueType?: string;
  size?: string;
  fontStyle?: string;
}

const AnimatedNumber = ({ value, duration = 1000, textColor = '', suffix = '', valueType = '', size = '', fontStyle = '' }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Function to format seconds as "1m 23s"
  const formatSeconds = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    console.log('formatSeconds input:', seconds, 'minutes:', minutes, 'remainingSeconds:', remainingSeconds);
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  useEffect(() => {
    // Handle undefined, null, or invalid values
    if (value === undefined || value === null) {
      setDisplayValue(0);
      return;
    }

    let start = 0;
    const end = parseInt(value.toString(), 10);
    if (isNaN(end)) {
      setDisplayValue(0);
      return;
    }

    const increment = end / (duration / 10);
    const interval = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(interval);
        setDisplayValue(end);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 10);

    return () => clearInterval(interval);
  }, [value, duration]);

  // Format the display value based on valueType
  const getFormattedValue = () => {
    //console.log('getFormattedValue - valueType:', valueType, 'displayValue:', displayValue);
    if (valueType === 'second' || valueType === 'seconds') {
      const result = formatSeconds(displayValue);
      console.log('Using seconds formatter, result:', result);
      return result;
    }
    const result = displayValue.toLocaleString();
    //console.log('Using default formatter, result:', result);
    return result;
  };

  if(size === 'sm'){
    return <h5 className={`mb-0 f-w-500 ${textColor}`}>{getFormattedValue()}{suffix}</h5>;
  }
  if(size === 'md'){
    return <h4 className={`mb-0 f-w-500 ${textColor}`}>{getFormattedValue()}{suffix}</h4>;
  }
  if(size === 'lg'){
    return <h5 className={`mb-0 f-w-500 ${textColor}`}>{getFormattedValue()}{suffix}</h5>;
  }
  if(size === 'xl'){
    return <h6 className={`mb-0 f-w-500 ${textColor}`}>{getFormattedValue()}{suffix}</h6>;
  }
  return <h2 className={`mb-0 f-w-500 ${textColor} ${fontStyle}`}>{getFormattedValue()}{suffix}</h2>;
};

export default AnimatedNumber;