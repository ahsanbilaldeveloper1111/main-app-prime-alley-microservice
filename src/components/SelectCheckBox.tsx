import React from 'react';
import Select, { MultiValue } from '@components/AppSelect';
import { components, type GroupBase, type OptionProps } from 'react-select';
export interface SelectCheckBoxOption {
  value: number | string;
  label: string;
}

function filterOptionByLabel(
  option: { label: string; value: number | string },
  inputValue: string,
): boolean {
  if (!inputValue.trim()) return true;
  return option.label.toLowerCase().includes(inputValue.trim().toLowerCase());
}

// Keep menu open while toggling options; prevent blur from closing the menu on mousedown.
const OptionWithCheckbox = (props: OptionProps<SelectCheckBoxOption, true, GroupBase<SelectCheckBoxOption>>) => (
  <components.Option
    {...props}
    innerProps={{
      ...props.innerProps,
      onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        props.innerProps.onMouseDown?.(e);
      },
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={props.isSelected}
        readOnly
        tabIndex={-1}
        aria-hidden
        style={{
          cursor: 'pointer',
          pointerEvents: 'none',
          margin: 0,
        }}
      />
      <span style={{ flex: 1 }}>{props.label}</span>
    </div>
  </components.Option>
);

export interface SelectCheckBoxProps {
  options: SelectCheckBoxOption[];
  value: SelectCheckBoxOption[];
  onChange: (selectedOptions: MultiValue<SelectCheckBoxOption>) => void;
  placeholder?: string;
  isLoading?: boolean;
  noOptionsMessage?: ((obj: { inputValue: string }) => React.ReactNode) | string;
  className?: string;
  classNamePrefix?: string;
  isClearable?: boolean;
  isSearchable?: boolean;
  inputValue?: string;
  onInputChange?: (newValue: string, action: { action: string }) => void;
  hideSelectedOptions?: boolean;
  closeMenuOnSelect?: boolean;
  /** Portal menu to body (recommended in modals / side panels). Default true. */
  menuPortalTarget?: HTMLElement | null;
}

const MENU_PORTAL_Z_INDEX = 100000;

function resolveMenuPortalTarget(
  menuPortalTarget: HTMLElement | null | undefined,
): HTMLElement | null {
  if (menuPortalTarget !== undefined) {
    return menuPortalTarget;
  }
  if (globalThis.document === undefined) {
    return null;
  }
  return globalThis.document.body;
}

const SelectCheckBox: React.FC<SelectCheckBoxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Search and select...',
  isLoading = false,
  noOptionsMessage = 'No options found',
  className = 'basic-single',
  classNamePrefix = 'select',
  isClearable = true,
  isSearchable = true,
  inputValue,
  onInputChange,
  hideSelectedOptions = false,
  closeMenuOnSelect = false,
  menuPortalTarget,
}) => {
  const resolvedMenuPortal = resolveMenuPortalTarget(menuPortalTarget);

  return (
    <Select<SelectCheckBoxOption, true>
      className={className}
      classNamePrefix={classNamePrefix}
      isClearable={isClearable}
      isSearchable={isSearchable}
      isMulti
      options={options}
      onChange={onChange}
      value={value}
      filterOption={filterOptionByLabel}
      noOptionsMessage={typeof noOptionsMessage === 'string' ? () => noOptionsMessage : noOptionsMessage}
      placeholder={placeholder}
      isLoading={isLoading}
      components={{ Option: OptionWithCheckbox }}
      hideSelectedOptions={hideSelectedOptions}
      closeMenuOnSelect={closeMenuOnSelect}
      blurInputOnSelect={false}
      inputValue={inputValue}
      onInputChange={onInputChange}
      menuPortalTarget={resolvedMenuPortal}
      menuPosition="fixed"
      menuShouldScrollIntoView={false}
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: MENU_PORTAL_Z_INDEX }),
      }}
    />
  );
};

export default SelectCheckBox;
