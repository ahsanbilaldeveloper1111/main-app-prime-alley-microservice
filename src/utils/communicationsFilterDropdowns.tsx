import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";

interface TextFilterMenuProps {
  value: string;
  onChange: (value: string) => void;
  onApply: (value: string) => void;
  closeMenu: () => void;
  placeholder: string;
}

const TextFilterMenu: React.FC<TextFilterMenuProps> = ({
  value,
  onChange,
  onApply,
  closeMenu,
  placeholder,
}) => {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  return (
    <div className="d-flex flex-column gap-2" style={{ minWidth: 240 }}>
      <Form.Control
        size="sm"
        type="text"
        placeholder={placeholder}
        value={draftValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setDraftValue(e.target.value);
        }}
      />
      <div className="d-flex justify-content-end gap-2">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => {
            setDraftValue(value);
            closeMenu();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            onChange(draftValue);
            onApply(draftValue.trim());
            closeMenu();
          }}
        >
          Select
        </Button>
      </div>
    </div>
  );
};

interface DateTimeFilterMenuProps {
  value: string;
  onChange: (value: string) => void;
  onApply: (value: string) => void;
  closeMenu: () => void;
}

const DateTimeFilterMenu: React.FC<DateTimeFilterMenuProps> = ({
  value,
  onChange,
  onApply,
  closeMenu,
}) => {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  return (
    <div className="d-flex flex-column gap-2" style={{ minWidth: 240 }}>
      <Form.Control
        size="sm"
        type="datetime-local"
        value={draftValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setDraftValue(e.target.value);
        }}
      />
      <div className="d-flex justify-content-end gap-2">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => {
            setDraftValue(value);
            closeMenu();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            onChange(draftValue);
            onApply(draftValue);
            closeMenu();
          }}
        >
          Select
        </Button>
      </div>
    </div>
  );
};

export function createTextFilterDropdownContent(
  value: string,
  onChange: (value: string) => void,
  onApply: (value: string) => void,
  placeholder: string,
) {
  return function TextDropdownRender({
    closeMenu,
  }: {
    closeMenu: () => void;
  }) {
    return (
      <TextFilterMenu
        value={value}
        onChange={onChange}
        onApply={onApply}
        closeMenu={closeMenu}
        placeholder={placeholder}
      />
    );
  };
}

function parseCommaSeparatedNumbers(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

interface CalledNumbersFilterMenuProps {
  value: string;
  onChange: (values: string[]) => void;
  onApply: (values: string[]) => void;
  closeMenu: () => void;
  placeholder: string;
}

const CalledNumbersFilterMenu: React.FC<CalledNumbersFilterMenuProps> = ({
  value,
  onChange,
  onApply,
  closeMenu,
  placeholder,
}) => {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  return (
    <div className="d-flex flex-column gap-2" style={{ minWidth: 260 }}>
      <Form.Control
        size="sm"
        type="text"
        placeholder={placeholder}
        value={draftValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setDraftValue(e.target.value);
        }}
      />
      <div className="d-flex justify-content-end gap-2">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => {
            setDraftValue(value);
            closeMenu();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            const values = parseCommaSeparatedNumbers(draftValue);
            onChange(values);
            onApply(values);
            closeMenu();
          }}
        >
          Select
        </Button>
      </div>
    </div>
  );
};

export function createCalledNumbersDropdownContent(
  value: string,
  onChange: (values: string[]) => void,
  onApply: (values: string[]) => void,
  placeholder = "Enter numbers (comma separated)",
) {
  return function CalledNumbersDropdownRender({
    closeMenu,
  }: {
    closeMenu: () => void;
  }) {
    return (
      <CalledNumbersFilterMenu
        value={value}
        onChange={onChange}
        onApply={onApply}
        closeMenu={closeMenu}
        placeholder={placeholder}
      />
    );
  };
}

export function createDateTimeDropdownContent(
  value: string,
  onChange: (value: string) => void,
  onApply: (value: string) => void,
) {
  return function DateTimeDropdownRender({
    closeMenu,
  }: {
    closeMenu: () => void;
  }) {
    return (
      <DateTimeFilterMenu
        value={value}
        onChange={onChange}
        onApply={onApply}
        closeMenu={closeMenu}
      />
    );
  };
}
