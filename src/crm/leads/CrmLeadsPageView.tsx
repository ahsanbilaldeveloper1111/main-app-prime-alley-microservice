import type { CrmLeadsPageModel } from "./useCrmLeadsPageModel";
import { LeadsPageContext } from "./leadsPageContext";
import {
  CrmLeadsViewFragment01,
  CrmLeadsViewFragment02,
  CrmLeadsViewFragment03,
  CrmLeadsViewFragment04,
  CrmLeadsViewFragment05,
  CrmLeadsViewFragment06,
  CrmLeadsViewFragment07,
  CrmLeadsViewFragment08,
  CrmLeadsViewFragment09,
  CrmLeadsViewFragment10,
} from "./CrmLeadsViewFragments";

type CrmLeadsPageViewProps = Readonly<{ page: CrmLeadsPageModel }>;

export function CrmLeadsPageView({ page }: CrmLeadsPageViewProps) {
  return (
    <LeadsPageContext.Provider value={page}>
      <CrmLeadsViewFragment01 />
      <CrmLeadsViewFragment02 />
      <CrmLeadsViewFragment03 />
      <CrmLeadsViewFragment04 />
      <CrmLeadsViewFragment05 />
      <CrmLeadsViewFragment06 />
      <CrmLeadsViewFragment07 />
      <CrmLeadsViewFragment08 />
      <CrmLeadsViewFragment09 />
      <CrmLeadsViewFragment10 />
    </LeadsPageContext.Provider>
  );
}
