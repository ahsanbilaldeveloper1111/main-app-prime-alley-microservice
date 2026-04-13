import { useCallback, useEffect, useMemo, useState } from "react";

type UseDebouncedSearchInputOptions = {
  initialValue?: string;
  delayMs?: number;
  normalize?: (value: string) => string;
};

const DEFAULT_DELAY_MS = 400;

export function useDebouncedSearchInput(
  options: UseDebouncedSearchInputOptions = {},
) {
  const {
    initialValue = "",
    delayMs = DEFAULT_DELAY_MS,
    normalize,
  } = options;

  const normalizeValue = useMemo(
    () => normalize ?? ((value: string) => value),
    [normalize],
  );

  const [inputValue, setInputValue] = useState<string>(() =>
    normalizeValue(initialValue),
  );
  const [queryValue, setQueryValue] = useState<string>(() =>
    normalizeValue(initialValue),
  );

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      const next = normalizeValue(inputValue);
      setQueryValue((prev) => (prev === next ? prev : next));
    }, delayMs);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [delayMs, inputValue, normalizeValue]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(normalizeValue(value));
    },
    [normalizeValue],
  );

  const submitQuery = useCallback(() => {
    const next = normalizeValue(inputValue);
    setInputValue(next);
    setQueryValue((prev) => (prev === next ? prev : next));
  }, [inputValue, normalizeValue]);

  return {
    inputValue,
    setInputValue,
    queryValue,
    setQueryValue,
    handleInputChange,
    submitQuery,
  };
}
