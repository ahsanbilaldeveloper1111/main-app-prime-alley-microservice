export interface FilterOption {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly value: any;
  readonly label: string;
}

export type FilterFieldType =
  | "text"
  | "select"
  | "multi-select"
  | "date"
  | "datetime"
  | "dropdown";

export interface FilterField {
  readonly id: string;
  readonly label: string;
  readonly type: FilterFieldType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly onChange: (value: any) => void;
  readonly placeholder?: string;
  readonly options?: readonly FilterOption[];
  readonly isClearable?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly styles?: any;
  readonly min?: string;
  readonly max?: string;
}
