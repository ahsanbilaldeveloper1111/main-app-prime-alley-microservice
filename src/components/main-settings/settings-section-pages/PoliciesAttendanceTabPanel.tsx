import { CompanyConfigTab } from '@page-modules/workforce/company-config/CompanyConfigTab'
import { HolidayManagementTab } from '@page-modules/workforce/holiday-calendars/HolidayManagementTab'
import { ShiftManagementTab } from '@page-modules/workforce/shifts/ShiftManagementTab'
import React from 'react'

function renderPoliciesAttendancePanel(activeTab: string): React.ReactNode {
  switch (activeTab) {
    case 'company-config':
      return <CompanyConfigTab />
    case 'shift-management':
      return <ShiftManagementTab />
    case 'holiday-management':
      return <HolidayManagementTab />
    default:
      return null
  }
}

export function PoliciesAttendanceTabPanel({ activeTab }: Readonly<{ activeTab: string }>) {
  return (
    <div className="policies-attendance-settings-panel">
      {renderPoliciesAttendancePanel(activeTab)}
    </div>
  )
}
