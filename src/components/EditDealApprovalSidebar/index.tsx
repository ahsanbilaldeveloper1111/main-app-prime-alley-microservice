import React from "react";
import { CreateDealSidebar } from "@components/renderCreateDealForm";

export interface EditDealApprovalSidebarProps {
  onClose: () => void;
  dealId: number | null;
  onSuccess?: () => void;
}

/**
 * Edit Deal sidebar for the Deals Approval page.
 * Wraps CreateDealSidebar in edit-only mode (dealId required).
 */
export const EditDealApprovalSidebar: React.FC<EditDealApprovalSidebarProps> = ({
  onClose,
  dealId,
  onSuccess,
}) => {
  if (dealId == null) return null;

  return (
    <CreateDealSidebar
      onClose={onClose}
      dealId={dealId}
      onSuccess={onSuccess}
    />
  );
};

export default EditDealApprovalSidebar;
