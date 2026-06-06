import React, { useMemo, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useSession } from "next-auth/react";
import { FiPlus } from "react-icons/fi";
import { FaSync } from "react-icons/fa";
import { toast } from "react-toastify";

import AddUserSidebar from "@page-modules/tms/profiling/user/create/CreateUserProfileSidebar";
import { SyncBillingCompanies } from "@utils/users";

type UsersDirectoryToolbarAction = "add-user" | "sync-users" | "sync-billing";

type UsersDirectoryToolbarActionsProps = Readonly<{
  syncLdapUsers: () => void;
  /** When true, render Bootstrap buttons for the embedded settings toolbar (matches Ranks). */
  embedded?: boolean;
}>;

export function UsersDirectoryToolbarActions({
  syncLdapUsers,
  embedded = false,
}: UsersDirectoryToolbarActionsProps) {
  const { data: session } = useSession();
  const [showAddUserSidebar, setShowAddUserSidebar] = useState(false);
  const [mobileAction, setMobileAction] = useState("");

  const canAddUsers = session?.user?.permissions?.includes("add-users") ?? false;
  const canSyncLdap = session?.user?.permissions?.includes("sync-ldap") ?? false;
  const canSyncBilling = session?.user?.is_admin == "1";

  const mobileActionOptions = useMemo(() => {
    const options: Array<{ value: UsersDirectoryToolbarAction; label: string }> = [];
    if (canAddUsers) {
      options.push({ value: "add-user", label: "Add User" });
    }
    if (canSyncLdap) {
      options.push({ value: "sync-users", label: "Sync Users" });
    }
    if (canSyncBilling) {
      options.push({ value: "sync-billing", label: "Sync Billing Companies" });
    }
    return options;
  }, [canAddUsers, canSyncLdap, canSyncBilling]);

  const syncBillingCompanies = async () => {
    const response = await SyncBillingCompanies();
    if (response) {
      toast.success("Billing companies synced successfully");
    }
  };

  const runAction = (action: UsersDirectoryToolbarAction) => {
    if (action === "add-user") {
      setShowAddUserSidebar(true);
      return;
    }
    if (action === "sync-users") {
      syncLdapUsers();
      return;
    }
    syncBillingCompanies();
  };

  const handleMobileActionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const action = event.target.value as UsersDirectoryToolbarAction | "";
    if (!action) {
      return;
    }
    runAction(action);
    setMobileAction("");
  };

  if (mobileActionOptions.length === 0) {
    return null;
  }

  const actionButtons = (
    <>
      {canAddUsers ? (
        <Button
          variant="primary"
          type="button"
          onClick={() => setShowAddUserSidebar(true)}
        >
          {embedded ? null : <FiPlus size={16} className="me-2" aria-hidden />}
          Add User
        </Button>
      ) : null}
      {canSyncLdap ? (
        <Button variant="primary" type="button" onClick={() => syncLdapUsers()}>
          {embedded ? null : <FaSync size={16} className="me-2" aria-hidden />}
          Sync Users
        </Button>
      ) : null}
      {canSyncBilling ? (
        <Button variant="outline-primary" type="button" onClick={() => syncBillingCompanies()}>
          {embedded ? null : <FaSync size={16} className="me-2" aria-hidden />}
          Sync Billing Companies
        </Button>
      ) : null}
    </>
  );

  return (
    <>
      {embedded ? null : (
        <Form.Select
          className="main-settings-form-select d-md-none mb-3"
          aria-label="User directory actions"
          value={mobileAction}
          onChange={handleMobileActionChange}
        >
          <option value="">Select action</option>
          {mobileActionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      )}

      <div
        className={
          embedded
            ? "users-teams-settings-page__toolbar-actions"
            : "action-buttons d-none d-md-flex justify-content-end gap-2 align-items-end"
        }
      >
        {actionButtons}
      </div>

      <AddUserSidebar
        isOpen={showAddUserSidebar}
        onClose={() => setShowAddUserSidebar(false)}
        title="Add User Profile"
      />
    </>
  );
}
