/**
 * Optional display flags for CRM list/detail pages used both as `/crm/*` routes
 * and when embedded in main-settings Smart CRM.
 */
export type CrmPageDisplayProps = {
  /** When true, omit the CRM dashboard breadcrumb (parent shell already provides context). */
  readonly hideBreadcrumb?: boolean
  /** Breadcrumb parent link when shown (main settings or legacy settings hub). */
  readonly breadcrumbMainLink?: string
}
