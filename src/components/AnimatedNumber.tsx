import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: string | number;
  duration?: number;
}

const AnimatedNumber = ({ value, duration = 1000 }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);

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

  return <h2 className="mb-0 f-w-500">{displayValue.toLocaleString()}</h2>;
};

export default AnimatedNumber;