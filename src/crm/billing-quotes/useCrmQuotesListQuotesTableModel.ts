import { useMemo } from "react";
import type { NextRouter } from "next/router";
import type { TableAction, TableColumn } from "@components/GenericTable";
import {
  buildCrmQuotesListTableActions,
  buildCrmQuotesListTableColumns,
} from "./crmQuotesListStatsAndTable";

export type UseCrmQuotesListQuotesTableModelParams = Readonly<{
  extensions: Array<{ id?: string; display_name?: string }>;
  handleViewData: (row: any) => void;
  permissions: string[] | undefined;
  router: NextRouter;
  handleDuplicateQuote: (quote: any) => void;
  handleSendToContact: (quote: any) => void;
  onRequestDeleteSingleRow: (row: any) => void;
}>;

/**
 * Memoized quote list columns + row actions (billing + CRM quotes pages).
 */
export function useCrmQuotesListQuotesTableModel(
  params: UseCrmQuotesListQuotesTableModelParams,
): {
  quotesColumns: TableColumn<any>[];
  quotesActions: TableAction<any>[];
} {
  const {
    extensions,
    handleViewData,
    permissions,
    router,
    handleDuplicateQuote,
    handleSendToContact,
    onRequestDeleteSingleRow,
  } = params;

  const quotesColumns = useMemo(
    () =>
      buildCrmQuotesListTableColumns({
        extensions,
        handleViewData,
      }),
    [extensions, handleViewData],
  );

  const quotesActions = useMemo(
    () =>
      buildCrmQuotesListTableActions({
        permissions,
        router,
        handleViewData,
        handleDuplicateQuote,
        handleSendToContact,
        onRequestDeleteSingleRow,
      }),
    [
      handleDuplicateQuote,
      handleSendToContact,
      handleViewData,
      onRequestDeleteSingleRow,
      permissions,
      router,
    ],
  );

  return { quotesColumns, quotesActions };
}
