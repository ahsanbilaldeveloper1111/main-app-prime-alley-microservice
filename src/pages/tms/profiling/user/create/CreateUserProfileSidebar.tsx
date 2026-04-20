import React, { useEffect, useMemo, useState, useRef } from "react";
import { X } from "lucide-react";
import { useFormErrors } from "@hooks/tms/useFormErrors";
import {
    MobileUser,
    CallingAccess,
    DNCRCallingAccess,
    FacInfoCallingAccess,
    CompanyIccid,
} from "@models/tms/Company";
import {
    useCompanyList,
    useGetAvailableExtensions,
    useGetCompany,
} from "@hooks/tms/company";
import { Company, User, UserType } from "@models/tms";
import {
    VerifyUserInfoParams,
    VerifyLdapUserParams,
} from "@models/tms/UnfidiedOp";
import {
    useAddUserInfo,
    useGetUserProfilingDraft,
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
    useAddOnlyLdapUser,
    useAddLdapUser,
    useUpdateOnlyLdapUser,
    useRemoveLine,
    useRemovePhone,
    useUpdateLine,
    useUpdatePhone,
} from "@hooks/tms/UnifiedOp";

import { generateCustomId } from "@utils/Helper";
import { toast } from "react-toastify";


import countries from "world-countries";
import { useRouter } from "next/router";


// Import partial components
import CreateLdapUserForm from "./components/CreateLdapUserForm";
import CallingAccessForm from "./components/CallingAccessForm";

interface CreateUserProfileProps {
    initialUserData?: any;
    isOpen?: boolean;
    onClose?: () => void;
    title?: string;
}

type UserProfileSidebarTab = "ldap" | "calling-access";

type TabVisualState = {
    backgroundColor: string;
    border: string;
    color: string;
    cursor: "pointer" | "not-allowed";
};

type CompanyOption = {
    value: number | string;
    label: string;
};

type ResponseWithMessage = {
    success?: boolean;
    message?: string;
    response?: {
        message?: string;
    };
};

type FormFieldKey = string | number | symbol;

function parseOptionalInteger(value: unknown): number | null {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? Math.trunc(value) : null;
    }

    if (typeof value === "string") {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
            return null;
        }

        const parsedValue = Number.parseInt(trimmedValue, 10);
        return Number.isNaN(parsedValue) ? null : parsedValue;
    }

    if (typeof value === "bigint") {
        return Number(value);
    }

    return null;
}

function getUserCompanyName(userData: any): string {
    return userData?.parent_company?.name ?? userData?.company ?? "";
}

function getOriginalFieldValueKey(
    stepNumber: number,
    field: FormFieldKey,
): string {
    return `tab-${stepNumber}.${String(field)}`;
}

function getFormattedUserId(
    userId: string | null | undefined,
    prefix: string | null | undefined,
): string | null {
    const trimmedUserId = userId?.trim() ?? "";
    const trimmedPrefix = prefix?.trim() ?? "";

    if (!trimmedUserId) {
        return null;
    }

    return trimmedPrefix ? `${trimmedUserId}_${trimmedPrefix}` : trimmedUserId;
}

function getApiErrorMessage(
    response: ResponseWithMessage | null | undefined,
    fallbackMessage: string,
): string {
    return response?.response?.message || response?.message || fallbackMessage;
}

function toastApiError(
    response: ResponseWithMessage | null | undefined,
    fallback: string,
): boolean {
    if (response?.success === false) {
        toast.error(getApiErrorMessage(response, fallback));
        return true;
    }
    return false;
}

function buildTabSnapshot(
    tabNumber: number,
    formData: Record<string, any>,
): Record<string, any> {
    return Object.keys(formData).reduce<Record<string, any>>((acc, key) => {
        acc[`tab-${tabNumber}.${key}`] = formData[key];
        return acc;
    }, {});
}

