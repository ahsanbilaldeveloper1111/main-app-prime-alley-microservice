import React from 'react';
import Select, { MultiValue } from '@components/AppSelect';
import { components } from 'react-select';

// Custom Option component with checkbox for multi-select
const OptionWithCheckbox = (props: any) => {
    return (
        <components.Option {...props}>
            <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    cursor: 'pointer'
                }}
            >
                <input
                    type="checkbox"
                    checked={props.isSelected}
                    readOnly
                    style={{ 
                        cursor: 'pointer', 
                        pointerEvents: 'none',
                        margin: 0
                    }}
                />
                <span style={{ flex: 1 }}>{props.label}</span>
            </div>
        </components.Option>
    );
};

export interface SelectCheckBoxOption {
    value: number | string;
    label: string;
}

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
}

const SelectCheckBox: React.FC<SelectCheckBoxProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select options...",
    isLoading = false,
    noOptionsMessage = "No options found",
    className = "basic-single",
    classNamePrefix = "select",
    isClearable = true,
    isSearchable = true,
    inputValue,
    onInputChange,
    hideSelectedOptions = false,
    closeMenuOnSelect = false,
}) => {
    return (
        <Select
            className={className}
            classNamePrefix={classNamePrefix}
            isClearable={isClearable}
            isSearchable={isSearchable}
            isMulti={true}
            options={options}
            onChange={onChange}
            value={value}
            noOptionsMessage={typeof noOptionsMessage === 'string' ? () => noOptionsMessage : noOptionsMessage}
            placeholder={placeholder}
            isLoading={isLoading}
            components={{ Option: OptionWithCheckbox }}
            hideSelectedOptions={hideSelectedOptions}
            closeMenuOnSelect={closeMenuOnSelect}
            inputValue={inputValue}
            onInputChange={onInputChange}
        />
    );
};

export default SelectCheckBox;

