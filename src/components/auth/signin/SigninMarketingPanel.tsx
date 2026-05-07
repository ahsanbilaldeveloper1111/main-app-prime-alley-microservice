import React from "react";

export function SigninMarketingPanel(): React.ReactElement {
  return (
    <div className="auth-sidecontent">
      <div className="auth-sidefooter">
        <h1 className="f-w-700 mb-1 text-white">Business Workspace </h1>
        <p className="mb-3 text-white">
          AI-Powered Business Suite for businesses worldwide—SMB to Enterprises
        </p>

        <hr className="mb-3 mt-4" />
        <div className="row">
          <div className="col my-1">
            <p className="m-0">© {new Date().getFullYear()} All rights reserved.</p>
          </div>
          <div className="col-auto my-1" />
        </div>
      </div>
    </div>
  );
}
