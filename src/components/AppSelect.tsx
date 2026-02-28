/**
 * Global wrapper around react-select that fixes the "first character not showing"
 * when typing in searchable selects (e.g. in modals). Uses capture-phase keydown
 * so the first key is applied before react-select uses it for "type to jump".
 *
 * Use this instead of importing from "react-select" wherever you need searchable selects.
 * Re-exports Select types (SingleValue, MultiValue, etc.) for convenience.
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import ReactSelect, { Props, type GroupBase } from "react-select";

export type { Props as ReactSelectProps } from "react-select";
export type {
  SingleValue,
  MultiValue,
  GroupBase,
  StylesConfig,
  ThemeConfig,
} from "react-select";

export interface AppSelectProps<Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>
  extends Props<Option, IsMulti, Group> {
  /** Optional: reset search input when this value changes (e.g. when parent clears the select) */
  resetSearchOnValueChange?: unknown;
}

function AppSelectInner<Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
  props: AppSelectProps<Option, IsMulti, Group>
) {
  const {
    inputValue: controlledInputValue,
    onInputChange: controlledOnInputChange,
    onChange,
    isSearchable = true,
    openMenuOnFocus,
    resetSearchOnValueChange,
    value,
    ...rest
  } = props;

  const isControlled = controlledInputValue !== undefined || controlledOnInputChange !== undefined;
  const [internalInputValue, setInternalInputValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const inputValue = isControlled ? (controlledInputValue as string) : internalInputValue;

  useEffect(() => {
    if (resetSearchOnValueChange !== undefined && !isControlled) {
      setInternalInputValue("");
    }
  }, [resetSearchOnValueChange, isControlled]);

  const handleKeyDownCapture = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        !isSearchable ||
        isControlled ||
        wrapperRef.current?.contains(e.target as Node) !== true ||
        inputValue !== "" ||
        e.key.length !== 1 ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.repeat
      ) {
        return;
      }
      setInternalInputValue(e.key);
      e.preventDefault();
      e.stopPropagation();
    },
    [isSearchable, isControlled, inputValue]
  );

  const handleInputChange = useCallback(
    (newValue: string, actionMeta: any) => {
      if (!isControlled) {
        setInternalInputValue(newValue);
      }
      controlledOnInputChange?.(newValue, actionMeta);
    },
    [isControlled, controlledOnInputChange]
  );

  const handleChange = useCallback(
    (newValue: any, actionMeta: any) => {
      if (!isControlled) {
        setInternalInputValue("");
      }
      onChange?.(newValue, actionMeta);
    },
    [isControlled, onChange]
  );

  const selectProps: Props<Option, IsMulti, Group> = {
    ...rest,
    value,
    onChange: handleChange,
    isSearchable,
    openMenuOnFocus: openMenuOnFocus ?? true,
    ...(isSearchable && {
      inputValue: inputValue ?? "",
      onInputChange: handleInputChange,
    }),
  };

  if (!isSearchable) {
    return <ReactSelect {...selectProps} />;
  }

  return (
    <div ref={wrapperRef} onKeyDownCapture={handleKeyDownCapture}>
      <ReactSelect {...selectProps} />
    </div>
  );
}

function AppSelect<Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
  props: AppSelectProps<Option, IsMulti, Group>
) {
  return <AppSelectInner<Option, IsMulti, Group> {...props} />;
}

export default AppSelect;
