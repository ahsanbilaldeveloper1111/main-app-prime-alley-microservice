import { createContext, useContext } from "react";
import type { CrmLeadsPageModel } from "./useCrmLeadsPageModel";

export const LeadsPageContext = createContext<CrmLeadsPageModel | null>(null);

export function useLeadsPageContext(): CrmLeadsPageModel {
  const ctx = useContext(LeadsPageContext);
  if (!ctx) {
    throw new Error("useLeadsPageContext must be used within LeadsPageContext.Provider");
  }
  return ctx;
}
