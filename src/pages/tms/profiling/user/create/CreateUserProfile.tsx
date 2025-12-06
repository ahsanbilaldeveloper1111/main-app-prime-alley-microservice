import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card } from "react-bootstrap";
import { useFormErrors } from "@hooks/tms/useFormErrors";
import {
    MobileUser,
    CallingAccess,
    ExtensionRange,
    DNCRCallingAccess,
    DeviceType,
    FacInfoCallingAccess,
    CompanyIccid,
} from "@models/tms/Company";
import {
    useCompanyList,
    useGetAvailableCompanyIccids,
    useGetAvailableExtensions,
    useGetCompany,
} from "@hooks/tms/company";
import { Company, User, UserType, UserProfile } from "@models/tms";
import { useOrganizationUnits } from "@hooks/tms/customerProfiling";
// import { useGetUser, useUsers } from "@hooks/useUsers";
import {
    VerifyUserInfoParams,
    UserInfoAction,
    CreateUpdateLdapUserParams,
    VerifyLdapUserParams,
    PhoneProduct,
} from "@models/tms/UnfidiedOp";
import {
    useAddUserInfo,
    useCreateLdapUser,
    useGetUserProfilingDraft,
    useUpdateLdapUser,
    useUpdateUserInfo,
    useVerifyLdapUser,
    useVerifyUserInfo,
    useAddLine,
    useAddPhone,
    useUpdateAppUser,
    useUpdateUser,
    useAddRemoteDestinationProfile,
    useAddRemoteDestination,
    useUpdateDNCR,
    useRunLdapSync,
    useAddOnlyLdapUser,
    useAddLdapUser,
    useUpdateOnlyLdapUser,
    useSyncPBX,
    useRemoveLine,
    useRemovePhone,
    useUpdateLine,
    useUpdatePhone,
    useUpdateProfilingErrorLogs,
} from "@hooks/tms/UnifiedOp";

import { generateCustomId, generateComplexId } from "@utils/Helper";
import { toast } from "react-toastify";


import countries from "world-countries";
import _ from "lodash";
import { useRouter } from "next/router";
import Head from "next/head";
import { tmsSession } from "@utils/tmsSession";


// Import partial components
import ProgressHeader from "./components/ProgressHeader";
import CreateLdapUserForm from "./components/CreateLdapUserForm";
import CallingAccessForm from "./components/CallingAccessForm";
import ConfirmationForm from "./components/ConfirmationForm";
import APIProgressSection from "./components/APIProgressSection";

