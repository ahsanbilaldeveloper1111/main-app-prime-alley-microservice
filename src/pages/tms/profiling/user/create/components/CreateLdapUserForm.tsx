import React from "react";
import { Card, Form, Button } from "react-bootstrap";
import Select from "react-select";
import { VerifyLdapUserParams, CreateUpdateLdapUserParams } from "@models/tms/UnfidiedOp";
import { UserType } from "@models/tms";
import { generateComplexId } from "@utils/Helper";

interface SelectOption {
    value: number | string;
    label: string;
}

interface CreateLdapUserFormProps {
    verifyLdapUserFormData: VerifyLdapUserParams;
    handleCreateFormChange: (field: keyof CreateUpdateLdapUserParams, value: any) => void;
    errors: any;
    touched: any;
    companyData: any;
    company_id: number | null;
    companyName: string;
    companyOptions: SelectOption[];
    availableExtensionsOptions: SelectOption[];
    countryOptions: SelectOption[];
    isUpdateMode: boolean;
    userData: any;
    user: any;
    completedSteps: Set<number>;
    getCurrentLoadingState: (step: number) => boolean;
    canProceedToNext: (step: number) => boolean;
    onSubmit: () => void;
}

const CreateLdapUserForm: React.FC<CreateLdapUserFormProps> = ({
    verifyLdapUserFormData,
    handleCreateFormChange,
    errors,
    touched,
    companyData,
    company_id,
    companyName,
    companyOptions,
    availableExtensionsOptions,
    countryOptions,
    isUpdateMode,
    userData,
    user,
    completedSteps,
    getCurrentLoadingState,
    canProceedToNext,
    onSubmit,
}) => {
    return (
        <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
                <div className="d-flex align-items-center">
                    <h5 className="mb-0 text-white">Create LDAP User</h5>
                    {completedSteps.has(1) && (
                        <i className="ph-duotone ph-check-circle text-success ms-auto"></i>
                    )}
                </div>
            </Card.Header>
            <Card.Body>
                <form id="create-ldap-user">
                    <div className="row">
                        {!userData?.data?.company_id &&
                            user?.user_type == UserType.ADMIN && (
                                <div className="col-sm-6">
                                    <Form.Group className="mb-3">
                                        <Form.Label>Company</Form.Label>
                                        <Select
                                            value={companyOptions.find((option) => option.label === verifyLdapUserFormData.companyName) || null}
                                            onChange={(selectedOption: any) => handleCreateFormChange("companyName", selectedOption?.value || "")}
                                            options={companyOptions}
                                            placeholder="Select Company"
                                            isSearchable
                                            isClearable
                                            className={touched.companyName && errors.companyName ? "is-invalid" : ""}
                                            menuPortalTarget={document.body}
                                            styles={{
                                                menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                                menu: (base: any) => ({ ...base, zIndex: 9999 })
                                            }}
                                        />
                                        {errors.companyName && touched.companyName && (
                                            <div className="text-danger small mt-1">{errors.companyName}</div>
                                        )}
                                    </Form.Group>
                                </div>
                            )}

                        <div className="col-sm-6">
                            <Form.Group className="mb-3">
                                <Form.Label>First Name</Form.Label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter First Name"
                                    required
                                    value={verifyLdapUserFormData.firstName}
                                    onChange={(e) =>
                                        handleCreateFormChange(
                                            "firstName",
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.firstName && touched.firstName && (
                                    <div className="text-danger small mt-1">{errors.firstName}</div>
                                )}
                            </Form.Group>
                        </div>

                        <div className="col-sm-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Last Name</Form.Label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter Last Name"
                                    required
                                    value={verifyLdapUserFormData.lastName}
                                    onChange={(e) =>
                                        handleCreateFormChange(
                                            "lastName",
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.lastName && touched.lastName && (
                                    <div className="text-danger small mt-1">{errors.lastName}</div>
                                )}
                            </Form.Group>
                        </div>

                        {!userData?.data?.company_id && !isUpdateMode && (
                            <div className="col-sm-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>User ID</Form.Label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter User ID"
                                            required
                                            value={verifyLdapUserFormData.userId || ""}
                                            onChange={(e) => {
                                                // Remove spaces from the input
                                                const valueWithoutSpaces = e.target.value.replaceAll(' ', '');
                                                handleCreateFormChange(
                                                    "userId",
                                                    valueWithoutSpaces,
                                                );
                                            }}
                                        />
                                        <span
                                            className="input-group-text"
                                            style={{
                                                background: "#f8f9fa",
                                                fontWeight: 500,
                                            }}
                                        >
                                            {companyData?.data?.profile?.user_id_prefix
                                                ? "_" + companyData?.data?.profile?.user_id_prefix
                                                : ""}
                                        </span>
                                    </div>
                                    {errors.userId && touched.userId && (
                                        <div className="text-danger small mt-1">{errors.userId}</div>
                                    )}
                                </Form.Group>
                            </div>
                        )}

                        {!userData?.data?.company_id && !isUpdateMode && (
                            <div className="col-sm-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Extension</Form.Label>
                                    <Select
                                        value={availableExtensionsOptions.find((option) => option.value === verifyLdapUserFormData.extensionNumber) || null}
                                        onChange={(selectedOption: any) => handleCreateFormChange("extensionNumber", selectedOption?.value || "")}
                                        options={availableExtensionsOptions}
                                        placeholder="Select Extension"
                                        isSearchable
                                        isClearable
                                        className={touched.extensionNumber && errors.extensionNumber ? "is-invalid" : ""}
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                            menu: (base: any) => ({ ...base, zIndex: 9999 })
                                        }}
                                    />
                                    {errors.extensionNumber && touched.extensionNumber && (
                                        <div className="text-danger small mt-1">{errors.extensionNumber}</div>
                                    )}
                                </Form.Group>
                            </div>
                        )}

                        <div className="col-sm-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Enter Email"
                                    required
                                    value={verifyLdapUserFormData.email}
                                    onChange={(e) =>
                                        handleCreateFormChange(
                                            "email",
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.email && touched.email && (
                                    <div className="text-danger small mt-1">{errors.email}</div>
                                )}
                            </Form.Group>
                        </div>

                        <div className="col-sm-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Country</Form.Label>
                                <Select
                                    value={countryOptions.find((option) => option.value === verifyLdapUserFormData.country) || null}
                                    onChange={(selectedOption: any) => handleCreateFormChange("country", selectedOption?.value || "")}
                                    options={countryOptions}
                                    placeholder="Select Country"
                                    isSearchable
                                    isClearable
                                    className={touched.country && errors.country ? "is-invalid" : ""}
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                        menu: (base: any) => ({ ...base, zIndex: 9999 })
                                    }}
                                />
                                {errors.country && touched.country && (
                                    <div className="text-danger small mt-1">{errors.country}</div>
                                )}
                            </Form.Group>
                        </div>

                        <div className="col-sm-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Job Title</Form.Label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter Job Title"
                                    value={verifyLdapUserFormData.jobTitle}
                                    onChange={(e) =>
                                        handleCreateFormChange(
                                            "jobTitle",
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.jobTitle && touched.jobTitle && (
                                    <div className="text-danger small mt-1">{errors.jobTitle}</div>
                                )}
                            </Form.Group>
                        </div>

                        <div className="col-sm-6">
                            <Form.Group className="mb-3">
                                <Form.Label>Department</Form.Label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter Department"
                                    required
                                    value={verifyLdapUserFormData.department}
                                    onChange={(e) =>
                                        handleCreateFormChange(
                                            "department",
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.department && touched.department && (
                                    <div className="text-danger small mt-1">{errors.department}</div>
                                )}
                            </Form.Group>
                        </div>

                        {!isUpdateMode && (
                            <div className="col-sm-6">
                                <Form.Group className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Form.Label>Password</Form.Label>
                                    </div>
                                    <div className="input-group">
                                        <input
                                            
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter Password"
                                            onChange={(e) =>
                                                handleCreateFormChange(
                                                    "password",
                                                    e.target.value,
                                                )
                                            }
                                            value={verifyLdapUserFormData.password}
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => {
                                                const randomPassword = generateComplexId();
                                                handleCreateFormChange(
                                                    "password",
                                                    randomPassword,
                                                );
                                            }}
                                        >
                                            Generate Random
                                        </Button>
                                    </div>
                                    {errors.password && touched.password && (
                                        <div className="text-danger small mt-1">{errors.password}</div>
                                    )}
                                </Form.Group>
                            </div>
                        )}
                    </div>

                    <div className="text-end mt-3">
                        <Button
                            variant="primary"
                            onClick={onSubmit}
                            disabled={
                                getCurrentLoadingState(1) || !canProceedToNext(1)
                            }
                        >
                            {getCurrentLoadingState(1) ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Submitting...
                                </>
                            ) : (
                                "Continue to Calling Access"
                            )}
                        </Button>
                    </div>
                </form>
            </Card.Body>
        </Card>
    );
};

export default CreateLdapUserForm;
