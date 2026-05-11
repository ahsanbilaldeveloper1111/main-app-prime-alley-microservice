import React from 'react';
import ReactSelect, { Props as ReactSelectProps } from 'react-select';

export interface SelectProps extends ReactSelectProps {
  classNamePrefix?: string;
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

const ThemeSelect: React.FC<SelectProps> = ({ classNamePrefix = 'theme-react-select', ...props }) => {
  return (
    <>
      <ReactSelect classNamePrefix={classNamePrefix} isClearable={true} {...props} />
      <style>{`
        .theme-react-select__control {
          border-color: var(--bs-border-color) !important;
          min-height: 48px !important;
          border-radius: 8px !important;
        }
      `}</style>
    </>
  );
};

export default ThemeSelect;

