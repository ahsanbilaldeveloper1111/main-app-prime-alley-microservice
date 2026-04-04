import { useEffect, type Dispatch, type SetStateAction } from "react";

export function useCrmListClearSelectedRowsEffect(
  clearSelectedRows: boolean,
  setSelectedItems: Dispatch<SetStateAction<number[]>>,
) {
  useEffect(() => {
    if (clearSelectedRows) {
      setSelectedItems([]);
    }
  }, [clearSelectedRows, setSelectedItems]);
}
