import React from "react";

import "./addRecordsPage.scss";

export function AddRecordsPageHeader(): React.ReactElement {
  return (
    <div className="mb-4">
      <h4 className="addRecordsPage-pageTitle">
        Local DND Call Block Management
      </h4>
      <p className="addRecordsPage-pageSubtitle">
        Manage company-specific blocked numbers
      </p>
    </div>
  );
}
