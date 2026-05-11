import React, { forwardRef } from "react";
import { Card, Form, Button } from "react-bootstrap";
import Select from "@components/AppSelect";
import { VerifyUserInfoParams } from "@models/tms/UnfidiedOp";
import { MobileUser, DNCRCallingAccess, FacInfoCallingAccess } from "@models/tms/Company";

const SELECT_MENU_Z = 1000001;

interface SelectOption {
  value: number | string;
  label: string;
}

export interface CallingAccessFormProps {
  verifyUserInfoFormData: VerifyUserInfoParams;
  handleVerifyUserInfoChange: (field: keyof VerifyUserInfoParams, value: any) => void;
  errors: any;
  touched: any;
  companyData: any;
  company_id: number | null;
  companyName: string;
  callAccessOptions: SelectOption[];
  iccidOptions: SelectOption[];
  callRepetitionOptions: SelectOption[];
  deviceTypeOptions: SelectOption[];
  completedSteps: Set<number>;
  hasPreviousStepChanges: boolean;
  getCurrentLoadingState: (step: number) => boolean;
  canProceedToNext: (step: number) => boolean;
  onSubmit: () => void;
  /** @default true */
  showCallingAccessHeader?: boolean;
  /** Shown when `showCallingAccessHeader` is true */
  headerTitle?: string;
  submitButtonText?: string;
  /** Use explicit button + preventDefault (e.g. embedded in profile page) */
  useSubmitPreventDefault?: boolean;
}

