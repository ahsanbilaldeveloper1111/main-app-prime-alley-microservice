import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: string | number;
  duration?: number;
  textColor?: string;
  suffix?: string;
  prefix?: string;
  valueType?: string;
  size?: string;
  fontStyle?: string;
}

const AnimatedNumber = ({ value, duration = 1000, textColor = '', suffix = '', prefix = '', valueType = '', size = '', fontStyle = '' }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  const formatSeconds = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    //console.log('formatSeconds input:', seconds, 'minutes:', minutes, 'remainingSeconds:', remainingSeconds);
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Function to format seconds as "1m 23s"
  const formatSecondsInHHMMSS = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    //console.log('formatSeconds input:', seconds, 'hours:', hours, 'minutes:', minutes, 'remainingSeconds:', remainingSeconds);
    
    const parts = [];
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    if (remainingSeconds > 0 || parts.length === 0) {
      parts.push(`${remainingSeconds}s`);
    }
    
    return parts.join(' ');
  };

  useEffect(() => {
    // Handle undefined, null, or invalid values
    if (value === undefined || value === null) {
      setDisplayValue(0);
      return;
    }

    let start = 0;
    
    // For cost type, handle special string values
    if (valueType === 'cost' && typeof value === 'string' && value.startsWith('.')) {
      setDisplayValue(0);
      return;
    }
    
    const end = Number(value);
    if (isNaN(end)) {
      setDisplayValue(0);
      return;
    }

    // For cost type, multiply by 100 to handle decimals properly
    const scaledEnd = valueType === 'cost' ? Math.round(end * 100) : end;
    const increment = scaledEnd / (duration / 10);
    const interval = setInterval(() => {
      start += increment;
      if (start >= scaledEnd) {
        clearInterval(interval);
        setDisplayValue(valueType === 'cost' ? end : scaledEnd);
      } else {
        setDisplayValue(valueType === 'cost' ? start / 100 : Math.floor(start));
      }
    }, 10);

    return () => clearInterval(interval);
  }, [value, duration]);

  // Format the display value based on valueType
  const getFormattedValue = () => {
    if (valueType === 'second' || valueType === 'seconds') {
      return formatSeconds(displayValue);
    }
    if (valueType === 'cost') {
      // Handle string values like ".00000" directly
      if (typeof value === 'string' && value.startsWith('.')) {
        return '0.00';
      }
      return Number(displayValue).toFixed(2);
    }
    return displayValue.toLocaleString();
  };

  if(size === 'sm'){
    return <h5 className={`mb-0 f-w-500 ${textColor}`}>{prefix}{getFormattedValue()}{suffix}</h5>;
  }
  if(size === 'md'){
    return <h4 className={`mb-0 f-w-500 ${textColor}`}>{prefix}{getFormattedValue()}{suffix}</h4>;
  }
  if(size === 'lg'){
    return <h5 className={`mb-0 f-w-500 ${textColor}`}>{prefix}{getFormattedValue()}{suffix}</h5>;
  }
  if(size === 'xl'){
    return <h6 className={`mb-0 f-w-500 ${textColor}`}>{prefix}{getFormattedValue()}{suffix}</h6>;
  }
  return <h2 className={`mb-0 f-w-500 ${textColor} ${fontStyle}`}>{prefix}{getFormattedValue()}{suffix}</h2>;
};

export default AnimatedNumber;