const CreateUserProfile = () => {
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
    const { id: userId } = router.query;

    const isDraft = Boolean(userId?.includes("-draftId"));
    const isUpdateMode = !isNaN(Number(userId)) && !isDraft;

    console.log(userId, "uid");
    
    // Get user from TMS session
    const session = tmsSession.load();
    const user = session?.user;
    // const { data: userData, isLoading: isUserDataLoading } = useGetUser(
    //     userId && !isDraft ? Number(userId) : 0,
    // );
    const userData = null;
    const isUserDataLoading = false;
    const {
        updateProfilingErrorLogs,
        isLoading: isUpdateProfilingErrorLogsPending,
    } = useUpdateProfilingErrorLogs();
    const { data: getUserProfilingDraft, isLoading: isDraftDataLoading } =
        useGetUserProfilingDraft(
            isDraft ? Number(String(userId).split("-draftId")[0]) : 0,
        );

    const [verifyLdapUserFormData, setVerifyLdapUserFormData] =
        useState<VerifyLdapUserParams>({
            companyName: "",
            extensionNumber: null,
            firstName: "",
            email: "",
            lastName: "",
            displayName: "",
            userId: null,
            country: "",
            company_id: 0,
            department: "",
            jobTitle: "",
            password: "",
            client_transactionid: generateCustomId("tms-", 20),
            update_user: isUpdateMode,
            verify: false,
        });

    const [verifyUserInfoFormData, setVerifyUserInfoFormData] =
        useState<VerifyUserInfoParams>({
            extensionNumber: null,
            company_id: 0,
            displayName: "",    
            iccid_number: null,
            company: null,
            update_user: false,
            shareLineAppearanceCssName: "",
            call_repetition: null,
            call_repetition_weekly: null,
            password: "",
            display: null,
            call_repetition_daily: null,
            allow_dncr: DNCRCallingAccess.DISALLOW_DNCR,
            allow_fac_info: FacInfoCallingAccess.DISALLOW_FAC_INFO,
            verify: false,
            mobile_user: MobileUser.No,
            device_type: null,
            client_transactionid: generateCustomId("tms-", 20),
            userId: null,
            country: "",
            department: "",
            jobTitle: "",
            companyName: "",
            firstName: "",
            lastName: "",
            email: "",
            previous_mobile_user: null,
            previous_device_type: null,
        });

    const companyId = useMemo(() => {
        if (userId) {
            return Number((userData as any)?.data?.company_id);
        }
        if (isDraft) {      
            return Number(getUserProfilingDraft?.company_id);
        }
        if (user?.user_type != UserType.ADMIN) {
            return user?.company_id;
        }

        return null;
    }, [
        user?.user_type,
        user?.company_id,
        (userData as any)?.data?.company_id,
        getUserProfilingDraft?.company_id,
        userId,
        isDraft,
    ]);

    const { data: companyData, isLoading: isCompanyLoading } = useGetCompany(
        companyId || verifyLdapUserFormData.company_id || null,
    );

    // Memoize the company list params to prevent unnecessary API calls
    const companyListParams = useMemo(() => ({
        parent_id: null,
        load_calling_access: true,
        load_profile: true,
        load_company_iccid: true,
        search: "",
        ids: [],
    }), []);
    
    const { data: companyList, isLoading: isCompanyListLoading } = useCompanyList(companyListParams);

    console.log(userData, "userData");
    const { addUserInfo, isLoading: isAddUserInfoPending } = useAddUserInfo();
    const { verifyUserInfo, isLoading: isVerifyUserInfoPending } =
        useVerifyUserInfo();

    const { verifyLdapUser, isLoading: isVerifyLdapUserPending } =
        useVerifyLdapUser();
    const { updateUserInfo, isLoading: isUpdateUserInfoPending } =
        useUpdateUserInfo();

    const { addLine, isLoading: isAddLinePending } = useAddLine();
    const { addPhone, isLoading: isAddPhonePending } = useAddPhone();
    const { updateAppUser, isLoading: isUpdateAppUserPending } =
        useUpdateAppUser();
    const { updateUser, isLoading: isUpdateUserPending } = useUpdateUser();
    const {
        addRemoteDestinationProfile,
        isLoading: isAddRemoteDestinationProfilePending,
    } = useAddRemoteDestinationProfile();
    const { addRemoteDestination, isLoading: isAddRemoteDestinationPending } =
        useAddRemoteDestination();
    const { updateDNCR, isLoading: isUpdateDNCRPending } = useUpdateDNCR();
    const { runLdapSync, isLoading: isRunLdapSyncPending } = useRunLdapSync();
    const { addOnlyLdapUser, isLoading: isCreateLdapUserPending } =
        useAddOnlyLdapUser();
    const { addLdapUser, isLoading: isAddLdapUserPending } = useAddLdapUser();
    const { syncPBX, isLoading: isSyncPBXPending } = useSyncPBX();

    const { updateOnlyLdapUser, isLoading: isUpdateLdapUserPending } =
        useUpdateOnlyLdapUser();

    // Update scenario hooks
    const { removeLine, isLoading: isRemoveLinePending } = useRemoveLine();
    const { removePhone, isLoading: isRemovePhonePending } = useRemovePhone();
    const { updateLine, isLoading: isUpdateLinePending } = useUpdateLine();
    const { updatePhone, isLoading: isUpdatePhonePending } = useUpdatePhone();

    const {
        data: availableCompanyIccids,
        isLoading: isAvailableCompanyIccidsLoading,
    } = useGetAvailableCompanyIccids(
        companyData?.data?.profile?.allow_gsm ? companyData?.data?.id : null,
        userId ? Number(userId) : 0,
    );

    // Refs for scrolling
    const callingAccessCardRef = useRef<HTMLDivElement>(null);
    const confirmCardRef = useRef<HTMLDivElement>(null);

    // Progress tracking
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(
        new Set(),
    );

    // Track original field values for each step to detect changes
    const [originalFieldValues, setOriginalFieldValues] = useState<
        Record<string, any>
    >({});

    // Track steps that need re-confirmation due to field changes
    const [stepsNeedingReconfirmation, setStepsNeedingReconfirmation] =
        useState<Set<string>>(new Set());

    // Track if any previous step fields have changed
    const [hasPreviousStepChanges, setHasPreviousStepChanges] = useState(false);

    // Track the last completed step to detect going back
    const [lastCompletedStep, setLastCompletedStep] = useState<string>("");

    // Progress tracking for API calls
    const [apiProgress, setApiProgress] = useState<
        Record<
            string,
            {
                status: "pending" | "in_progress" | "completed" | "failed";
                message: string;
            }
        >
    >({
        // Create mode progress states
        createLdapUser: { status: "pending", message: "Creating LDAP User..." },
        createLocalUser: {
            status: "pending",
            message: "Creating Local User...",
        },
        runLdapSync: { status: "pending", message: "Running LDAP Sync..." },
        addLine: { status: "pending", message: "Adding Line..." },
        addPhone: { status: "pending", message: "Adding Phone..." },
        updateAppUser: { status: "pending", message: "Updating App User..." },
        updateUser: { status: "pending", message: "Updating User..." },
        addRemoteDestinationProfile: {
            status: "pending",
            message: "Adding Remote Destination Profile...",
        },
        addRemoteDestination: {
            status: "pending",
            message: "Adding Remote Destination...",
        },
        updateDNCR: { status: "pending", message: "Updating DNCR Settings..." },

        // Update mode progress states
        updateLdapUser: { status: "pending", message: "Updating LDAP User..." },
        removeMobileLine: {
            status: "pending",
            message: "Removing Mobile Line...",
        },
        removeMobilePhone: {
            status: "pending",
            message: "Removing Mobile Phone...",
        },
        addMobileLine: { status: "pending", message: "Adding Mobile Line..." },
        addMobilePhone: {
            status: "pending",
            message: "Adding Mobile Phone...",
        },
        updateMobileAppUser: {
            status: "pending",
            message: "Updating Mobile App User...",
        },
        updateMobileUser: {
            status: "pending",
            message: "Updating Mobile User...",
        },
        updateLine: { status: "pending", message: "Updating Line..." },
        addNewPhone: { status: "pending", message: "Adding New Phone..." },
        updateUserDevices: {
            status: "pending",
            message: "Updating User Devices...",
        },
        updatePhone: { status: "pending", message: "Updating Phone..." },

        // Additional missing progress states
        syncPBX: { status: "pending", message: "Syncing PBX..." },
        syncImagicle: { status: "pending", message: "Syncing Imagicle..." },
        syncDNCR: { status: "pending", message: "Syncing DNCR..." },
        verifyUserInfo: {
            status: "pending",
            message: "Verifying User Info...",
        },
        verifyLdapUser: {
            status: "pending",
            message: "Verifying LDAP User...",
        },
        removeUser: { status: "pending", message: "Removing User..." },
        removeLdapUser: { status: "pending", message: "Removing LDAP User..." },
        removeLine: { status: "pending", message: "Removing Line..." },
        removePhone: { status: "pending", message: "Removing Phone..." },
    });

    const [currentApiStep, setCurrentApiStep] = useState<string>("");
    const [overallProgress, setOverallProgress] = useState(0);

    // Calculate initial progress when component mounts
    useEffect(() => {
        const totalSteps = Object.keys(apiProgress).length;
        const completedSteps = Object.values(apiProgress).filter(
            (item) => item.status === "completed",
        ).length;
        const progressPercentage =
            totalSteps > 0
                ? Math.round((completedSteps / totalSteps) * 100)
                : 0;
        setOverallProgress(progressPercentage);
    }, [apiProgress]);

    // Progress update functions
    const updateApiProgress = (
        step: string,
        status: "pending" | "in_progress" | "completed" | "failed",
        message?: string,
    ) => {
        setApiProgress((prev) => {
            const newProgress = {
                ...prev,
                [step]: {
                    status,
                    message: message || prev[step]?.message || "",
                },
            };

            // Update overall progress
            const totalSteps = Object.keys(newProgress).length;
            const completedSteps = Object.values(newProgress).filter(
                (item) => item.status === "completed",
            ).length;

            // Calculate progress percentage
            const progressPercentage =
                totalSteps > 0
                    ? Math.round((completedSteps / totalSteps) * 100)
                    : 0;
            setOverallProgress(progressPercentage);

            return newProgress;
        });
    };

    const resetApiProgress = () => {
        setApiProgress((prev) => {
            const reset: Record<string, any> = {};
            Object.keys(prev).forEach((key) => {
                reset[key] = { status: "pending", message: prev[key].message };
            });
            return reset;
        });
        setOverallProgress(0);
        setCurrentApiStep("");
    };

    const resetUpdateProgress = () => {
        setApiProgress((prev) => {
            const reset = { ...prev };
            // Reset only update-related progress states
            const updateKeys = [
                "updateLdapUser",
                "removeMobileLine",
                "removeMobilePhone",
                "addMobileLine",
                "addMobilePhone",
                "updateMobileAppUser",
                "updateMobileUser",
                "updateLine",
                "addNewPhone",
                "updateUserDevices",
                "updatePhone",
                "addRemoteDestinationProfile",
                "addRemoteDestination",
                "updateDNCR",
            ];
            updateKeys.forEach((key) => {
                if (reset[key]) {
                    reset[key] = {
                        status: "pending",
                        message: reset[key].message,
                    };
                }
            });
            return reset;
        });
        setOverallProgress(0);
        setCurrentApiStep("");
    };

    const getStepStatusBadgeClass = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-success";
            case "in_progress":
                return "bg-primary";
            case "failed":
                return "bg-danger";
            case "pending":
                return "bg-secondary";
            default:
                return "bg-secondary";
        }
    };

    const {
        data: availableExtensions,
        isLoading: isAvailableExtensionsLoading,
    } = useGetAvailableExtensions(companyData?.data?.id || null);
    // const { data: usersData, isLoading: usersLoading } = useUsers({
    //     search: "",
    //     company_id: companyData?.data?.id,
    // });
    const usersData = null;
    const usersLoading = false;
    const availableExtensionsOptions = useMemo(
        () =>
            (availableExtensions as any)?.data?.map((extension: number) => ({
                value: extension,
                label: extension,
            })) || [],
        [availableExtensions],
    );
    console.log(companyList, "companyListl");
    const companyOptions = useMemo(
        () =>
            (companyList as any)?.map((company: Company) => ({
                value: company.id,
                label: company.name,
            })) || [],
        [companyList],
    );
    console.log(companyOptions, "companyOptionsss");

    const callRepetitionOptions = useMemo(
        () => [
            { value: "individual", label: "Individual" },
            { value: "company", label: "Company" },
        ],
        [],
    );
    const countryOptions = useMemo(
        () =>
            countries.map((country) => ({
                value: country.name.common,
                label: country.name.common,
            })),
        [],
    );

    const deviceTypeOptions = useMemo(
        () => [
            { value: "TCT", label: "IPHONE" },
            { value: "BOT", label: "ANDROID" },
        ],
        [],
    );
    console.log(touched, "touched");
    
    const handleCreateFormChange = (
        field: string | number | symbol,
        value: any,
    ) => {
        let data = {
            ...verifyLdapUserFormData,
            [field]: value,
        };

        console.log(
            value,
            data,
            availableExtensionsOptions[0],
            "value",
            "field",
            field,
        );
        console.log(data, "data");
        setFieldTouched(field as string, true);
        clearFieldError(field as string);

        if (field == "companyName") {
            data.company_id = +value;
            // Set companyName to the actual company name from the selected option
            const selectedCompany = companyOptions.find((option: any) => option.value === +value);
            data.companyName = selectedCompany?.label || "";
            // Fetch company details when company changes
            if (value) {
                // The useGetCompany hook will automatically fetch data when companyId changes
                // We don't need to do anything here as the hook handles it
            }
        }

        // Auto-generate displayName when firstName or lastName changes
        if (field === "firstName" || field === "lastName") {
            data.displayName = `${data.firstName} ${data.lastName}`.trim();
        }

        // Auto-generate userId when firstName or extensionNumber changes
        if (field === "firstName" || field === "extensionNumber") {
            if (data.firstName && data.extensionNumber) {
                data.userId = `${data.firstName}_S${data.extensionNumber}`;
            }
        }
        // Check if this is a completed step and field has changed
        const currentStepNumber = parseInt(key.split("-")[1]);
        if (completedSteps.has(currentStepNumber)) {
            const originalValue = originalFieldValues[`${key}.${String(field)}`];
            if (originalValue !== value) {
                setStepsNeedingReconfirmation(
                    (prev) => new Set(Array.from(prev).concat(key)),
                );
                // Mark that previous steps have changes
                setHasPreviousStepChanges(true);
                // Remove completion status for this step and all subsequent steps
                setCompletedSteps((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(currentStepNumber);
                    // Remove all steps after the changed step
                    for (let i = currentStepNumber + 1; i <= 3; i++) {
                        newSet.delete(i);
                    }
                    return newSet;
                });
            }
        }

        setVerifyLdapUserFormData(data);
    };

    const handleVerifyUserInfoChange = (
        field: string | number | symbol,
        value: any,
    ) => {
        let data = {
            ...verifyUserInfoFormData,
            [field]: value,
        };
        // Mark field as touched when user interacts with it

        if (field == "call_repetition") {
            data.call_repetition_daily = null;
            data.call_repetition_weekly = null;
        }
        if (field == "mobile_user") {
            data.device_type = null;
        }

        console.log(data, "data");

        // Check if step 2 is completed and field has changed
        if (completedSteps.has(2)) {
            const originalValue = originalFieldValues[`tab-2.${String(field)}`];
            console.log(
                originalValue,
                "originalValue",
                originalValue !== value,
            );
            if (originalValue !== value) {
                setStepsNeedingReconfirmation(
                    (prev) => new Set(Array.from(prev).concat("tab-2")),
                );
                // Mark that previous steps have changes
                setHasPreviousStepChanges(true);
                // Remove completion status for step 2 and step 3
                setCompletedSteps((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(2);
                    newSet.delete(3);
                    return newSet;
                });
            }
        }

        // Mark field as touched when user interacts with it
        setFieldTouched(field as string, true);
        clearFieldError(field as string);

        setVerifyUserInfoFormData(data);
    };

    // Handle API errors
    const [key, setKey] = useState("tab-1");
    const totalTabs = 3;

    // Auto-scroll to next step
    const scrollToNextStep = (step: number) => {
        setTimeout(() => {
            if (step === 2 && callingAccessCardRef.current) {
                callingAccessCardRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            } else if (step === 3 && confirmCardRef.current) {
                confirmCardRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        }, 500);
    };

    // Calculate progress
    const progress = useMemo(() => {
        return (completedSteps.size / 3) * 100;
    }, [completedSteps.size]);

    // Helper function to get current loading state
    const getCurrentLoadingState = (step: number) => {
        switch (step) {
            case 1:
                return isVerifyLdapUserPending;
            case 2:
                return isVerifyUserInfoPending;
            case 3:
                if (isUpdateMode) {
                    return (
                        isUpdateUserInfoPending ||
                        isUpdateLdapUserPending ||
                        isRemoveLinePending ||
                        isRemovePhonePending ||
                        isUpdateLinePending ||
                        isUpdatePhonePending ||
                        isUpdateAppUserPending ||
                        isUpdateUserPending ||
                        isAddRemoteDestinationProfilePending ||
                        isAddRemoteDestinationPending ||
                        isUpdateDNCRPending ||
                        isAddUserInfoPending ||
                        isUpdateUserInfoPending ||
                        isUpdateLdapUserPending ||
                        isRemoveLinePending ||
                        isRemovePhonePending ||
                        isUpdateLinePending ||
                        isUpdatePhonePending ||
                        isUpdateAppUserPending ||
                        isUpdateUserPending ||
                        isAddRemoteDestinationProfilePending ||
                        isAddRemoteDestinationPending ||
                        isUpdateDNCRPending ||
                        isAddUserInfoPending
                    );
                } else {
                    return (
                        isAddUserInfoPending ||
                        isUpdateUserInfoPending ||
                        isAddRemoteDestinationProfilePending ||
                        isAddRemoteDestinationPending ||
                        isUpdateDNCRPending ||
                        isAddLinePending ||
                        isAddPhonePending ||
                        isAddRemoteDestinationProfilePending ||
                        isAddRemoteDestinationPending ||
                        isUpdateUserPending ||
                        isUpdateAppUserPending ||
                        isUpdateUserInfoPending ||
                        isUpdateLdapUserPending ||
                        isRemoveLinePending ||
                        isRemovePhonePending ||
                        isUpdateAppUserPending ||
                        isUpdateUserPending ||
                        isAddRemoteDestinationProfilePending ||
                        isAddRemoteDestinationPending ||
                        isUpdateDNCRPending ||
                        isCreateLdapUserPending
                    );
                }
            default:
                return false;
        }
    };

    // Helper function to check if user can proceed to next step
    const canProceedToNext = (step: number) => {
        switch (step) {
            case 1:
                if (isUpdateMode) {
                    return (
                        completedSteps.has(1) ||
                        (verifyLdapUserFormData.firstName &&
                            verifyLdapUserFormData.lastName &&
                            verifyLdapUserFormData.email &&
                            verifyLdapUserFormData.department)
                    );
                } else {
                    return (
                        completedSteps.has(1) ||
                        (verifyLdapUserFormData.department &&
                            verifyLdapUserFormData.userId &&
                            verifyLdapUserFormData.extensionNumber &&
                            verifyLdapUserFormData.firstName &&
                            verifyLdapUserFormData.lastName &&
                            verifyLdapUserFormData.email)
                    );
                }
            case 2:
                return (
                    completedSteps.has(2) ||
                    (companyData?.data?.id &&
                        verifyUserInfoFormData.shareLineAppearanceCssName)
                );
            case 3:
                if (isUpdateMode) {
                    return (
                        completedSteps.has(3) ||
                        (companyData?.data?.id &&
                            verifyLdapUserFormData.firstName &&
                            verifyLdapUserFormData.lastName &&
                            verifyLdapUserFormData.department &&
                            verifyUserInfoFormData.shareLineAppearanceCssName)
                    );
                } else {
                    return (
                        completedSteps.has(3) ||
                        (companyData?.data?.id &&
                            verifyLdapUserFormData.extensionNumber &&
                            verifyLdapUserFormData.userId &&
                            verifyLdapUserFormData.firstName &&
                            verifyLdapUserFormData.department &&
                            verifyUserInfoFormData.shareLineAppearanceCssName &&
                            verifyLdapUserFormData.lastName)
                    );
                }
            default:
                return false;
        }
    };

    // Helper function to check if a specific step is completed
    const isStepCompleted = (stepKey: string) => {
        return completedSteps.has(Number(stepKey));
    };

    // Helper function to check if user can navigate to a specific step
    const canNavigateToStep = (stepKey: string) => {
        const stepNumber = parseInt(stepKey);
        const currentStepNumber = currentStep;

        // Can always navigate to current step or previous steps
        if (stepNumber <= currentStepNumber) return true;

        if (
            stepsNeedingReconfirmation.has(key) &&
            stepNumber > currentStepNumber
        ) {
            return false;
        }
        // Can navigate to next step if current step is completed
        if (stepNumber === currentStepNumber + 1) {
            return isStepCompleted(key);
        }

        // Can navigate to any step if all previous steps are completed
        for (let i = 1; i < stepNumber; i++) {
            if (!isStepCompleted(`tab-${i}`)) return false;
        }
        return true;
    };

    const callAccessOptions = useMemo(() => {
        const iccidData = (companyData?.data?.iccids || []).find(
            (iccid: CompanyIccid) =>
                iccid.iccid_numbers?.includes(
                    verifyUserInfoFormData.iccid_number?.toString() || "",
                ),
        );

        const iccid = iccidData?.id || null;
        console.log(
            iccid,
            "iccidiccid",
            verifyUserInfoFormData.iccid_number,
            companyData?.data?.iccids,
            verifyUserInfoFormData.iccid_number,
        );
        return (
            (companyData?.data?.calling_access || [])
                .filter((access: CallingAccess) => {
                    if (
                        verifyUserInfoFormData.allow_fac_info ==
                        FacInfoCallingAccess.ALLOW_FAC_INFO
                    ) {
                        return (
                            access.allow_fac_info ==
                                FacInfoCallingAccess.ALLOW_FAC_INFO &&
                            iccid == access.company_iccid_id
                        );
                    } else if (
                        verifyUserInfoFormData.allow_dncr ==
                            DNCRCallingAccess.ALLOW_DNCR ||
                        verifyUserInfoFormData.call_repetition
                    ) {
                        return (
                            access.allow_dncr == DNCRCallingAccess.ALLOW_DNCR &&
                            iccid == access.company_iccid_id
                        );
                    } else {
                        return (
                            access.allow_fac_info ==
                                FacInfoCallingAccess.DISALLOW_FAC_INFO &&
                            access.allow_dncr ==
                                DNCRCallingAccess.DISALLOW_DNCR &&
                            iccid == access.company_iccid_id
                        );
                    }
                })
                .map((access: CallingAccess) => ({
                    value: access.back_end_calling_access,
                    label: access.front_end_calling_access,
                })) || []
        );
    }, [
        companyData?.data?.iccids,
        verifyUserInfoFormData.allow_dncr,
        verifyUserInfoFormData.allow_fac_info,
        verifyUserInfoFormData.call_repetition,
        verifyUserInfoFormData.iccid_number,
    ]);
    console.log(callAccessOptions, "callAccessOptions");
    const iccidOptions = useMemo(() => {
        return (
            (availableCompanyIccids?.data || []).map((iccid: number) => ({
                value: iccid,
                label: iccid.toString(),
            })) || []
        );
    }, [availableCompanyIccids?.data]);
    console.log(iccidOptions, "iccidOptions");

    // Form submission handlers
    const submitVerifyLdapUserForm = async () => {
        try {
            // Mark all fields as touched for validation
            setAllTouched();
            
            // Check if form is valid
            if (!canProceedToNext(1)) {
                console.log('Form validation failed');
                return;
            }

            // Prepare form data for verification
            const formData = {
                ...verifyLdapUserFormData,
                company_id: verifyLdapUserFormData.company_id || companyId,
                // Fix companyName to use actual company name instead of company_id
                companyName: companyData?.data?.name || verifyLdapUserFormData.companyName,
                // Generate displayName from firstName and lastName
                displayName: `${verifyLdapUserFormData.firstName} ${verifyLdapUserFormData.lastName}`.trim(),
                // Generate userId in format: firstName_S{extensionNumber}
                userId: verifyLdapUserFormData.userId || `${verifyLdapUserFormData.firstName}_S${verifyLdapUserFormData.extensionNumber}`,
                verify: true
            };

            console.log('Submitting LDAP user form:', formData);

            // Call the verify LDAP user API
            await verifyLdapUser(formData);
            
            //console.log('LDAP user verification successful');
            
            // Mark step 1 as completed
            setCompletedSteps(prev => new Set(prev).add(1));
            
            // Store original field values for change detection
            setOriginalFieldValues(prev => ({
                ...prev,
                ...Object.keys(verifyLdapUserFormData).reduce((acc, key) => {
                    acc[`tab-1.${key}`] = verifyLdapUserFormData[key as keyof VerifyLdapUserParams];
                    return acc;
                }, {} as Record<string, any>)
            }));

            // Move to next step
            setCurrentStep(2);
            scrollToNextStep(2);
            
            //toast.success('LDAP user verification completed successfully!');
        } catch (error) {
            console.error('Error verifying LDAP user:', error);
            toast.error('Failed to verify LDAP user. Please try again.');
        }
    };

    const submitVerifyUserInfoForm = async () => {
        try {
            // Mark all fields as touched for validation
            setAllTouched();
            
            // Check if form is valid
            if (!canProceedToNext(2)) {
                console.log('Form validation failed');
                return;
            }

            // Prepare form data for verification - merge LDAP user data with calling access data
            const formData = {
                // Include all data from the LDAP user verification step
                ...verifyLdapUserFormData,
                // Only override with calling access specific data (not basic user info)
                company: verifyUserInfoFormData.company,
                shareLineAppearanceCssName: verifyUserInfoFormData.shareLineAppearanceCssName,
                mobile_user: verifyUserInfoFormData.mobile_user,
                call_repetition_daily: verifyUserInfoFormData.call_repetition_daily,
                call_repetition_weekly: verifyUserInfoFormData.call_repetition_weekly,
                call_repetition: verifyUserInfoFormData.call_repetition,
                allow_dncr: verifyUserInfoFormData.allow_dncr,
                display: verifyUserInfoFormData.display,
                allow_fac_info: verifyUserInfoFormData.allow_fac_info,
                device_type: verifyUserInfoFormData.device_type,
                previous_mobile_user: verifyUserInfoFormData.previous_mobile_user,
                previous_device_type: verifyUserInfoFormData.previous_device_type,
                iccid_number: verifyUserInfoFormData.iccid_number,
                // Ensure company_id is properly set
                company_id: companyId || verifyLdapUserFormData.company_id,
                // Ensure verify flag is set
                verify: true
            };

            console.log('Submitting user info form:', formData);

            // Call the verify user info API
            await verifyUserInfo(formData);
            
            console.log('User info verification successful');
            
            // Call the add LDAP user API after successful verification
            console.log('Calling add LDAP user API with data:', formData);
            await addLdapUser(formData);
            
            console.log('LDAP user added successfully');
            
            // Mark step 2 as completed
            setCompletedSteps(prev => new Set(prev).add(2));
            
            // Store original field values for change detection
            setOriginalFieldValues(prev => ({
                ...prev,
                ...Object.keys(verifyUserInfoFormData).reduce((acc, key) => {
                    acc[`tab-2.${key}`] = verifyUserInfoFormData[key as keyof VerifyUserInfoParams];
                    return acc;
                }, {} as Record<string, any>)
            }));

            // Move to next step
            setCurrentStep(3);
            scrollToNextStep(3);
            
            toast.success('User info verification and LDAP user creation completed successfully!');
        } catch (error) {
            console.error('Error in user verification or LDAP user creation:', error);
            toast.error('Failed to verify user info or create LDAP user. Please try again.');
        }
    };

    const submitUserInfoForm = async () => {
        // Implementation will be moved to ConfirmationForm component
    };

    return (
        <React.Fragment>
            <Head>
                <title>Create User Profile</title>
            </Head>
            
            {/* Progress Header */}
            <ProgressHeader
                progress={progress}
                currentStep={currentStep}
                completedSteps={completedSteps}
            />

            {/* Form Cards */}
            <div className="container-fluid mb-5">
                {/* Card 1: Create LDAP User */}
                <CreateLdapUserForm
                    verifyLdapUserFormData={verifyLdapUserFormData}
                    handleCreateFormChange={handleCreateFormChange}
                    errors={errors}
                    touched={touched}
                    companyData={companyData}
                    companyOptions={companyOptions}
                    availableExtensionsOptions={availableExtensionsOptions}
                    countryOptions={countryOptions}
                    isUpdateMode={isUpdateMode}
                    userData={userData}
                    user={user}
                    completedSteps={completedSteps}
                    getCurrentLoadingState={getCurrentLoadingState}
                    canProceedToNext={canProceedToNext}
                    onSubmit={submitVerifyLdapUserForm}
                />

                {/* Card 2: Add Calling Access */}
                <CallingAccessForm
                    ref={callingAccessCardRef}
                    verifyUserInfoFormData={verifyUserInfoFormData}
                    handleVerifyUserInfoChange={handleVerifyUserInfoChange}
                    errors={errors}
                    touched={touched}
                    companyData={companyData}
                    callAccessOptions={callAccessOptions}
                    iccidOptions={iccidOptions}
                    callRepetitionOptions={callRepetitionOptions}
                    deviceTypeOptions={deviceTypeOptions}
                    completedSteps={completedSteps}
                    hasPreviousStepChanges={hasPreviousStepChanges}
                    getCurrentLoadingState={getCurrentLoadingState}
                    canProceedToNext={canProceedToNext}
                    onSubmit={submitVerifyUserInfoForm}
                />

                {/* Card 3: Confirm & Submit */}
                {/* <ConfirmationForm
                    ref={confirmCardRef}
                    verifyLdapUserFormData={verifyLdapUserFormData}
                    verifyUserInfoFormData={verifyUserInfoFormData}
                    companyData={companyData}
                    completedSteps={completedSteps}
                    isUpdateMode={isUpdateMode}
                    getCurrentLoadingState={getCurrentLoadingState}
                    canProceedToNext={canProceedToNext}
                    onSubmit={submitUserInfoForm}
                    apiProgress={apiProgress}
                    overallProgress={overallProgress}
                    getStepStatusBadgeClass={getStepStatusBadgeClass}
                /> */}
            </div>
        </React.Fragment>
    );
};

export default CreateUserProfile;
