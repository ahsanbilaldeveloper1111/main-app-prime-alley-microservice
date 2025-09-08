import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Col, Row, Card, Form, Button } from "react-bootstrap";
import Select from "react-select";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useFormErrors } from "@hooks/tms/useFormErrors";

import {
    MobileUser,
    CallingAccess,
    ExtensionRange,
    DNCRCallingAccess,
    FacInfoCallingAccess,
    CompanyIccid,
    CompanyGSM,
} from "@models/tms/Company";
import {
    useCompanyList,
    useCreateUpdateCompanyCallingAccess,
    useCreateUpdateCompanyProfile,
    useDeleteCompanyCallingAccess,
} from "@hooks/tms/company";
import { Company } from "@models/tms/Company";
import { useOrganizationUnits } from "@hooks/tms/customerProfiling";
import {
    useListAppUser,
    useListCSS,
    useListDevicePool,
    useListFacInfo,
    useListLdapDirectory,
    useListRecordingProfile,
    useListRoutePartition,
} from "@hooks/tms/ciscoPBXResponse";
import {
    ListCSS,
    ListRoutePartition,
    ListAppUser,
    ListRecordingProfile,
    ListFacInfo,
    ListDevicePool,
    ClusterName,
    ListLdapDirectory,
} from "@models/tms/CiscoPBXResponse";
import feather from "feather-icons";
import { set } from "lodash";
import { useRouter } from "next/router";

interface CustomerProfileForm {
    directory_name: string;
    company_id: number;
    device_pool: string;
    allow_fac_info: FacInfoCallingAccess;
    fac_info: string;
    max_users: number | null;
    user_id_prefix: string;
    company_iccid_id: number | null;
    mobile_user: MobileUser;
    allow_gsm: CompanyGSM;
    extention_ranges: ExtensionRange[];
    recording_profile: string;
    app_user: string;
    partition: string;
    recording_profile_mobile: string;
    device_pool_mobile: string;
    sim_ports: string[];
    additional_info: string;
    allow_dncr: DNCRCallingAccess;
}