const CallingAccessForm = forwardRef<HTMLDivElement, CallingAccessFormProps>(
  (
    {
      verifyUserInfoFormData,
      handleVerifyUserInfoChange,
      errors,
      touched,
      companyData,
      company_id: _company_id,
      companyName: _companyName,
      callAccessOptions,
      iccidOptions,
      callRepetitionOptions,
      deviceTypeOptions,
      completedSteps,
      hasPreviousStepChanges,
      getCurrentLoadingState,
      canProceedToNext,
      onSubmit,
      showCallingAccessHeader = true,
      headerTitle = "Add Calling Access",
      submitButtonText = "Continue to Create User Profile",
      useSubmitPreventDefault = false,
    },
    ref,
  ) => {
    const companyProfile = companyData?.data?.profile;

    const handleSubmitClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (useSubmitPreventDefault) {
        e.preventDefault();
      }
      onSubmit();
    };

    return (
      <Card
        ref={ref}
        className={`mb-4 shadow-sm ${!completedSteps.has(1) || hasPreviousStepChanges ? "disabled-card" : ""}`}
      >
        {showCallingAccessHeader && (
          <Card.Header
            className={`${!completedSteps.has(1) || hasPreviousStepChanges ? "bg-secondary text-white" : "bg-info text-white"}`}
          >
            <div className="d-flex align-items-center">
              <h5 className="mb-0 text-white">{headerTitle}</h5>
              {completedSteps.has(2) && (
                <i className="ph-duotone ph-check-circle text-success ms-auto"></i>
              )}
              {hasPreviousStepChanges && (
                <i className="ph-duotone ph-warning text-warning ms-auto"></i>
              )}
            </div>
          </Card.Header>
        )}
        <Card.Body
          className={
            !completedSteps.has(1) || hasPreviousStepChanges ? "opacity-50" : ""
          }
        >
          <form id="calling-access-form">
            <div className="row">
              <div className="col-sm-6">
                <Form.Group className="mb-3">
                  <Form.Label>Allow DNCR</Form.Label>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="allow_dncr"
                      checked={
                        verifyUserInfoFormData.allow_dncr ==
                        DNCRCallingAccess.ALLOW_DNCR
                      }
                      onChange={(e) =>
                        handleVerifyUserInfoChange(
                          "allow_dncr",
                          e.target.checked
                            ? DNCRCallingAccess.ALLOW_DNCR
                            : DNCRCallingAccess.DISALLOW_DNCR,
                        )
                      }
                      disabled={!completedSteps.has(1)}
                    />
                    {errors.allow_dncr && touched.allow_dncr && (
                      <div className="text-danger small mt-1">
                        {errors.allow_dncr}
                      </div>
                    )}
                  </div>
                </Form.Group>
              </div>

              {verifyUserInfoFormData.company?.profile?.fac_info && (
                <div className="col-sm-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Allow Fact Info</Form.Label>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="allow_fac_info"
                        checked={
                          verifyUserInfoFormData.allow_fac_info ==
                          FacInfoCallingAccess.ALLOW_FAC_INFO
                        }
                        onChange={(e) =>
                          handleVerifyUserInfoChange(
                            "allow_fac_info",
                            e.target.checked
                              ? FacInfoCallingAccess.ALLOW_FAC_INFO
                              : FacInfoCallingAccess.DISALLOW_FAC_INFO,
                          )
                        }
                        disabled={!completedSteps.has(1)}
                      />
                      {errors.allow_fac_info && touched.allow_fac_info && (
                        <div className="text-danger small mt-1">
                          {errors.allow_fac_info}
                        </div>
                      )}
                    </div>
                  </Form.Group>
                </div>
              )}

              {companyProfile?.mobile_user == MobileUser.Yes && (
                <div className="col-sm-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Mobile User</Form.Label>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="mobile_user"
                        checked={
                          verifyUserInfoFormData.mobile_user == MobileUser.Yes
                        }
                        onChange={(e) =>
                          handleVerifyUserInfoChange(
                            "mobile_user",
                            e.target.checked ? MobileUser.Yes : MobileUser.No,
                          )
                        }
                        disabled={!completedSteps.has(1)}
                      />
                      {errors.mobile_user && touched.mobile_user && (
                        <div className="text-danger small mt-1">
                          {errors.mobile_user}
                        </div>
                      )}
                    </div>
                  </Form.Group>
                </div>
              )}

              {verifyUserInfoFormData.mobile_user == MobileUser.Yes && (
                <div className="col-sm-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Device Type</Form.Label>
                    <Select
                      value={
                        deviceTypeOptions.find(
                          (option) =>
                            option.value === verifyUserInfoFormData.device_type,
                        ) || null
                      }
                      onChange={(selectedOption: any) =>
                        handleVerifyUserInfoChange(
                          "device_type",
                          selectedOption?.value || "",
                        )
                      }
                      options={deviceTypeOptions}
                      placeholder="Select Device Type"
                      isSearchable
                      isClearable
                      isDisabled={!completedSteps.has(1)}
                      className={
                        touched.device_type && errors.device_type
                          ? "is-invalid"
                          : ""
                      }
                      menuPortalTarget={
                        typeof document === "undefined" ? null : document.body
                      }
                      styles={{
                        menuPortal: (base: Record<string, unknown>) => ({
                          ...base,
                          zIndex: SELECT_MENU_Z,
                        }),
                        menu: (base: Record<string, unknown>) => ({
                          ...base,
                          zIndex: SELECT_MENU_Z,
                        }),
                      }}
                    />
                    {errors.device_type && touched.device_type && (
                      <div className="text-danger small mt-1">
                        {errors.device_type}
                      </div>
                    )}
                  </Form.Group>
                </div>
              )}

              {companyProfile?.allow_gsm && (
                <div className="col-sm-6">
                  <Form.Group className="mb-3">
                    <Form.Label>ICCID</Form.Label>
                    <Select
                      value={
                        iccidOptions.find(
                          (option) =>
                            option.value === verifyUserInfoFormData.iccid_number,
                        ) || null
                      }
                      onChange={(selectedOption: any) =>
                        handleVerifyUserInfoChange(
                          "iccid_number",
                          selectedOption?.value || "",
                        )
                      }
                      options={iccidOptions}
                      placeholder="Select ICCID"
                      isSearchable
                      isClearable
                      className={
                        touched.iccid_number && errors.iccid_number
                          ? "is-invalid"
                          : ""
                      }
                      menuPortalTarget={
                        typeof document === "undefined" ? null : document.body
                      }
                      styles={{
                        menuPortal: (base: Record<string, unknown>) => ({
                          ...base,
                          zIndex: SELECT_MENU_Z,
                        }),
                        menu: (base: Record<string, unknown>) => ({
                          ...base,
                          zIndex: SELECT_MENU_Z,
                        }),
                      }}
                    />
                    {errors.iccid_number && touched.iccid_number && (
                      <div className="text-danger small mt-1">
                        {errors.iccid_number}
                      </div>
                    )}
                  </Form.Group>
                </div>
              )}

              <div className="col-sm-6">
                <Form.Group className="mb-3">
                  <Form.Label>Call Access</Form.Label>
                  <select
                    className="form-select"
                    name="shareLineAppearanceCssName"
                    value={
                      verifyUserInfoFormData.shareLineAppearanceCssName || ""
                    }
                    onChange={(e) =>
                      handleVerifyUserInfoChange(
                        "shareLineAppearanceCssName",
                        e.target.value,
                      )
                    }
                  >
                    <option value="">Select Call Access</option>
                    {callAccessOptions.map((option) => (
                      <option key={String(option.value)} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.shareLineAppearanceCssName &&
                    touched.shareLineAppearanceCssName && (
                      <div className="text-danger small mt-1">
                        {errors.shareLineAppearanceCssName}
                      </div>
                    )}
                </Form.Group>
              </div>

              <div className="col-sm-6">
                <Form.Group className="mb-3">
                  <Form.Label>Call Repetition</Form.Label>
                  <select
                    className="form-select"
                    name="call_repetition"
                    value={verifyUserInfoFormData.call_repetition || ""}
                    onChange={(e) =>
                      handleVerifyUserInfoChange(
                        "call_repetition",
                        e.target.value,
                      )
                    }
                    disabled={!completedSteps.has(1)}
                  >
                    <option value="">NA</option>
                    {callRepetitionOptions.map((option) => (
                      <option key={String(option.value)} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.call_repetition && touched.call_repetition && (
                    <div className="text-danger small mt-1">
                      {errors.call_repetition}
                    </div>
                  )}
                </Form.Group>
              </div>

              {verifyUserInfoFormData.call_repetition && (
                <>
                  <div className="col-sm-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Call Repetition Weekly</Form.Label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter Call Repetition Weekly"
                        value={
                          verifyUserInfoFormData.call_repetition_weekly || ""
                        }
                        onChange={(e) =>
                          handleVerifyUserInfoChange(
                            "call_repetition_weekly",
                            e.target.value,
                          )
                        }
                        disabled={!completedSteps.has(1)}
                      />
                      {errors.call_repetition_weekly &&
                        touched.call_repetition_weekly && (
                          <div className="text-danger small mt-1">
                            {errors.call_repetition_weekly}
                          </div>
                        )}
                    </Form.Group>
                  </div>
                  <div className="col-sm-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Call Repetition Daily</Form.Label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Enter Call Repetition Daily"
                        value={
                          verifyUserInfoFormData.call_repetition_daily || ""
                        }
                        onChange={(e) =>
                          handleVerifyUserInfoChange(
                            "call_repetition_daily",
                            e.target.value,
                          )
                        }
                        disabled={!completedSteps.has(1)}
                      />
                      {errors.call_repetition_daily &&
                        touched.call_repetition_daily && (
                          <div className="text-danger small mt-1">
                            {errors.call_repetition_daily}
                          </div>
                        )}
                    </Form.Group>
                  </div>
                </>
              )}
            </div>

            <div className="text-end mt-3">
              <Button
                type="button"
                variant="info"
                onClick={handleSubmitClick}
                disabled={
                  getCurrentLoadingState(2) ||
                  !canProceedToNext(2) ||
                  !completedSteps.has(1)
                }
              >
                {getCurrentLoadingState(2) ? (
                  <output className="d-inline-flex align-items-center gap-2 border-0 bg-transparent p-0 m-0">
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    />
                    <span>Submitting...</span>
                  </output>
                ) : (
                  submitButtonText
                )}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    );
  },
);

CallingAccessForm.displayName = "CallingAccessForm";

export default CallingAccessForm;
