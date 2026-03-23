import React from "react";
import { useRouter } from "next/router";
import { CreateInvoicePageContent } from "@pages/billing/create-invoice";

export default function EditInvoicePage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  return <CreateInvoicePageContent editInvoiceId={id ?? ""} />;
}
