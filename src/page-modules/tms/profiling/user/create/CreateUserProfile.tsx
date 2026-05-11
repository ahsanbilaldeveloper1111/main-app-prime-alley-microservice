import React, { useEffect, useMemo, useState, useRef } from "react";
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
import { Company, User } from "@models/tms";
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


// Import partial components
import ProgressHeader from "./components/ProgressHeader";
import CreateLdapUserForm from "./components/CreateLdapUserForm";
import CallingAccessForm from "./components/CallingAccessForm";

interface CreateUserProfileProps {
    initialUserData?: any;
}

const CreateUserProfile = ({ initialUserData }: CreateUserProfileProps = {}) => {
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
    const isUpdateMode = !Number.isNaN(Number(userId)) && !isDraft;

    // TMS auth has been removed — no signed-in TMS user context in this screen.
    const user: User | null = null;
    // const { data: userData, isLoading: isUserDataLoading } = useGetUser(
    //     userId && !isDraft ? Number(userId) : 0,
    // );
    const userData = initialUserData || null;
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

        return null;
    }, [
        (userData as any)?.data?.company_id,
        getUserProfilingDraft?.company_id,
        userId,
        isDraft,
    ]);

    const { data: companyData, isLoading: isCompanyLoading } = useGetCompany(
        companyId || verifyLdapUserFormData.company_id || 0,
    );
    
    // Update currentUserCompanyId and currentUserCompanyName when companyData is successfully loaded
    useEffect(() => {
        if (companyData?.success === true && companyData?.data) {
            const companyId = companyData.data.id;
            const companyName = companyData.data.name;
            
            if (companyId) {
                setCurrentUserCompanyId(companyId);
            }
            if (companyName) {
                setCurrentUserCompanyName(companyName);
            }
        }
    }, [companyData]);

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
    const companyOptions = useMemo(
        () =>
            (companyList as any)?.map((company: Company) => ({
                value: company.id,
                label: company.name,
            })) || [],
        [companyList],
    );

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

    const handleCreateFormChange = (
        field: string | number | symbol,
        value: any,
    ) => {
        let data = {
            ...verifyLdapUserFormData,
            [field]: value,
        };

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

        // User ID is now manually entered, no auto-generation
        // Check if this is a completed step and field has changed
        const currentStepNumber = 1;
        const stepTabPrefix = "tab-1";
        if (completedSteps.has(currentStepNumber)) {
            const originalValue =
                originalFieldValues[`${stepTabPrefix}.${String(field)}`];
            if (originalValue !== value) {
                setStepsNeedingReconfirmation(
                    (prev) => new Set(Array.from(prev).concat(stepTabPrefix)),
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
            if (value === "company") {
                // When "company" is selected, populate from company profile data
                const companyProfile = companyData?.data?.profile;
                if (companyProfile) {
                    data.call_repetition_daily = companyProfile.call_repetition_daily 
                        ? Number.parseInt(companyProfile.call_repetition_daily) 
                        : null;
                    data.call_repetition_weekly = companyProfile.call_repetition_weekly 
                        ? Number.parseInt(companyProfile.call_repetition_weekly) 
                        : null;
                } else {
                    data.call_repetition_daily = null;
                    data.call_repetition_weekly = null;
                }
            } else {
                // When "individual" or other value is selected, clear the values
                data.call_repetition_daily = null;
                data.call_repetition_weekly = null;
            }
        }
        if (field == "mobile_user") {
            data.device_type = null;
        }

        // Check if step 2 is completed and field has changed
        if (completedSteps.has(2)) {
            const originalValue = originalFieldValues[`tab-2.${String(field)}`];
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

    const [currentUserCompanyId, setCurrentUserCompanyId] =
        useState<number | null>(null);
    const [currentUserCompanyName, setCurrentUserCompanyName] =
        useState<string>("");

    // Populate form data from userData when available (for edit mode)
    useEffect(() => {
        if (userData && isUpdateMode) {
            // Map API response to verifyLdapUserFormData
            const phoneNo = userData.phone_no ? Number.parseInt(userData.phone_no) : null;
            const companyId = userData.company_id ? Number.parseInt(userData.company_id) : 0;
            
            setVerifyLdapUserFormData({
                companyName: userData.parent_company?.name || userData.company || "",
                extensionNumber: phoneNo,
                firstName: userData.first_name || "",
                email: userData.email || "",
                lastName: userData.last_name || "",
                displayName: userData.name || "",
                userId: userData.username || null,
                country: userData.country || "",
                company_id: companyId,
                department: userData.department || "",
                jobTitle: userData.job_title || "",
                password: "",
                client_transactionid: generateCustomId("tms-", 20),
                update_user: true,
                verify: false,
            });

            // Map API response to verifyUserInfoFormData
            const profile = userData.parent_company?.profile;
            const callingAccess = userData.parent_company?.calling_access?.[0];
            
            setVerifyUserInfoFormData({
                extensionNumber: phoneNo,
                company_id: companyId,
                displayName: userData.name || "",
                iccid_number: null, // Will be set from iccids if needed
                company: null,
                update_user: true,
                shareLineAppearanceCssName: callingAccess?.back_end_calling_access || "",
                call_repetition: profile?.call_repetition_daily ? "individual" : "company",
                call_repetition_weekly: profile?.call_repetition_weekly ? Number.parseInt(profile.call_repetition_weekly) : null,
                password: "",
                display: null,
                call_repetition_daily: profile?.call_repetition_daily ? Number.parseInt(profile.call_repetition_daily) : null,
                allow_dncr: callingAccess?.allow_dncr === "1" ? DNCRCallingAccess.ALLOW_DNCR : DNCRCallingAccess.DISALLOW_DNCR,
                allow_fac_info: callingAccess?.allow_fac_info === "1" ? FacInfoCallingAccess.ALLOW_FAC_INFO : FacInfoCallingAccess.DISALLOW_FAC_INFO,
                verify: false,
                mobile_user: profile?.mobile_user === "Yes" ? MobileUser.Yes : MobileUser.No,
                device_type: null,
                client_transactionid: generateCustomId("tms-", 20),
                userId: userData.username || null,
                country: userData.country || "",
                department: userData.department || "",
                jobTitle: userData.job_title || "",
                companyName: userData.parent_company?.name || userData.company || "",
                firstName: userData.first_name || "",
                lastName: userData.last_name || "",
                email: userData.email || "",
                previous_mobile_user: null,
                previous_device_type: null,
            });

            // Set company ID and name
            if (companyId) {
                setCurrentUserCompanyId(companyId);
            }
            if (userData.parent_company?.name || userData.company) {
                setCurrentUserCompanyName(userData.parent_company?.name || userData.company);
            }
        }
    }, [userData, isUpdateMode]);

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

   

    const callAccessOptions = useMemo(() => {
        const iccidData = (companyData?.data?.iccids || []).find(
            (iccid: CompanyIccid) =>
                iccid.iccid_numbers?.includes(
                    verifyUserInfoFormData.iccid_number?.toString() || "",
                ),
        );

        const iccid = iccidData?.id || null;
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
    const iccidOptions = useMemo(() => {
        // Get ICCID options from companyData.iccids array
        const iccids = companyData?.data?.iccids || [];
        // Flatten all iccid_numbers from all ICCID objects
        const allIccidNumbers: string[] = [];
        iccids.forEach((iccidItem: any) => {
            if (iccidItem.iccid_numbers && Array.isArray(iccidItem.iccid_numbers)) {
                allIccidNumbers.push(...iccidItem.iccid_numbers);
            }
        });
        // Create options from flattened ICCID numbers
        return allIccidNumbers.map((iccid: string) => ({
            value: iccid,
            label: iccid,
        }));
    }, [companyData?.data?.iccids]);

    // Form submission handlers
    const submitVerifyLdapUserForm = async () => {
        try {
            // Mark all fields as touched for validation
            setAllTouched();
            
            // Check if form is valid
            if (!canProceedToNext(1)) {
                return;
            }

            // Prepare form data for verification
            // Format userId as: userEnteredValue_companyData?.data?.profile?.user_id_prefix
            const userEnteredValue = verifyLdapUserFormData.userId || "";
            const userPrefix = companyData?.data?.profile?.user_id_prefix || "";
            const formattedUserId = userEnteredValue && userPrefix 
                ? `${userEnteredValue}_${userPrefix}` 
                : userEnteredValue || null;

            const formData: VerifyLdapUserParams = {
                ...verifyLdapUserFormData,
                company_id: (currentUserCompanyId || verifyLdapUserFormData.company_id || companyId || 0) as number,
                // Fix companyName to use actual company name instead of company_id
                companyName: currentUserCompanyName || companyData?.data?.name || verifyLdapUserFormData.companyName,
                // Generate displayName from firstName and lastName
                displayName: `${verifyLdapUserFormData.firstName} ${verifyLdapUserFormData.lastName}`.trim(),
                // Format userId as: userEnteredValue_user_id_prefix
                userId: formattedUserId,
                verify: true
            };

            // Call the verify LDAP user API
            const responseVerifyLdapUser = await verifyLdapUser(formData);
            
            // Check if the response indicates failure
            if (responseVerifyLdapUser && responseVerifyLdapUser.success === false) {
                // Extract error message from response
                const errorMessage = (responseVerifyLdapUser as any)?.response?.message || 
                                    responseVerifyLdapUser.message || 
                                    'LDAP user verification failed';
                toast.error(errorMessage);
                return; // Stop execution here
            }

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
                return;
            }

            // Format userId as: userEnteredValue_companyData?.data?.profile?.user_id_prefix
            const userEnteredValue = verifyLdapUserFormData.userId || "";
            const userPrefix = companyData?.data?.profile?.user_id_prefix || "";
            const formattedUserId = userEnteredValue && userPrefix 
                ? `${userEnteredValue}_${userPrefix}` 
                : userEnteredValue || null;

            // Prepare form data for verification - merge LDAP user data with calling access data
            const formData = {
                // Include all data from the LDAP user verification step
                ...verifyLdapUserFormData,
                // Format userId as: userEnteredValue_user_id_prefix
                userId: formattedUserId,
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
                // Ensure company_id is properly set from currentUserCompanyId
                company_id: (currentUserCompanyId || companyId || verifyLdapUserFormData.company_id || 0) as number,
                // Ensure companyName is properly set from currentUserCompanyName
                companyName: currentUserCompanyName || companyData?.data?.name || verifyLdapUserFormData.companyName,
                // Ensure verify flag is set
                verify: true
            };

            // Call the verify user info API
            const responseVerifyUserInfo = await verifyUserInfo(formData);
            
            // Check if the response indicates failure
            if (responseVerifyUserInfo && responseVerifyUserInfo.success === false) {
                // Extract error message from response
                const errorMessage = (responseVerifyUserInfo as any)?.response?.message || 
                                    responseVerifyUserInfo.message || 
                                    'User info verification failed';
                toast.error(errorMessage);
                return; // Stop execution here
            }

            // Call the add LDAP user API after successful verification
            const responseAddLdapUser = await addLdapUser(formData);
            
            // Check if the response indicates failure
            if (responseAddLdapUser && responseAddLdapUser.success === false) {
                // Extract error message from response
                const errorMessage = (responseAddLdapUser as any)?.response?.message || 
                                    responseAddLdapUser.message || 
                                    'Failed to add LDAP user';
                toast.error(errorMessage);
                return; // Stop execution here
            }

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
                    company_id={currentUserCompanyId}
                    companyName={currentUserCompanyName}
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
                    company_id={currentUserCompanyId}
                    companyName={currentUserCompanyName}
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

                
            </div>
        </React.Fragment>
    );
};

export default CreateUserProfile;