const CreateProfileWizard = () => {
    const {
        errors,
        touched,
        setErrors,
        setFieldTouched,
        setAllTouched,
        clearAllFieldError,
        clearFieldError,
    } = useFormErrors();

    const router = useRouter();
    const { id: companyId } = router.query;
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    
    // Memoize the company list params to prevent unnecessary API calls
    const companyListParams = useMemo(() => ({
        parent_id: null,
        load_calling_access: true,
        load_profile: true,
        load_company_iccid: true,
        search: "",
        ids: companyId ? [Number(companyId)] : [],
    }), [companyId]);
    
    // API hooks
    const { data: companyList, isLoading: isCompanyListLoading, refetch: refetchCompanyList } = useCompanyList(companyListParams);
    
    // Additional API hooks for dropdowns
    const { data: partitionList, isLoading: isPartitionListLoading } = useListRoutePartition({
        search: "",
        cluster_name: ClusterName.HARD_PHONE_AND_DESKTOP_CLUSTER,
    });
    
    const { data: recordingProfileList, isLoading: isRecordingProfileListLoading } = useListRecordingProfile({
        search: "",
    });
    
    const { data: devicePoolList, isLoading: isDevicePoolListLoading } = useListDevicePool({
        search: "",
    });
    
    const { data: facInfoList, isLoading: isFacInfoListLoading } = useListFacInfo({
        search: "",
        cluster_name: ClusterName.HARD_PHONE_AND_DESKTOP_CLUSTER,
    });
    
    const { data: appUserList, isLoading: isAppUserListLoading } = useListAppUser({
        search: "",
        cluster_name: ClusterName.HARD_PHONE_AND_DESKTOP_CLUSTER,
    });
    
    // Memoize the order object to prevent re-renders
    const cssOrder = useMemo(() => ({
        column: "name",
        dir: "asc",
    }), []);

    const { data: cssList, isLoading: isCSSListLoading } = useListCSS({
        search: "",
        cluster_name: ClusterName.HARD_PHONE_AND_DESKTOP_CLUSTER,
        order: cssOrder
    });
    
    const { data: ldapDirectoryList, isLoading: isLdapDirectoryListLoading } = useListLdapDirectory({
        search: "",
        cluster_name: ClusterName.HARD_PHONE_AND_DESKTOP_CLUSTER,
    });

    // Memoized options for dropdowns
    const companyOptions = useMemo(
        () => {
            
            const options = (companyList as any)?.map((company: Company) => ({
                value: company.id,
                label: company.name,
            })) || [];
            
            return options;
        },
        [companyList],
    );

    const partitionOptions = useMemo(
        () => {
            
            const options = (partitionList as any)?.map(
                (partition: ListRoutePartition, index: number) => ({
                    value: partition.name,
                    label: partition.name,
                    key: `partition-${partition.name}-${index}`,
                }),
            ) || [];
           
            return options;
        },
        [partitionList],
    );

    const recordingProfileOptions = useMemo(
        () => {
            
            const options = (recordingProfileList as any)
                ?.filter(
                    (recordingProfile: ListRecordingProfile) =>
                        recordingProfile.ClusterName ==
                        ClusterName.HARD_PHONE_AND_DESKTOP_CLUSTER,
                )
                .map((recordingProfile: ListRecordingProfile, index: number) => ({
                    value: recordingProfile.name,
                    label: recordingProfile.name,
                    key: `recording-${recordingProfile.name}-${index}`,
                })) || [];
            
            return options;
        },
        [recordingProfileList],
    );

    const recordingProfileMobileOptions = useMemo(
        () => {
           
            if (recordingProfileList && recordingProfileList.length > 0) {
                
                
            }
            
            const filtered = (recordingProfileList as any)
                ?.filter(
                    (recordingProfile: ListRecordingProfile) => {
                        const isMatch = recordingProfile.ClusterName === ClusterName.MOBILE_CLUSTER;
                        return isMatch;
                    }
                ) || [];
            
            
            
            const options = filtered.map((recordingProfile: ListRecordingProfile, index: number) => ({
                value: recordingProfile.name,
                label: recordingProfile.name,
                key: `recording-mobile-${recordingProfile.name}-${index}`,
            }));
            
            console.log("Final mobile options:", options);
            
            return options;
        },
        [recordingProfileList],
    );

    const appUserOptions = useMemo(
        () =>
            (appUserList as any)?.map((appUser: ListAppUser, index: number) => ({
                value: appUser.userid,
                label: appUser.userid,
                key: `appuser-${appUser.userid}-${index}`,
            })) || [],
        [appUserList],
    );

    const directoryNameOptions = useMemo(
        () =>
            (ldapDirectoryList as any)?.map(
                (ldapDirectory: ListLdapDirectory, index: number) => ({
                    value: ldapDirectory.name,
                    label: ldapDirectory.name,
                    key: `directory-${ldapDirectory.name}-${index}`,
                }),
            ) || [],
        [ldapDirectoryList],
    );

    const cssOptions = useMemo(
        () =>
            (cssList as any)?.map((css: ListCSS, index: number) => ({
                value: css.name,
                label: css.name,
                key: `css-${css.name}-${index}`,
            })) || [],
        [cssList],
    );

    const facInfoOptions = useMemo(
        () =>
            (facInfoList as any)?.map((facInfo: ListFacInfo, index: number) => ({
                value: facInfo.name,
                label: facInfo.name,
                key: `facinfo-${facInfo.name}-${index}`,
            })) || [],
        [facInfoList],
    );

    const devicePoolOptions = useMemo(
        () =>
            (devicePoolList as any)
                ?.filter(
                    (devicePool: ListDevicePool) =>
                        devicePool.ClusterName ==
                        ClusterName.HARD_PHONE_AND_DESKTOP_CLUSTER,
                )
                .map((devicePool: ListDevicePool, index: number) => ({
                    value: devicePool.name,
                    label: devicePool.name,
                    key: `devicepool-${devicePool.name}-${index}`,
                })) || [],
        [devicePoolList],
    );

    const devicePoolMobileOptions = useMemo(() => {
        return (
            (devicePoolList as any)
                ?.filter(
                    (devicePool: ListDevicePool) =>
                        devicePool.ClusterName == ClusterName.MOBILE_CLUSTER,
                )
                .map((devicePool: ListDevicePool, index: number) => ({
                    value: devicePool.name,
                    label: devicePool.name,
                    key: `devicepool-mobile-${devicePool.name}-${index}`,
                })) || []
        );
    }, [devicePoolList]);

    const iccidOptions = useMemo(() => {
        return (
            (selectedCompany?.iccids as any || []).map(
                (iccid: CompanyIccid, index: number) => ({
                    value: iccid.id,
                    label: iccid.name,
                    key: `iccid-${iccid.id}-${index}`,
                }),
            ) || []
        );
    }, [selectedCompany]);

    const simPortOptions = useMemo(() => {
        if (!selectedCompany?.profile?.sim_ports)
            return [
                {
                    id: "sim1",
                    value: "sim1",
                    label: "Sim 1",
                },
                {
                    id: "sim2",
                    value: "sim2",
                    label: "Sim 2",
                },
                {
                    id: "sim3",
                    value: "sim3",
                    label: "Sim 3",
                },
                {
                    id: "sim4",
                    value: "sim4",
                    label: "Sim 4",
                },
            ];

        const simPorts = selectedCompany.profile.sim_ports;

        return simPorts.map((port: string) => ({
            id: port,
            value: port,
            label: port,
        }));
    }, [selectedCompany]);

    const [formData, setFormData] = useState<CustomerProfileForm>({
        company_id: 0,
        directory_name: "",
        user_id_prefix: "",
        device_pool: "",
        company_iccid_id: null,
        device_pool_mobile: "",
        fac_info: "",
        max_users: null,
        allow_gsm: CompanyGSM.DISALLOW_GSM,
        allow_fac_info: FacInfoCallingAccess.DISALLOW_FAC_INFO,
        recording_profile_mobile: "",
        mobile_user: MobileUser.No,
        extention_ranges: [],
        recording_profile: "",
        app_user: "",
        partition: "",
        sim_ports: [],
        additional_info: "",
        allow_dncr: DNCRCallingAccess.DISALLOW_DNCR,
    });

    // Calling access hooks and state
    const { updateCreateUpdateCompanyCallingAccess } = useCreateUpdateCompanyCallingAccess(refetchCompanyList);
    const [backEndCallingAccess, setBackEndCallingAccess] = useState<CallingAccess | null>(null);

    // Common Select component props to fix dropdown visibility
    const selectProps = {
        menuPortalTarget: document.body,
        styles: {
            menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
            menu: (base: any) => ({ ...base, zIndex: 9999 })
        }
    };
    const { deleteCompanyCallingAccess } = useDeleteCompanyCallingAccess(refetchCompanyList);
    const {
        updateCompanyProfile,
        isUpdateCompanyProfilePending,
        isUpdateCompanyProfileError,
        updateCompanyProfileError,
    } = useCreateUpdateCompanyProfile();

    const handleChange = useCallback((field: keyof CustomerProfileForm, value: any) => {
        if (field === "company_id") {
            
            const selectedCompanyValue =
                (companyList || []).find((c: Company) => c.id == value) ||
                null as Company | null;
            
            
            
            setSelectedCompany(selectedCompanyValue as Company | null);
            
            setFormData((prev) => ({
                ...prev,
                company_id: value,
                directory_name: selectedCompanyValue?.profile?.directory_name || "",
                mobile_user: selectedCompanyValue?.profile?.mobile_user || MobileUser.No,
                extention_ranges: selectedCompanyValue?.profile?.extention_ranges || [],
                recording_profile: selectedCompanyValue?.profile?.recording_profile || "",
                app_user: selectedCompanyValue?.profile?.app_user || "",
                device_pool: selectedCompanyValue?.profile?.device_pool || "",
                device_pool_mobile: selectedCompanyValue?.profile?.device_pool_mobile || "",
                fac_info: selectedCompanyValue?.profile?.fac_info || "",
                partition: selectedCompanyValue?.profile?.partition || "",
                max_users: selectedCompanyValue?.profile?.max_users || null,
                recording_profile_mobile: selectedCompanyValue?.profile?.recording_profile_mobile || "",
                sim_ports: selectedCompanyValue?.profile?.sim_ports || [],
                additional_info: selectedCompanyValue?.profile?.additional_info || "",
                allow_gsm: selectedCompanyValue?.profile?.allow_gsm || CompanyGSM.DISALLOW_GSM,
                user_id_prefix: selectedCompanyValue?.profile?.user_id_prefix || "",
                company_iccid_id: selectedCompanyValue?.iccids?.[0]?.id || null,
            }));
            clearAllFieldError();
        } else {
            setFieldTouched(field as string, true);
            clearFieldError(field as string);
            
            setFormData((prev) => {
                let data = {
                    ...prev,
                    [field]: value,
                };
                
                if (field === "mobile_user" && value == MobileUser.No) {
                    data.recording_profile_mobile = "";
                    data.device_pool_mobile = "";
                }
                
                if (field === "allow_gsm" && value == CompanyGSM.DISALLOW_GSM) {
                    data.company_iccid_id = null;
                }
                
                if (field === "allow_gsm" && value == CompanyGSM.ALLOW_GSM) {
                    // Get the current selected company from the company list
                    const currentSelectedCompany = (companyList || []).find((c: Company) => c.id == prev.company_id);
                    data.company_iccid_id = currentSelectedCompany?.iccids?.[0]?.id || null;
                }

                return data;
            });
        }
    }, [companyList, clearAllFieldError, clearFieldError, setFieldTouched]);

    // Handle initial company selection from URL params
    useEffect(() => {
        if (companyId && companyList?.length && !formData.company_id) {
            const selectedCompanyValue =
                (companyList || []).find((c: Company) => c.id == +companyId) ||
                null as Company | null;
            setSelectedCompany(selectedCompanyValue as Company | null);
            
            setFormData((prev) => ({
                ...prev,
                company_id: +companyId,
                directory_name: selectedCompanyValue?.profile?.directory_name || "",
                mobile_user: selectedCompanyValue?.profile?.mobile_user || MobileUser.No,
                extention_ranges: selectedCompanyValue?.profile?.extention_ranges || [],
                recording_profile: selectedCompanyValue?.profile?.recording_profile || "",
                app_user: selectedCompanyValue?.profile?.app_user || "",
                device_pool: selectedCompanyValue?.profile?.device_pool || "",
                device_pool_mobile: selectedCompanyValue?.profile?.device_pool_mobile || "",
                fac_info: selectedCompanyValue?.profile?.fac_info || "",
                partition: selectedCompanyValue?.profile?.partition || "",
                max_users: selectedCompanyValue?.profile?.max_users || null,
                recording_profile_mobile: selectedCompanyValue?.profile?.recording_profile_mobile || "",
                sim_ports: selectedCompanyValue?.profile?.sim_ports || [],
                additional_info: selectedCompanyValue?.profile?.additional_info || "",
                allow_gsm: selectedCompanyValue?.profile?.allow_gsm || CompanyGSM.DISALLOW_GSM,
                user_id_prefix: selectedCompanyValue?.profile?.user_id_prefix || "",
                company_iccid_id: selectedCompanyValue?.iccids?.[0]?.id || null,
            }));
        }
    }, [companyId, companyList]);

    // Handle API errors
    useEffect(() => {
        if (isUpdateCompanyProfileError && updateCompanyProfileError) {
            // Handle Laravel validation errors
            setErrors(updateCompanyProfileError);
        }
        feather.replace();
    }, [isUpdateCompanyProfileError, updateCompanyProfileError, setErrors]);

    // Computed values for calling access
    const allowDncr = useMemo(() => {
        return selectedCompany?.calling_access?.some(
            (callingAccess: CallingAccess) =>
                callingAccess.allow_dncr == DNCRCallingAccess.ALLOW_DNCR &&
                formData.company_iccid_id == callingAccess.company_iccid_id,
        );
    }, [selectedCompany, formData.company_iccid_id]);

    const allowFacInfo = useMemo(() => {
        return selectedCompany?.calling_access?.some(
            (callingAccess: CallingAccess) =>
                callingAccess.allow_fac_info == FacInfoCallingAccess.ALLOW_FAC_INFO &&
                formData.company_iccid_id == callingAccess.company_iccid_id,
        );
    }, [selectedCompany, formData.company_iccid_id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearAllFieldError();
        const allFormFields = [
            "company_id",
            "mobile_user",
            "recording_profile_mobile",
            "device_pool_mobile",
            "company_iccid_id",
            "extention_ranges",
            "recording_profile",
            "user_id_prefix",
            "directory_name",
            "app_user",
            "partition",
            "sim_ports",
            "max_users",
            "additional_info",
            "allow_gsm",
            "allow_dncr",
            "allow_fac_info",
        ];
        setAllTouched(allFormFields);
        console.log("formData", formData);
        if (formData.company_id) {
            updateCompanyProfile(formData);
        }
    };

    return (
        <React.Fragment>
            <title>Create Customer Profile Wizard</title>
            <BreadcrumbItem
                mainTitle="Customer Profile"
                mainLink="/tms/profiling/customers/create/wizard"
                subTitle="Create New Profile Wizard"
            />

            <Form onSubmit={handleSubmit}>
                <Card>
                    <Card.Header>
                        <h4 className="card-title">Customer Information</h4>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                {!companyId && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Company</Form.Label>
                                        <Select
                                            value={companyOptions.find((option: any) => option.value === formData.company_id) || null}
                                            onChange={(selectedOption: any) =>
                                                handleChange("company_id", selectedOption?.value || 0)
                                            }
                                            options={companyOptions}
                                            placeholder="Select Company"
                                            isSearchable
                                            isClearable
                                            className={touched.company_id && errors.company_id ? "is-invalid" : ""}
                                            {...selectProps}
                                        />
                                        {touched.company_id && errors.company_id && (
                                            <div className="text-danger small mt-1">
                                                {errors.company_id}
                                            </div>
                                        )}
                                    </Form.Group>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label>Partition</Form.Label>
                                    <Select
                                        value={partitionOptions.find((option: any) => option.value === formData.partition) || null}
                                        onChange={(selectedOption: any) =>
                                            handleChange("partition", selectedOption?.value || "")
                                        }
                                        options={partitionOptions}
                                        placeholder="Select Partition"
                                        isSearchable
                                        isClearable
                                        className={touched.partition && errors.partition ? "is-invalid" : ""}
                                        {...selectProps}
                                    />
                                    {touched.partition && errors.partition && (
                                        <div className="text-danger small mt-1">
                                            {errors.partition}
                                        </div>
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Device Pool</Form.Label>
                                    <Select
                                        value={devicePoolOptions.find((option: any) => option.value === formData.device_pool) || null}
                                        onChange={(selectedOption: any) =>
                                            handleChange("device_pool", selectedOption?.value || "")
                                        }
                                        options={devicePoolOptions}
                                        placeholder="Select Device Pool"
                                        isSearchable
                                        isClearable
                                        className={touched.device_pool && errors.device_pool ? "is-invalid" : ""}
                                        {...selectProps}
                                    />
                                    {touched.device_pool && errors.device_pool && (
                                        <div className="text-danger small mt-1">
                                            {errors.device_pool}
                                        </div>
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>App User</Form.Label>
                                    <Select
                                        value={appUserOptions.find((option: any) => option.value === formData.app_user) || null}
                                        onChange={(selectedOption: any) =>
                                            handleChange("app_user", selectedOption?.value || "")
                                        }
                                        options={appUserOptions}
                                        placeholder="Select App User"
                                        isSearchable
                                        isClearable
                                        className={touched.app_user && errors.app_user ? "is-invalid" : ""}
                                        {...selectProps}
                                    />
                                    {touched.app_user && errors.app_user && (
                                        <div className="text-danger small mt-1">
                                            {errors.app_user}
                                        </div>
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Directory Name</Form.Label>
                                    <Select
                                        value={directoryNameOptions.find((option: any) => option.value === formData.directory_name) || null}
                                        onChange={(selectedOption: any) =>
                                            handleChange("directory_name", selectedOption?.value || "")
                                        }
                                        options={directoryNameOptions}
                                        placeholder="Select Directory Name"
                                        isSearchable
                                        isClearable
                                        className={touched.directory_name && errors.directory_name ? "is-invalid" : ""}
                                        {...selectProps}
                                    />
                                    {touched.directory_name && errors.directory_name && (
                                        <div className="text-danger small mt-1">
                                            {errors.directory_name}
                                        </div>
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Max Users</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Max Users"
                                        value={formData.max_users || ""}
                                        onChange={(e) =>
                                            handleChange("max_users", parseInt(e.target.value))
                                        }
                                        isInvalid={touched.max_users && !!errors.max_users}
                                    />
                                    {touched.max_users && errors.max_users && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.max_users}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Allow GSM</Form.Label>
                                    <Form.Check className="form-switch custom-switch-v1 mb-2">
                                        <Form.Check.Input
                                            type="checkbox"
                                            className="input-primary"
                                            id="allowGsmCheck"
                                            checked={formData.allow_gsm == CompanyGSM.ALLOW_GSM}
                                            onChange={(e) =>
                                                handleChange(
                                                    "allow_gsm",
                                                    e.target.checked
                                                        ? CompanyGSM.ALLOW_GSM
                                                        : CompanyGSM.DISALLOW_GSM,
                                                )
                                            }
                                        />
                                        <Form.Check.Label htmlFor="allowGsmCheck">
                                            {formData.allow_gsm == CompanyGSM.ALLOW_GSM ? "Yes" : "No"}
                                        </Form.Check.Label>
                                    </Form.Check>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Recording Profile</Form.Label>
                                    <Select
                                        value={recordingProfileOptions.find((option: any) => option.value === formData.recording_profile) || null}
                                        onChange={(selectedOption: any) =>
                                            handleChange("recording_profile", selectedOption?.value || "")
                                        }
                                        options={recordingProfileOptions}
                                        placeholder="Select Recording Profile"
                                        isSearchable
                                        isClearable
                                        className={touched.recording_profile && errors.recording_profile ? "is-invalid" : ""}
                                        {...selectProps}
                                    />
                                    {touched.recording_profile && errors.recording_profile && (
                                        <div className="text-danger small mt-1">
                                            {errors.recording_profile}
                                        </div>
                                    )}
                                </Form.Group>

                                {formData.allow_gsm == CompanyGSM.ALLOW_GSM && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>ICCID</Form.Label>
                                        <Select
                                            value={iccidOptions.find((option: any) => option.value === formData.company_iccid_id) || null}
                                            onChange={(selectedOption: any) =>
                                                handleChange("company_iccid_id", selectedOption?.value || null)
                                            }
                                            options={iccidOptions}
                                            placeholder="Select ICCID"
                                            isSearchable
                                            isClearable
                                            className={touched.company_iccid_id && errors.company_iccid_id ? "is-invalid" : ""}
                                            {...selectProps}
                                        />
                                        {touched.company_iccid_id && errors.company_iccid_id && (
                                            <div className="text-danger small mt-1">
                                                {errors.company_iccid_id}
                                            </div>
                                        )}
                                    </Form.Group>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label>Facility Info</Form.Label>
                                    <Select
                                        value={facInfoOptions.find((option: any) => option.value === formData.fac_info) || null}
                                        onChange={(selectedOption: any) =>
                                            handleChange("fac_info", selectedOption?.value || "")
                                        }
                                        options={facInfoOptions}
                                        placeholder="Select Facility Info"
                                        isSearchable
                                        isClearable
                                        className={touched.fac_info && errors.fac_info ? "is-invalid" : ""}
                                        {...selectProps}
                                    />
                                    {touched.fac_info && errors.fac_info && (
                                        <div className="text-danger small mt-1">
                                            {errors.fac_info}
                                        </div>
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>User ID Prefix (3 characters max)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        maxLength={3}
                                        placeholder="User ID Prefix"
                                        value={formData.user_id_prefix}
                                        onChange={(e) =>
                                            handleChange("user_id_prefix", e.target.value)
                                        }
                                        isInvalid={touched.user_id_prefix && !!errors.user_id_prefix}
                                    />
                                    {touched.user_id_prefix && errors.user_id_prefix && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.user_id_prefix}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>
                        <h4 className="card-title">Mobile User Configuration</h4>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <div className="d-flex justify-content-end align-items-center mb-4">
                                        <div className="d-flex gap-2" style={{ marginRight: "10px" }}>
                                            <Form.Check className="form-switch custom-switch-v1 mb-2">
                                                <Form.Check.Input
                                                    type="checkbox"
                                                    className="input-primary"
                                                    id="mobileUserCheck"
                                                    checked={formData.mobile_user === MobileUser.Yes}
                                                    onChange={(e) => {
                                                        setFormData({
                                                            ...formData,
                                                            mobile_user: e.target.checked
                                                                ? MobileUser.Yes
                                                                : MobileUser.No,
                                                        });
                                                    }}
                                                />
                                                <Form.Check.Label htmlFor="mobileUserCheck">
                                                    Mobile User
                                                </Form.Check.Label>
                                            </Form.Check>
                                        </div>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        {formData.mobile_user === MobileUser.Yes && (
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Recording Profile Mobile</Form.Label>
                                        <Select
                                            value={recordingProfileMobileOptions.find((option: any) => option.value === formData.recording_profile_mobile) || null}
                                            onChange={(selectedOption: any) =>
                                                handleChange("recording_profile_mobile", selectedOption?.value || "")
                                            }
                                            options={recordingProfileMobileOptions}
                                            placeholder="Select Recording Profile Mobile"
                                            isSearchable
                                            isClearable
                                            className={touched.recording_profile_mobile && errors.recording_profile_mobile ? "is-invalid" : ""}
                                            {...selectProps}
                                        />
                                        {touched.recording_profile_mobile && errors.recording_profile_mobile && (
                                            <div className="text-danger small mt-1">
                                                {errors.recording_profile_mobile}
                                            </div>
                                        )}
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Device Pool Mobile</Form.Label>
                                        <Select
                                            value={devicePoolMobileOptions.find((option: any) => option.value === formData.device_pool_mobile) || null}
                                            onChange={(selectedOption: any) =>
                                                handleChange("device_pool_mobile", selectedOption?.value || "")
                                            }
                                            options={devicePoolMobileOptions}
                                            placeholder="Select Device Pool Mobile"
                                            isSearchable
                                            isClearable
                                            className={touched.device_pool_mobile && errors.device_pool_mobile ? "is-invalid" : ""}
                                            {...selectProps}
                                        />
                                        {touched.device_pool_mobile && errors.device_pool_mobile && (
                                            <div className="text-danger small mt-1">
                                                {errors.device_pool_mobile}
                                            </div>
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>
                        <h4 className="card-title">Extension Ranges</h4>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={12}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <Form.Label>Extension Ranges</Form.Label>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => {
                                            const newRanges = [...formData.extention_ranges];
                                            newRanges.push({
                                                start: 0,
                                                end: 0,
                                            });
                                            handleChange("extention_ranges", newRanges);
                                        }}
                                    >
                                        <i className="feather icon-plus" /> Add Range
                                    </Button>
                                </div>
                                <div>
                                    {formData.extention_ranges.map((range, index) => (
                                        <Row key={index} className="mb-3">
                                            <Col md={5}>
                                                <Form.Control
                                                    type="number"
                                                    placeholder="Start"
                                                    value={range.start || ""}
                                                    onChange={(e) => {
                                                        const newRanges = [...formData.extention_ranges];
                                                        newRanges[index] = {
                                                            ...newRanges[index],
                                                            start: parseInt(e.target.value) || 0,
                                                        };
                                                        handleChange("extention_ranges", newRanges);
                                                    }}
                                                />
                                            </Col>
                                            <Col md={5}>
                                                <Form.Control
                                                    type="number"
                                                    placeholder="End"
                                                    value={range.end || ""}
                                                    onChange={(e) => {
                                                        const newRanges = [...formData.extention_ranges];
                                                        newRanges[index] = {
                                                            ...newRanges[index],
                                                            end: parseInt(e.target.value) || 0,
                                                        };
                                                        handleChange("extention_ranges", newRanges);
                                                    }}
                                                />
                                            </Col>
                                            <Col md={2}>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => {
                                                        const newRanges = [...formData.extention_ranges];
                                                        newRanges.splice(index, 1);
                                                        handleChange("extention_ranges", newRanges);
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </Col>
                                        </Row>
                                    ))}
                                    {formData.extention_ranges.length === 0 && (
                                        <div className="text-center py-3 text-muted">
                                            <i className="feather icon-info me-2" />
                                            No extension ranges added
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>
                        <h4 className="card-title">SIM Ports</h4>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>SIM Port</Form.Label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {simPortOptions.map((option) => (
                                            <Form.Check
                                                key={option.id}
                                                type="checkbox"
                                                id={option.id}
                                                label={option.label}
                                                checked={formData.sim_ports.includes(option.value)}
                                                onChange={(e) => {
                                                    const newSimPorts = e.target.checked
                                                        ? [...formData.sim_ports, option.value]
                                                        : formData.sim_ports.filter(port => port !== option.value);
                                                    handleChange("sim_ports", newSimPorts);
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {touched.sim_ports && errors.sim_ports && (
                                        <div className="text-danger small mt-1">
                                            {errors.sim_ports}
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                

                <Card>
                    <Card.Header>
                        <h4 className="card-title">Calling Access</h4>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <div className="d-flex justify-content-end align-items-center mb-4">
                                <div className="d-flex gap-2">
                                    <Form.Control
                                        type="text"
                                        placeholder="Add Front End Calling Access"
                                        className="w-auto"
                                        onChange={(e) => {
                                            setBackEndCallingAccess({
                                                front_end_calling_access: e.target.value,
                                                back_end_calling_access: "",
                                                company_iccid_id: formData.company_iccid_id || 0,
                                                company_id: selectedCompany?.id || 0,
                                            });
                                        }}
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        disabled={
                                            !backEndCallingAccess?.front_end_calling_access ||
                                            !selectedCompany?.id
                                        }
                                        onClick={() => {
                                            if (
                                                backEndCallingAccess?.front_end_calling_access &&
                                                selectedCompany?.id
                                            ) {
                                                updateCreateUpdateCompanyCallingAccess(
                                                    backEndCallingAccess,
                                                );
                                            }
                                        }}
                                    >
                                        <i className="feather icon-plus me-1" /> Add
                                    </Button>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Front End Calling Access</th>
                                            <th>Back End Calling Access</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            
                                            return selectedCompany?.calling_access || [];
                                        })()
                                            .filter(
                                                (callingAccess: CallingAccess) => {
                                                    
                                                    
                                                    const passesFilter = callingAccess.allow_dncr == DNCRCallingAccess.DISALLOW_DNCR &&
                                                        callingAccess.allow_fac_info == FacInfoCallingAccess.DISALLOW_FAC_INFO &&
                                                        callingAccess.company_iccid_id == formData.company_iccid_id;
                                                    
                                                    
                                                    return passesFilter;
                                                }
                                            )
                                            .map(
                                                (callingAccess: CallingAccess, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <span className="fw-medium">
                                                                {callingAccess.front_end_calling_access}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <Select
                                                                value={cssOptions.find((option: any) => option.value === callingAccess.back_end_calling_access) || null}
                                                                onChange={(selectedOption: any) => {
                                                                    updateCreateUpdateCompanyCallingAccess({
                                                                        ...callingAccess,
                                                                        back_end_calling_access: selectedOption?.value || "",
                                                                    });
                                                                }}
                                                                options={cssOptions}
                                                                placeholder="Select Back End Calling Access"
                                                                isSearchable
                                                                isClearable
                                                                menuPortalTarget={document.body}
                                                                styles={{
                                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="text-end">
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (callingAccess.id) {
                                                                        deleteCompanyCallingAccess(callingAccess.id);
                                                                    }
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        {(selectedCompany?.calling_access || []).length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="text-center py-4">
                                                    <div className="text-muted">
                                                        <i className="feather icon-info me-2" />
                                                        No calling access entries found
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Row>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>
                        <h4 className="card-title">DNCR Calling Access</h4>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <div className="d-flex justify-content-end align-items-center mb-4">
                                {!allowDncr && (
                                    <div className="d-flex gap-2" style={{ marginRight: "10px" }}>
                                        <Form.Check className="form-switch custom-switch-v1 mb-2">
                                            <Form.Check.Input
                                                type="checkbox"
                                                className="input-primary"
                                                id="allowDncrCheck"
                                                checked={formData.allow_dncr == DNCRCallingAccess.ALLOW_DNCR}
                                                onChange={(e) => {
                                                    setFormData({
                                                        ...formData,
                                                        allow_dncr: e.target.checked
                                                            ? DNCRCallingAccess.ALLOW_DNCR
                                                            : DNCRCallingAccess.DISALLOW_DNCR,
                                                    });
                                                }}
                                            />
                                            <Form.Check.Label htmlFor="allowDncrCheck">
                                                Allow DNCR
                                            </Form.Check.Label>
                                        </Form.Check>
                                    </div>
                                )}
                                {(formData.allow_dncr == DNCRCallingAccess.ALLOW_DNCR || allowDncr) && (
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            placeholder="Add Front End Calling Access"
                                            className="w-auto"
                                            onChange={(e) => {
                                                setBackEndCallingAccess({
                                                    front_end_calling_access: e.target.value,
                                                    back_end_calling_access: "",
                                                    company_iccid_id: formData.company_iccid_id || null,
                                                    allow_dncr: DNCRCallingAccess.ALLOW_DNCR,
                                                    company_id: selectedCompany?.id || 0,
                                                });
                                            }}
                                        />
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            disabled={
                                                !backEndCallingAccess?.front_end_calling_access ||
                                                !selectedCompany?.id
                                            }
                                            onClick={() => {
                                                if (
                                                    backEndCallingAccess?.front_end_calling_access &&
                                                    selectedCompany?.id
                                                ) {
                                                    updateCreateUpdateCompanyCallingAccess(
                                                        backEndCallingAccess,
                                                    );
                                                }
                                            }}
                                        >
                                            <i className="feather icon-plus me-1" /> Add
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {(formData.allow_dncr == DNCRCallingAccess.ALLOW_DNCR || allowDncr) && (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Front End Calling Access</th>
                                                <th>Back End Calling Access</th>
                                                <th className="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedCompany?.calling_access || [])
                                                .filter(
                                                    (callingAccess: CallingAccess) =>
                                                        callingAccess.allow_dncr == DNCRCallingAccess.ALLOW_DNCR &&
                                                        callingAccess.company_iccid_id == formData.company_iccid_id,
                                                )
                                                .map(
                                                    (callingAccess: CallingAccess, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {callingAccess.front_end_calling_access}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <Select
                                                                    value={cssOptions.find((option: any) => option.value === callingAccess.back_end_calling_access) || null}
                                                                    onChange={(selectedOption: any) => {
                                                                        updateCreateUpdateCompanyCallingAccess({
                                                                            ...callingAccess,
                                                                            back_end_calling_access: selectedOption?.value || "",
                                                                        });
                                                                    }}
                                                                    options={cssOptions}
                                                                    placeholder="Select Back End Calling Access"
                                                                    isSearchable
                                                                    isClearable
                                                                    {...selectProps}
                                                                />
                                                            </td>
                                                            <td className="text-end">
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        if (callingAccess.id) {
                                                                            deleteCompanyCallingAccess(callingAccess.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            {(selectedCompany?.calling_access || []).length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-4">
                                                        <div className="text-muted">
                                                            <i className="feather icon-info me-2" />
                                                            No calling access entries found
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Row>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>
                        <h4 className="card-title">Fact Info Calling Access</h4>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <div className="d-flex justify-content-end align-items-center mb-4">
                                {!allowFacInfo && (
                                    <div className="d-flex gap-2" style={{ marginRight: "10px" }}>
                                        <Form.Check className="form-switch custom-switch-v1 mb-2">
                                            <Form.Check.Input
                                                type="checkbox"
                                                className="input-primary"
                                                id="allowFacInfoCheck"
                                                checked={formData.allow_fac_info == FacInfoCallingAccess.ALLOW_FAC_INFO}
                                                onChange={(e) => {
                                                    setFormData({
                                                        ...formData,
                                                        allow_fac_info: e.target.checked
                                                            ? FacInfoCallingAccess.ALLOW_FAC_INFO
                                                            : FacInfoCallingAccess.DISALLOW_FAC_INFO,
                                                    });
                                                }}
                                            />
                                            <Form.Check.Label htmlFor="allowFacInfoCheck">
                                                Allow Fac Info
                                            </Form.Check.Label>
                                        </Form.Check>
                                    </div>
                                )}
                                {(formData.allow_fac_info == FacInfoCallingAccess.ALLOW_FAC_INFO || allowFacInfo) && (
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            placeholder="Add Front End Calling Access"
                                            className="w-auto"
                                            onChange={(e) => {
                                                setBackEndCallingAccess({
                                                    front_end_calling_access: e.target.value,
                                                    back_end_calling_access: "",
                                                    company_iccid_id: formData.company_iccid_id || null,
                                                    allow_fac_info: FacInfoCallingAccess.ALLOW_FAC_INFO,
                                                    company_id: selectedCompany?.id || 0,
                                                });
                                            }}
                                        />
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            disabled={
                                                !backEndCallingAccess?.front_end_calling_access ||
                                                !selectedCompany?.id
                                            }
                                            onClick={() => {
                                                if (
                                                    backEndCallingAccess?.front_end_calling_access &&
                                                    selectedCompany?.id
                                                ) {
                                                    updateCreateUpdateCompanyCallingAccess(
                                                        backEndCallingAccess,
                                                    );
                                                }
                                            }}
                                        >
                                            <i className="feather icon-plus me-1" /> Add
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {(formData.allow_fac_info == FacInfoCallingAccess.ALLOW_FAC_INFO || allowFacInfo) && (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Front End Calling Access</th>
                                                <th>Back End Calling Access</th>
                                                <th className="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedCompany?.calling_access || [])
                                                .filter(
                                                    (callingAccess: CallingAccess) =>
                                                        callingAccess.allow_fac_info == FacInfoCallingAccess.ALLOW_FAC_INFO &&
                                                        callingAccess.company_iccid_id == formData.company_iccid_id,
                                                )
                                                .map(
                                                    (callingAccess: CallingAccess, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <span className="fw-medium">
                                                                    {callingAccess.front_end_calling_access}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <Select
                                                                    value={cssOptions.find((option: any) => option.value === callingAccess.back_end_calling_access) || null}
                                                                    onChange={(selectedOption: any) => {
                                                                        updateCreateUpdateCompanyCallingAccess({
                                                                            ...callingAccess,
                                                                            back_end_calling_access: selectedOption?.value || "",
                                                                        });
                                                                    }}
                                                                    options={cssOptions}
                                                                    placeholder="Select Back End Calling Access"
                                                                    isSearchable
                                                                    isClearable
                                                                    {...selectProps}
                                                                />
                                                            </td>
                                                            <td className="text-end">
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        if (callingAccess.id) {
                                                                            deleteCompanyCallingAccess(callingAccess.id);
                                                                        }
                                                                    }}
                                                                  >
                                                                        Delete
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            {(selectedCompany?.calling_access || []).length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-4">
                                                        <div className="text-muted">
                                                            <i className="feather icon-info me-2" />
                                                            No calling access entries found
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Row>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>
                        <h4 className="card-title">Additional Information</h4>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Additional Information</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        placeholder="Enter additional information..."
                                        value={formData.additional_info}
                                        onChange={(e) =>
                                            handleChange("additional_info", e.target.value)
                                        }
                                        isInvalid={touched.additional_info && !!errors.additional_info}
                                    />
                                    {touched.additional_info && errors.additional_info && (
                                        <Form.Control.Feedback type="invalid">
                                            {errors.additional_info}
                                        </Form.Control.Feedback>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
                
                <div className="d-flex justify-content-end mt-4">
                    <Button
                        variant="secondary"
                        className="me-2"
                        onClick={clearAllFieldError}
                    >
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                        Submit
                    </Button>
                </div>
            </Form>
        </React.Fragment>
    );
};

export default CreateProfileWizard;
