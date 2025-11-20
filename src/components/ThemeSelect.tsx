import React from 'react';
import ReactSelect, { Props as ReactSelectProps } from 'react-select';

export interface SelectProps extends ReactSelectProps {
  classNamePrefix?: string;
}

const ThemeSelect: React.FC<SelectProps> = ({ classNamePrefix = 'theme-react-select', ...props }) => {
  return (
    <>
      <ReactSelect classNamePrefix={classNamePrefix} isClearable={true} {...props} />
      <style jsx global>{`
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