function buildLdapFormData(
    currentData: VerifyLdapUserParams,
    field: FormFieldKey,
    value: any,
    companyOptions: CompanyOption[],
): VerifyLdapUserParams {
    const nextData = {
        ...currentData,
        [field]: value,
    };

    if (field === "companyName") {
        nextData.company_id = Number(value);
        const selectedCompany = companyOptions.find(
            (option) => option.value === Number(value),
        );
        nextData.companyName = selectedCompany?.label || "";
    }

    if (field === "firstName" || field === "lastName") {
        nextData.displayName = `${nextData.firstName} ${nextData.lastName}`.trim();
    }

    return nextData;
}

function buildUserInfoFormData(
    currentData: VerifyUserInfoParams,
    field: FormFieldKey,
    value: any,
    companyProfile: any,
): VerifyUserInfoParams {
    const nextData = {
        ...currentData,
        [field]: value,
    };

    if (field === "call_repetition") {
        if (value === "company") {
            nextData.call_repetition_daily = parseOptionalInteger(
                companyProfile?.call_repetition_daily,
            );
            nextData.call_repetition_weekly = parseOptionalInteger(
                companyProfile?.call_repetition_weekly,
            );
        } else {
            nextData.call_repetition_daily = null;
            nextData.call_repetition_weekly = null;
        }
    }

    if (field === "mobile_user") {
        nextData.device_type = null;
    }

    return nextData;
}

function buildEmptySharedFields() {
    return {
        companyName: "",
        extensionNumber: null as number | null,
        firstName: "",
        email: "",
        lastName: "",
        displayName: "",
        userId: null as string | null,
        country: "",
        company_id: 0,
        department: "",
        jobTitle: "",
        password: "",
    };
}

function buildSharedUserBaseFields(userData: any) {
    return {
        ...buildEmptySharedFields(),
        companyName: getUserCompanyName(userData),
        extensionNumber: parseOptionalInteger(userData?.phone_no),
        firstName: userData?.first_name || "",
        email: userData?.email || "",
        lastName: userData?.last_name || "",
        displayName: userData?.name || "",
        userId: userData?.username || null,
        country: userData?.country || "",
        company_id: parseOptionalInteger(userData?.company_id) ?? 0,
        department: userData?.department || "",
        jobTitle: userData?.job_title || "",
    };
}

function buildInitialLdapUserFormData(userData: any): VerifyLdapUserParams {
    return {
        ...buildSharedUserBaseFields(userData),
        client_transactionid: generateCustomId("tms-", 20),
        update_user: true,
        verify: false,
    };
}

function buildInitialUserInfoFormData(userData: any): VerifyUserInfoParams {
    const profile = userData?.parent_company?.profile;
    const callingAccess = userData?.parent_company?.calling_access?.[0];

    return {
        ...buildSharedUserBaseFields(userData),
        iccid_number: null,
        company: null,
        update_user: true,
        shareLineAppearanceCssName: callingAccess?.back_end_calling_access || "",
        call_repetition: profile?.call_repetition_daily ? "individual" : "company",
        call_repetition_weekly: parseOptionalInteger(profile?.call_repetition_weekly),
        display: null,
        call_repetition_daily: parseOptionalInteger(profile?.call_repetition_daily),
        allow_dncr:
            callingAccess?.allow_dncr === "1"
                ? DNCRCallingAccess.ALLOW_DNCR
                : DNCRCallingAccess.DISALLOW_DNCR,
        allow_fac_info:
            callingAccess?.allow_fac_info === "1"
                ? FacInfoCallingAccess.ALLOW_FAC_INFO
                : FacInfoCallingAccess.DISALLOW_FAC_INFO,
        verify: false,
        mobile_user: profile?.mobile_user === "Yes" ? MobileUser.Yes : MobileUser.No,
        device_type: null,
        client_transactionid: generateCustomId("tms-", 20),
        previous_mobile_user: null,
        previous_device_type: null,
    };
}

