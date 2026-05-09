import { DocumentsPageView } from "./DocumentPageView";
import { useDocumentsPage } from "./useDocumentsPage";

export default function DocumentsPage() {
  const p = useDocumentsPage();
  return <DocumentsPageView {...p} />;
}
