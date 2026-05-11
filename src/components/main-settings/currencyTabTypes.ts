export interface Currency {
  id: number
  name: string
  exchangeRate: string | null
  format: string
  lastUpdatedDate: string
  lastUpdatedSource: string
  updatedBy?: string
  isCompanyCurrency?: boolean
}
