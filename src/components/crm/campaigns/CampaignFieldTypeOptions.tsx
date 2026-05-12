import React from "react";

export function CampaignFieldTypeOptions(): React.ReactElement {
  return (
    <>
      <option value="string">Text</option>
      <option value="integer">Number</option>
      <option value="date">Date</option>
      <option value="email">Email</option>
      <option value="dropdown">Dropdown</option>
    </>
  );
}