function getTabVisualState(
    isActive: boolean,
    isEnabled: boolean,
): TabVisualState {
    if (!isEnabled) {
        return {
            backgroundColor: "#f8fafc",
            border: "1px solid #8a8a8a",
            color: "#a0aec0",
            cursor: "not-allowed",
        };
    }

    if (isActive) {
        return {
            backgroundColor: "#ffffff",
            border: "1px solid #eaf0f6",
            color: "#141414",
            cursor: "pointer",
        };
    }

    return {
        backgroundColor: "#f8fafc",
        border: "1px solid #8a8a8a",
        color: "#64748b",
        cursor: "pointer",
    };
}

const CreateUserProfile = ({
    initialUserData,
    isOpen = true,
    onClose,
    title = "Add User Profile",
}: CreateUserProfileProps = {}) => {
    const {
        errors,
        touched,
        setFieldTouched,
        setAllTouched,
        clearFieldError,
    } = useFormErrors();
    
    
    const router = useRouter();
    const { id: userId } = router.query;
    const numericUserId = Number(userId);

    const isDraft = Boolean(userId?.includes("-draftId"));
    const isUpdateMode = !Number.isNaN(numericUserId) && !isDraft;
    
    // TMS auth has been removed - user is set to null
    // Using 'as' to prevent TypeScript from narrowing to never
    const user = null as User | null;
    const userData = initialUserData || null;
    const userCompanyId = userData?.data?.company_id;
    const { data: getUserProfilingDraft } = useGetUserProfilingDraft(
        isDraft ? Number(String(userId).split("-draftId")[0]) : 0,
    );

    const [verifyLdapUserFormData, setVerifyLdapUserFormData] =
        useState<VerifyLdapUserParams>({
            ...buildEmptySharedFields(),
            client_transactionid: generateCustomId("tms-", 20),
            update_user: isUpdateMode,
            verify: false,
        });

    const [verifyUserInfoFormData, setVerifyUserInfoFormData] =
        useState<VerifyUserInfoParams>({
            ...buildEmptySharedFields(),
            iccid_number: null,
            company: null,
            update_user: false,
            shareLineAppearanceCssName: "",
            call_repetition: null,
            call_repetition_weekly: null,
            display: null,
            call_repetition_daily: null,
            allow_dncr: DNCRCallingAccess.DISALLOW_DNCR,
            allow_fac_info: FacInfoCallingAccess.DISALLOW_FAC_INFO,
            verify: false,
            mobile_user: MobileUser.No,
            device_type: null,
            client_transactionid: generateCustomId("tms-", 20),
            previous_mobile_user: null,
            previous_device_type: null,
        });

    const companyId = useMemo<number | null>(() => {
        if (userId) {
            return parseOptionalInteger(userCompanyId);
        }
        if (isDraft) {      
            return parseOptionalInteger(getUserProfilingDraft?.company_id);
        }
        if (user && user.user_type !== UserType.ADMIN) {
            return user.company_id ?? null;
        }

        return null;
    }, [
        user,
        userCompanyId,
        getUserProfilingDraft?.company_id,
        userId,
        isDraft,
    ]);

    const { data: companyData } = useGetCompany(
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
    
    const { data: companyList } = useCompanyList(companyListParams);

    const { isLoading: isAddUserInfoPending } = useAddUserInfo();
    const { verifyUserInfo, isLoading: isVerifyUserInfoPending } =
        useVerifyUserInfo();

    const { verifyLdapUser, isLoading: isVerifyLdapUserPending } =
        useVerifyLdapUser();
    const { isLoading: isUpdateUserInfoPending } =
        useUpdateUserInfo();

    const { isLoading: isAddLinePending } = useAddLine();
    const { isLoading: isAddPhonePending } = useAddPhone();
    const { isLoading: isUpdateAppUserPending } =
        useUpdateAppUser();
    const { isLoading: isUpdateUserPending } = useUpdateUser();
    const {
        isLoading: isAddRemoteDestinationProfilePending,
    } = useAddRemoteDestinationProfile();
    const { isLoading: isAddRemoteDestinationPending } =
        useAddRemoteDestination();
    const { isLoading: isUpdateDNCRPending } = useUpdateDNCR();
    const { isLoading: isCreateLdapUserPending } =
        useAddOnlyLdapUser();
    const { addLdapUser } = useAddLdapUser();

    const { isLoading: isUpdateLdapUserPending } =
        useUpdateOnlyLdapUser();

    const { isLoading: isRemoveLinePending } = useRemoveLine();
    const { isLoading: isRemovePhonePending } = useRemovePhone();
    const { isLoading: isUpdateLinePending } = useUpdateLine();
    const { isLoading: isUpdatePhonePending } = useUpdatePhone();

    const callingAccessCardRef = useRef<HTMLDivElement>(null);

    const [activeTab, setActiveTab] = useState<UserProfileSidebarTab>("ldap");
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(
        new Set(),
    );

    const [originalFieldValues, setOriginalFieldValues] = useState<
        Record<string, any>
    >({});

    const [hasPreviousStepChanges, setHasPreviousStepChanges] = useState(false);

    const { data: availableExtensions } = useGetAvailableExtensions(
        companyData?.data?.id || null,
    );
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
            countries.map((country: any) => ({
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

    const invalidateStepsFrom = (stepNumber: number) => {
        setHasPreviousStepChanges(true);
        setCompletedSteps((prev) => {
            const nextSteps = new Set(prev);
            for (let currentStep = stepNumber; currentStep <= 3; currentStep += 1) {
                nextSteps.delete(currentStep);
            }
            return nextSteps;
        });
    };

    const markFieldTouchedAndClearError = (field: FormFieldKey) => {
        setFieldTouched(field as string, true);
        clearFieldError(field as string);
    };
    
    const handleFieldChangeWithStepCheck = (
        stepNumber: number,
        field: FormFieldKey,
        value: any,
    ) => {
        markFieldTouchedAndClearError(field);
        if (completedSteps.has(stepNumber)) {
            const originalValue = originalFieldValues[getOriginalFieldValueKey(stepNumber, field)];
            if (originalValue !== value) {
                invalidateStepsFrom(stepNumber);
            }
        }
    };

    const handleCreateFormChange = (
        field: FormFieldKey,
        value: any,
    ) => {
        const data = buildLdapFormData(
            verifyLdapUserFormData,
            field,
            value,
            companyOptions as CompanyOption[],
        );

        handleFieldChangeWithStepCheck(1, field, value);
        setVerifyLdapUserFormData(data);
    };

    const handleVerifyUserInfoChange = (
        field: FormFieldKey,
        value: any,
    ) => {
        const data = buildUserInfoFormData(
            verifyUserInfoFormData,
            field,
            value,
            companyData?.data?.profile,
        );

        handleFieldChangeWithStepCheck(2, field, value);
        setVerifyUserInfoFormData(data);
    };

    const [currentUserCompanyId, setCurrentUserCompanyId] = useState<number | null>(null);
    const [currentUserCompanyName, setCurrentUserCompanyName] = useState<string>("");

    useEffect(() => {
        if (!userData || !isUpdateMode) {
            return;
        }

        const parsedCompanyId = parseOptionalInteger(userData.company_id);
        const companyName = getUserCompanyName(userData);

        setVerifyLdapUserFormData(buildInitialLdapUserFormData(userData));
        setVerifyUserInfoFormData(buildInitialUserInfoFormData(userData));

        if (parsedCompanyId) {
            setCurrentUserCompanyId(parsedCompanyId);
        }
        if (companyName) {
            setCurrentUserCompanyName(companyName);
        }
    }, [userData, isUpdateMode]);

    const formattedUserId = getFormattedUserId(
        verifyLdapUserFormData.userId,
        companyData?.data?.profile?.user_id_prefix,
    );
    const resolvedCompanyId = (currentUserCompanyId || companyId || verifyLdapUserFormData.company_id || 0) as number;
    const resolvedCompanyName = currentUserCompanyName || companyData?.data?.name || verifyLdapUserFormData.companyName;

    const scrollToNextStep = (step: number) => {
        setTimeout(() => {
            if (step === 2 && callingAccessCardRef.current) {
                callingAccessCardRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        }, 500);
    };

    const updateModeStepThreeLoading =
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
        isAddUserInfoPending;

    const createModeStepThreeLoading =
        isAddUserInfoPending ||
        isUpdateUserInfoPending ||
        isAddRemoteDestinationProfilePending ||
        isAddRemoteDestinationPending ||
        isUpdateDNCRPending ||
        isAddLinePending ||
        isAddPhonePending ||
        isUpdateUserPending ||
        isUpdateAppUserPending ||
        isUpdateLdapUserPending ||
        isRemoveLinePending ||
        isRemovePhonePending ||
        isCreateLdapUserPending;

    const getCurrentLoadingState = (step: number) => {
        switch (step) {
            case 1:
                return isVerifyLdapUserPending;
            case 2:
                return isVerifyUserInfoPending;
            case 3:
                return isUpdateMode
                    ? updateModeStepThreeLoading
                    : createModeStepThreeLoading;
            default:
                return false;
        }
    };

    const canProceedFirstStep = isUpdateMode
        ? Boolean(
              completedSteps.has(1) ||
                  (
                      verifyLdapUserFormData.firstName &&
                      verifyLdapUserFormData.lastName &&
                      verifyLdapUserFormData.email &&
                      verifyLdapUserFormData.department
                  ),
          )
        : Boolean(
              completedSteps.has(1) ||
                  (
                      verifyLdapUserFormData.department &&
                      verifyLdapUserFormData.userId &&
                      verifyLdapUserFormData.extensionNumber &&
                      verifyLdapUserFormData.firstName &&
                      verifyLdapUserFormData.lastName &&
                      verifyLdapUserFormData.email
                  ),
          );

    const canProceedSecondStep = Boolean(
        completedSteps.has(2) ||
            (companyData?.data?.id &&
                verifyUserInfoFormData.shareLineAppearanceCssName),
    );

    const canProceedThirdStep = isUpdateMode
        ? Boolean(
              completedSteps.has(3) ||
                  (
                      companyData?.data?.id &&
                      verifyLdapUserFormData.firstName &&
                      verifyLdapUserFormData.lastName &&
                      verifyLdapUserFormData.department &&
                      verifyUserInfoFormData.shareLineAppearanceCssName
                  ),
          )
        : Boolean(
              completedSteps.has(3) ||
                  (
                      companyData?.data?.id &&
                      verifyLdapUserFormData.extensionNumber &&
                      verifyLdapUserFormData.userId &&
                      verifyLdapUserFormData.firstName &&
                      verifyLdapUserFormData.department &&
                      verifyUserInfoFormData.shareLineAppearanceCssName &&
                      verifyLdapUserFormData.lastName
                  ),
          );

    const canProceedToNext = (step: number) => {
        switch (step) {
            case 1:
                return canProceedFirstStep;
            case 2:
                return canProceedSecondStep;
            case 3:
                return canProceedThirdStep;
            default:
                return false;
        }
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

    const submitVerifyLdapUserForm = async () => {
        try {
            setAllTouched();

            if (!canProceedToNext(1)) {
                return;
            }

            const formData: VerifyLdapUserParams = {
                ...verifyLdapUserFormData,
                company_id: resolvedCompanyId,
                companyName: resolvedCompanyName,
                displayName: `${verifyLdapUserFormData.firstName} ${verifyLdapUserFormData.lastName}`.trim(),
                userId: formattedUserId,
                verify: true,
            };

            const responseVerifyLdapUser = await verifyLdapUser(formData);
            
            if (toastApiError(responseVerifyLdapUser as ResponseWithMessage, "LDAP user verification failed")) return;

            setCompletedSteps(prev => new Set(prev).add(1));

            setOriginalFieldValues(prev => ({ ...prev, ...buildTabSnapshot(1, verifyLdapUserFormData) }));

            setActiveTab("calling-access");
            scrollToNextStep(2);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Please try again.";
            toast.error(`Failed to verify LDAP user. ${message}`);
        }
    };

    const submitVerifyUserInfoForm = async () => {
        try {
            setAllTouched();

            if (!canProceedToNext(2)) {
                return;
            }

            const formData = {
                ...verifyLdapUserFormData,
                ...verifyUserInfoFormData,
                userId: formattedUserId,
                company_id: resolvedCompanyId,
                companyName: resolvedCompanyName,
                verify: true,
            };

            const responseVerifyUserInfo = await verifyUserInfo(formData);
            
            if (toastApiError(responseVerifyUserInfo as ResponseWithMessage, "User info verification failed")) return;

            const responseAddLdapUser = await addLdapUser(formData);
            
            if (toastApiError(responseAddLdapUser as ResponseWithMessage, "Failed to add LDAP user")) return;

            setCompletedSteps(prev => new Set(prev).add(2));

            setOriginalFieldValues(prev => ({ ...prev, ...buildTabSnapshot(2, verifyUserInfoFormData) }));

            setActiveTab("calling-access");
            scrollToNextStep(3);

            toast.success("User info verification and LDAP user creation completed successfully!");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Please try again.";
            toast.error(`Failed to verify user info or create LDAP user. ${message}`);
        }
    };

    const handleClose = () => {
        onClose?.();
    };

    const isCallingAccessTabEnabled = completedSteps.has(1) || canProceedToNext(1);

    const openLdapTab = () => {
        setActiveTab("ldap");
    };

    const openCallingAccessTab = () => {
        if (!isCallingAccessTabEnabled) {
            return;
        }
        setActiveTab("calling-access");
    };

    const ldapTabStyle = getTabVisualState(activeTab === "ldap", true);
    const callingAccessTabStyle = getTabVisualState(
        activeTab === "calling-access",
        isCallingAccessTabEnabled,
    );

    if (!isOpen) {
        return null;
    }

    return (
        <React.Fragment>
            <style>
                {`
                    .add-user-sidebar {
                        font-family: "Lexend Deca", Helvetica, Arial, sans-serif;
                        color: #141414;
                    }
                    .add-user-sidebar * {
                        font-family: "Lexend Deca", Helvetica, Arial, sans-serif;
                    }
                    .add-user-sidebar :is(.form-control, .form-select, input, select, textarea) {
                        font-size: 14px;
                        color: #141414;
                    }
                    .add-user-sidebar :is(.form-control, .form-select, input, select) {
                        min-height: 40px;
                    }
                    .add-user-sidebar .btn {
                        border-radius: 4px;
                        font-size: 14px;
                        font-weight: 500;
                    }
                    .add-user-sidebar .btn-primary,
                    .add-user-sidebar button[type="submit"],
                    .add-user-sidebar .btn-success {
                        background-color: #0091ae;
                        border-color: #0091ae;
                        color: #ffffff;
                        border-radius: 4px;
                        min-height: 40px;
                        box-shadow: none;
                    }
                    .add-user-sidebar .btn-primary:hover,
                    .add-user-sidebar button[type="submit"]:hover,
                    .add-user-sidebar .btn-success:hover {
                        background-color: #007a94;
                        border-color: #007a94;
                    }
                    .add-user-sidebar .btn-outline-secondary,
                    .add-user-sidebar .btn-secondary,
                    .add-user-sidebar .btn-light {
                        background-color: transparent;
                        color: #141414;
                        border: 1px solid #8a8a8a;
                        border-radius: 4px;
                        min-height: 40px;
                        box-shadow: none;
                    }
                    .add-user-sidebar .container-fluid {
                        padding-left: 0;
                        padding-right: 0;
                    }
                    .add-user-sidebar .card {
                        border: none;
                        box-shadow: none;
                        background: transparent;
                        margin-bottom: 0;
                    }
                    .add-user-sidebar .card-header {
                        display: none;
                    }
                    .add-user-sidebar .card-body {
                        padding: 0;
                    }
                    .add-user-sidebar .row {
                        --bs-gutter-x: 0;
                        --bs-gutter-y: 0;
                        margin-right: 0;
                        margin-left: 0;
                    }
                    .add-user-sidebar .row > * {
                        width: 100%;
                        max-width: 100%;
                        flex: 0 0 100%;
                        padding-right: 0;
                        padding-left: 0;
                    }
                    .add-user-sidebar .col,
                    .add-user-sidebar [class^="col-"],
                    .add-user-sidebar [class*=" col-"] {
                        width: 100%;
                        max-width: 100%;
                        flex: 0 0 100%;
                    }
                    .add-user-sidebar .form-group,
                    .add-user-sidebar .mb-3,
                    .add-user-sidebar .mb-4,
                    .add-user-sidebar .mb-2 {
                        margin-bottom: 20px !important;
                    }
                    .add-user-sidebar label,
                    .add-user-sidebar .form-label {
                        display: block;
                        font-size: 14px;
                        font-weight: 600;
                        color: #141414;
                        margin-bottom: 8px;
                    }
                    .add-user-sidebar .form-text,
                    .add-user-sidebar small,
                    .add-user-sidebar .text-muted {
                        font-size: 12px;
                    }
                    .add-user-sidebar .nav,
                    .add-user-sidebar .nav-tabs {
                        border-bottom: 1px solid #eaf0f6;
                        display: flex;
                        gap: 8px;
                        flex-wrap: nowrap;
                    }
                    .add-user-sidebar .nav-tabs .nav-link,
                    .add-user-sidebar .add-user-tab {
                        border: 1px solid #8a8a8a;
                        border-bottom: none;
                        border-radius: 8px 8px 0 0;
                        background: #f8fafc;
                        color: #64748b;
                        font-size: 14px;
                        font-weight: 600;
                        padding: 10px 14px;
                    }
                    .add-user-sidebar .nav-tabs .nav-link.active,
                    .add-user-sidebar .add-user-tab-active {
                        background: #ffffff;
                        color: #141414;
                        border-color: #eaf0f6;
                    }
                `}
            </style>

            <div
                className="contact-sidebar-overlay"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000,
                    background: "transparent",
                }}
                aria-hidden="true"
            />

            <div
                className="contact-sidebar-container add-user-sidebar"
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    width: "600px",
                    height: "100vh",
                    backgroundColor: "#ffffff",
                    boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
                    zIndex: 999999,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    className="contact-sidebar-header"
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid #eaf0f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <h2
                        className="contact-sidebar-title"
                        style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            color: "#141414",
                            margin: 0,
                        }}
                    >
                        {title}
                    </h2>
                    <button
                        type="button"
                        className="contact-sidebar-close-btn"
                        onClick={handleClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            padding: "4px",
                            cursor: "pointer",
                            color: "#718096",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div
                    className="contact-sidebar-content"
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "24px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            borderBottom: "1px solid #eaf0f6",
                            marginBottom: "24px",
                            paddingBottom: "0",
                        }}
                    >
                        <button
                            type="button"
                            onClick={openLdapTab}
                            style={{
                                padding: "10px 14px",
                                borderRadius: "8px 8px 0 0",
                                border: ldapTabStyle.border,
                                borderBottom: "none",
                                backgroundColor: ldapTabStyle.backgroundColor,
                                color: ldapTabStyle.color,
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: ldapTabStyle.cursor,
                            }}
                        >
                            Create LDAP User
                        </button>
                        <button
                            type="button"
                            onClick={openCallingAccessTab}
                            disabled={!isCallingAccessTabEnabled}
                            style={{
                                padding: "10px 14px",
                                borderRadius: "8px 8px 0 0",
                                border: callingAccessTabStyle.border,
                                borderBottom: "none",
                                backgroundColor: callingAccessTabStyle.backgroundColor,
                                color: callingAccessTabStyle.color,
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: callingAccessTabStyle.cursor,
                            }}
                        >
                            Add Calling Access
                        </button>
                    </div>

                    <div className="container-fluid mb-5">
                        {activeTab === "ldap" ? (
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
                        ) : (
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
                        )}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default CreateUserProfile;
