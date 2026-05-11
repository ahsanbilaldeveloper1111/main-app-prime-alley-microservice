import { CompanyInfoPageView } from "./CompanyInfoPageView";
import { useCompanyInfoPage } from "./useCompanyInfoPage";

export default function CompanyInfoPage() {
  const { companyDetails, loading } = useCompanyInfoPage();
  return <CompanyInfoPageView companyDetails={companyDetails} loading={loading} />;
}
