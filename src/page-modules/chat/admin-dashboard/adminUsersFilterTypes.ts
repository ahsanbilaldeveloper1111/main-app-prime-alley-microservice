export type AdminUsersFilterForm = Readonly<{
  tenantId: string;
}>;

export const defaultAdminUsersFilters = (): AdminUsersFilterForm => ({
  tenantId: "",
});
