import React from 'react';
import Select, { Props as ReactSelectProps } from 'react-select';

export interface SelectBoxOption {
  value: string | number;
  label: string;
  [key: string]: any;
}

export interface SelectBoxProps extends Omit<ReactSelectProps, 'options' | 'value' | 'onChange'> {
  options: SelectBoxOption[];
  value?: string | number | (string | number)[] | null;
  onChange?: (value: string | number | (string | number)[] | null) => void;
  isMulti?: boolean;
}

const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: '45px',
    fontSize: '0.875rem',
    borderColor: state.isFocused ? '#86b7fe' : '#dee2e6',
    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none',
    '&:hover': {
      borderColor: '#86b7fe'
    }
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: '#0d6efd',
    color: 'white',
    fontSize: '0.813rem'
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    color: 'white',
    padding: '2px 6px'
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: 'white',
    '&:hover': {
      backgroundColor: '#0b5ed7',
      color: 'white'
    }
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: '#6c757d',
    fontSize: '0.875rem'
  }),
  singleValue: (provided: any) => ({
    ...provided,
    fontSize: '0.875rem'
  })
};

const SelectBox: React.FC<SelectBoxProps> = ({
  options = [],
  value,
  onChange,
  isMulti = false,
  placeholder = 'Select...',
  isClearable = true,
  ...props
}) => {
  // Convert value to react-select format
  const getSelectValue = () => {
    if (value === null || value === undefined) {
      return null;
    }

    if (isMulti) {
      const valueArray = Array.isArray(value) ? value : [value];
      return valueArray.map((val) => {
        const option = options.find((opt) => opt.value === val);
        return option || { value: val, label: String(val) };
      });
    } else {
      const option = options.find((opt) => opt.value === value);
      return option || (value ? { value: value, label: String(value) } : null);
    }
  };

  // Handle onChange from react-select
  const handleChange = (selected: any) => {
    if (!onChange) return;

    if (isMulti) {
      const values = selected ? (selected as SelectBoxOption[]).map((item) => item.value) : [];
      onChange(values.length > 0 ? values : null);
    } else {
      const selectedValue = selected ? (selected as SelectBoxOption).value : null;
      onChange(selectedValue);
    }
  };

  return (
    <Select
      options={options}
      value={getSelectValue()}
      onChange={handleChange}
      isMulti={isMulti}
      placeholder={placeholder}
      isClearable={isClearable}
      styles={customSelectStyles}
      menuPosition="fixed"
      menuPlacement="auto"
      {...props}
    />
  );
};

export default SelectBox;

