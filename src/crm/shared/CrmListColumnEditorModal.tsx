import ColumnEditorModal, {
  type ColumnOption,
} from "@components/ColumnEditorModal";
import { persistVisibleColumnKeys } from "@utils/crmListVisibleColumnsStorage";

export type CrmListColumnEditorModalProps = Readonly<{
  show: boolean;
  onHide: () => void;
  columns: ColumnOption[];
  selectedColumnKeys: string[];
  storageKey: string;
  onSelectedKeysChange: (keys: string[]) => void;
}>;

export function CrmListColumnEditorModal({
  show,
  onHide,
  columns,
  selectedColumnKeys,
  storageKey,
  onSelectedKeysChange,
}: CrmListColumnEditorModalProps) {
  return (
    <ColumnEditorModal
      show={show}
      onHide={onHide}
      columns={columns}
      selectedColumnKeys={selectedColumnKeys}
      onApply={(keys) => {
        onSelectedKeysChange(keys);
        persistVisibleColumnKeys(storageKey, keys);
      }}
    />
  );
}
