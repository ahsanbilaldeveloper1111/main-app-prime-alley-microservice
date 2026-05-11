import React, { useEffect, useMemo, useState, useRef } from "react";
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
  useGetAvailableCompanyIccids,
  useGetAvailableExtensions,
  useGetCompany,
} from "@hooks/tms/company";
import { Company, User } from "@models/tms";
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
import Head from "next/head";

// Import partial components
import ProgressHeader from "./components/ProgressHeader";
import CreateLdapUserForm from "./components/CreateLdapUserForm";
import CallingAccessForm from "./components/CallingAccessForm";

interface CreateUserProfileProps {
  initialUserData?: any;
}

function readNestedCompanyIdFromRouteUser(initialUser: unknown): unknown {
  if (initialUser === null || typeof initialUser !== "object") {
    return undefined;
  }
  const inner = Reflect.get(initialUser, "data");
  if (inner === null || typeof inner !== "object") {
    return undefined;
  }
  return Reflect.get(inner, "company_id");
}

function invalidateCompletedSteps(
  setter: React.Dispatch<React.SetStateAction<Set<number>>>,
  stepsToRemove: readonly number[],
): void {
  setter((prev) => {
    const next = new Set(prev);
    for (const step of stepsToRemove) {
      next.delete(step);
    }
    return next;
  });
}

type InvalidateStaleFieldArgs = Readonly<{
  completedSteps: Set<number>;
  anchorStep: number;
  tabPrefix: string;
  field: string | number | symbol;
  value: unknown;
  originalFieldValues: Record<string, unknown>;
  completionStepsToRemove: readonly number[];
  markPreviousStepDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setCompletedSteps: React.Dispatch<React.SetStateAction<Set<number>>>;
}>;

function invalidateWizardIfStaleFieldEdit(args: InvalidateStaleFieldArgs): void {
  if (!args.completedSteps.has(args.anchorStep)) {
    return;
  }
  const prev =
    args.originalFieldValues[`${args.tabPrefix}.${String(args.field)}`];
  if (prev === args.value) {
    return;
  }
  args.markPreviousStepDirty(true);
  invalidateCompletedSteps(args.setCompletedSteps, args.completionStepsToRemove);
}

function syncCallRepetitionFieldsAfterChange(
  data: VerifyUserInfoParams,
  value: unknown,
  companyProfile: unknown,
): void {
  if (value !== "company") {
    data.call_repetition_daily = null;
    data.call_repetition_weekly = null;
    return;
  }
  const profile =
    companyProfile !== null && typeof companyProfile === "object"
      ? companyProfile
      : null;
  if (!profile) {
    data.call_repetition_daily = null;
    data.call_repetition_weekly = null;
    return;
  }
  const dailyRaw = Reflect.get(profile, "call_repetition_daily");
  const weeklyRaw = Reflect.get(profile, "call_repetition_weekly");
  data.call_repetition_daily =
    dailyRaw !== undefined &&
    dailyRaw !== null &&
    String(dailyRaw).length > 0
      ? Number.parseInt(String(dailyRaw), 10)
      : null;
  data.call_repetition_weekly =
    weeklyRaw !== undefined &&
    weeklyRaw !== null &&
    String(weeklyRaw).length > 0
      ? Number.parseInt(String(weeklyRaw), 10)
      : null;
}

function unifiedOpFailureMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }
  const direct = Reflect.get(payload, "message");
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct;
  }
  const response = Reflect.get(payload, "response");
  if (response !== null && typeof response === "object") {
    const nested = Reflect.get(response, "message");
    if (typeof nested === "string" && nested.trim().length > 0) {
      return nested;
    }
  }
  return fallback;
}

/** Builds LDAP + calling-access form state when opening an existing TMS user route. */
function mapRouteUserIntoFormDrafts(routeUserSnapshot: Record<string, any>): Readonly<{
  ldapDraft: VerifyLdapUserParams;
  verifyDraft: VerifyUserInfoParams;
  resolvedNumericCompanyId: number;
  resolvedCompanyDisplayName: string;
}> {
  const rawExtension = routeUserSnapshot.phone_no;
  const phoneNo =
    rawExtension !== undefined &&
    rawExtension !== null &&
    String(rawExtension).length > 0
      ? Number.parseInt(String(rawExtension), 10)
      : null;
  const numericCompanyId = routeUserSnapshot.company_id
    ? Number.parseInt(String(routeUserSnapshot.company_id), 10)
    : 0;

  const parent = routeUserSnapshot.parent_company;
  const profile = parent?.profile;
  const callingAccess =
    Array.isArray(parent?.calling_access) && parent.calling_access.length > 0
      ? parent.calling_access[0]
      : undefined;

  return {
    resolvedNumericCompanyId: numericCompanyId,
    resolvedCompanyDisplayName:
      parent?.name || routeUserSnapshot.company || "",
    ldapDraft: {
      companyName: parent?.name || routeUserSnapshot.company || "",
      extensionNumber: phoneNo,
      firstName: routeUserSnapshot.first_name || "",
      email: routeUserSnapshot.email || "",
      lastName: routeUserSnapshot.last_name || "",
      displayName: routeUserSnapshot.name || "",
      userId: routeUserSnapshot.username || null,
      country: routeUserSnapshot.country || "",
      company_id: numericCompanyId,
      department: routeUserSnapshot.department || "",
      jobTitle: routeUserSnapshot.job_title || "",
      password: "",
      client_transactionid: generateCustomId("tms-", 20),
      update_user: true,
      verify: false,
    },
    verifyDraft: {
      extensionNumber: phoneNo,
      company_id: numericCompanyId,
      displayName: routeUserSnapshot.name || "",
      iccid_number: null,
      company: null,
      update_user: true,
      shareLineAppearanceCssName: callingAccess?.back_end_calling_access || "",
      call_repetition: profile?.call_repetition_daily ? "individual" : "company",
      call_repetition_weekly: profile?.call_repetition_weekly
        ? Number.parseInt(String(profile.call_repetition_weekly), 10)
        : null,
      password: "",
      display: null,
      call_repetition_daily: profile?.call_repetition_daily
        ? Number.parseInt(String(profile.call_repetition_daily), 10)
        : null,
      allow_dncr:
        callingAccess?.allow_dncr === "1"
          ? DNCRCallingAccess.ALLOW_DNCR
          : DNCRCallingAccess.DISALLOW_DNCR,
      allow_fac_info:
        callingAccess?.allow_fac_info === "1"
          ? FacInfoCallingAccess.ALLOW_FAC_INFO
          : FacInfoCallingAccess.DISALLOW_FAC_INFO,
      verify: false,
      mobile_user:
        profile?.mobile_user === "Yes" ? MobileUser.Yes : MobileUser.No,
      device_type: null,
      client_transactionid: generateCustomId("tms-", 20),
      userId: routeUserSnapshot.username || null,
      country: routeUserSnapshot.country || "",
      department: routeUserSnapshot.department || "",
      jobTitle: routeUserSnapshot.job_title || "",
      companyName: parent?.name || routeUserSnapshot.company || "",
      firstName: routeUserSnapshot.first_name || "",
      lastName: routeUserSnapshot.last_name || "",
      email: routeUserSnapshot.email || "",
      previous_mobile_user: null,
      previous_device_type: null,
    },
  };
}

const CreateUserProfile = ({
  initialUserData,
}: CreateUserProfileProps = {}) => {
  const { errors, touched, setFieldTouched, setAllTouched, clearFieldError } =
    useFormErrors();

  const router = useRouter();
  const { id: userId } = router.query;

  const isDraft = Boolean(userId?.includes("-draftId"));
  const isUpdateMode = !Number.isNaN(Number(userId)) && !isDraft;

  // TMS auth has been removed — no signed-in TMS user context in this screen.
  const user: User | null = null;

  const userData = initialUserData || null;

  const { data: getUserProfilingDraft } = useGetUserProfilingDraft(
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

  const [currentUserCompanyId, setCurrentUserCompanyId] = useState<
    number | null
  >(null);
  const [currentUserCompanyName, setCurrentUserCompanyName] =
    useState<string>("");

  const routeEmbeddedCompanyKey = readNestedCompanyIdFromRouteUser(userData);
  const companyId = useMemo(() => {
    if (userId) {
      return Number(routeEmbeddedCompanyKey);
    }
    if (isDraft) {
      return Number(getUserProfilingDraft?.company_id);
    }

    return null;
  }, [
    routeEmbeddedCompanyKey,
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
  const companyListParams = useMemo(
    () => ({
      parent_id: null,
      load_calling_access: true,
      load_profile: true,
      load_company_iccid: true,
      search: "",
      ids: [],
    }),
    [],
  );

  const { data: companyList } = useCompanyList(companyListParams);

  const { isLoading: isAddUserInfoPending } = useAddUserInfo();
  const { verifyUserInfo, isLoading: isVerifyUserInfoPending } =
    useVerifyUserInfo();

  const { verifyLdapUser, isLoading: isVerifyLdapUserPending } =
    useVerifyLdapUser();
  const { isLoading: isUpdateUserInfoPending } = useUpdateUserInfo();

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
  const { isLoading: isCreateLdapUserPending } = useAddOnlyLdapUser();

  const { addLdapUser } = useAddLdapUser();

  const { isLoading: isUpdateLdapUserPending } = useUpdateOnlyLdapUser();

  // Update scenario hooks (loading flags only — mutations deferred to later steps)
  const { isLoading: isRemoveLinePending } = useRemoveLine();
  const { isLoading: isRemovePhonePending } = useRemovePhone();
  const { isLoading: isUpdateLinePending } = useUpdateLine();
  const { isLoading: isUpdatePhonePending } = useUpdatePhone();

  useGetAvailableCompanyIccids(
    companyData?.data?.profile?.allow_gsm ? companyData?.data?.id : null,
    userId ? Number(userId) : 0,
  );

  // Refs for scrolling
  const callingAccessCardRef = useRef<HTMLDivElement>(null);
  const confirmCardRef = useRef<HTMLDivElement>(null);

  // Progress tracking
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Track original field values for each step to detect changes
  const [originalFieldValues, setOriginalFieldValues] = useState<
    Record<string, any>
  >({});

  // Track if any previous step fields have changed
  const [hasPreviousStepChanges, setHasPreviousStepChanges] = useState(false);

  const { data: availableExtensions } = useGetAvailableExtensions(
    companyData?.data?.id ?? null,
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
      const selectedCompany = companyOptions.find(
        (option: any) => option.value === +value,
      );
      data.companyName = selectedCompany?.label || "";
    }

    if (field === "firstName" || field === "lastName") {
      data.displayName = `${data.firstName} ${data.lastName}`.trim();
    }

    invalidateWizardIfStaleFieldEdit({
      completedSteps,
      anchorStep: 1,
      tabPrefix: "tab-1",
      field,
      value,
      originalFieldValues,
      completionStepsToRemove: [1, 2, 3],
      markPreviousStepDirty: setHasPreviousStepChanges,
      setCompletedSteps,
    });

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

    if (field == "call_repetition") {
      syncCallRepetitionFieldsAfterChange(
        data,
        value,
        companyData?.data?.profile,
      );
    }

    if (field == "mobile_user") {
      data.device_type = null;
    }

    invalidateWizardIfStaleFieldEdit({
      completedSteps,
      anchorStep: 2,
      tabPrefix: "tab-2",
      field,
      value,
      originalFieldValues,
      completionStepsToRemove: [2, 3],
      markPreviousStepDirty: setHasPreviousStepChanges,
      setCompletedSteps,
    });

    setFieldTouched(field as string, true);
    clearFieldError(field as string);

    setVerifyUserInfoFormData(data);
  };

  // Populate form data from userData when available (for edit mode)
  useEffect(() => {
    if (!userData || !isUpdateMode) {
      return;
    }
    const snap = mapRouteUserIntoFormDrafts(
      userData as Record<string, any>,
    );
    setVerifyLdapUserFormData(snap.ldapDraft);
    setVerifyUserInfoFormData(snap.verifyDraft);
    if (snap.resolvedNumericCompanyId) {
      setCurrentUserCompanyId(snap.resolvedNumericCompanyId);
    }
    if (snap.resolvedCompanyDisplayName) {
      setCurrentUserCompanyName(snap.resolvedCompanyDisplayName);
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
              access.allow_fac_info == FacInfoCallingAccess.ALLOW_FAC_INFO &&
              iccid == access.company_iccid_id
            );
          } else if (
            verifyUserInfoFormData.allow_dncr == DNCRCallingAccess.ALLOW_DNCR ||
            verifyUserInfoFormData.call_repetition
          ) {
            return (
              access.allow_dncr == DNCRCallingAccess.ALLOW_DNCR &&
              iccid == access.company_iccid_id
            );
          } else {
            return (
              access.allow_fac_info == FacInfoCallingAccess.DISALLOW_FAC_INFO &&
              access.allow_dncr == DNCRCallingAccess.DISALLOW_DNCR &&
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
      const formattedUserId =
        userEnteredValue && userPrefix
          ? `${userEnteredValue}_${userPrefix}`
          : userEnteredValue || null;

      const formData: VerifyLdapUserParams = {
        ...verifyLdapUserFormData,
        company_id: (currentUserCompanyId ||
          verifyLdapUserFormData.company_id ||
          companyId ||
          0) as number,
        // Fix companyName to use actual company name instead of company_id
        companyName:
          currentUserCompanyName ||
          companyData?.data?.name ||
          verifyLdapUserFormData.companyName,
        // Generate displayName from firstName and lastName
        displayName:
          `${verifyLdapUserFormData.firstName} ${verifyLdapUserFormData.lastName}`.trim(),
        // Format userId as: userEnteredValue_user_id_prefix
        userId: formattedUserId,
        verify: true,
      };

      // Call the verify LDAP user API
      const responseVerifyLdapUser = await verifyLdapUser(formData);

      // Check if the response indicates failure
      if (responseVerifyLdapUser?.success === false) {
        toast.error(
          unifiedOpFailureMessage(
            responseVerifyLdapUser,
            "LDAP user verification failed",
          ),
        );
        return;
      }

      setCompletedSteps((prev) => new Set(prev).add(1));

      setOriginalFieldValues((prev) => ({
        ...prev,
        ...Object.keys(verifyLdapUserFormData).reduce(
          (acc, key) => {
            acc[`tab-1.${key}`] =
              verifyLdapUserFormData[key as keyof VerifyLdapUserParams];
            return acc;
          },
          {} as Record<string, any>,
        ),
      }));

      setCurrentStep(2);
      scrollToNextStep(2);
    } catch (error) {
      console.error("Error verifying LDAP user:", error);
      toast.error("Failed to verify LDAP user. Please try again.");
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
      const formattedUserId =
        userEnteredValue && userPrefix
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
        shareLineAppearanceCssName:
          verifyUserInfoFormData.shareLineAppearanceCssName,
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
        company_id: (currentUserCompanyId ||
          companyId ||
          verifyLdapUserFormData.company_id ||
          0) as number,
        // Ensure companyName is properly set from currentUserCompanyName
        companyName:
          currentUserCompanyName ||
          companyData?.data?.name ||
          verifyLdapUserFormData.companyName,
        // Ensure verify flag is set
        verify: true,
      };

      // Call the verify user info API
      const responseVerifyUserInfo = await verifyUserInfo(formData);

      // Check if the response indicates failure
      if (responseVerifyUserInfo?.success === false) {
        toast.error(
          unifiedOpFailureMessage(
            responseVerifyUserInfo,
            "User info verification failed",
          ),
        );
        return;
      }

      const responseAddLdapUser = await addLdapUser(formData);

      if (responseAddLdapUser?.success === false) {
        toast.error(
          unifiedOpFailureMessage(
            responseAddLdapUser,
            "Failed to add LDAP user",
          ),
        );
        return;
      }
      setCompletedSteps((prev) => new Set(prev).add(2));

      // Store original field values for change detection
      setOriginalFieldValues((prev) => ({
        ...prev,
        ...Object.keys(verifyUserInfoFormData).reduce(
          (acc, key) => {
            acc[`tab-2.${key}`] =
              verifyUserInfoFormData[key as keyof VerifyUserInfoParams];
            return acc;
          },
          {} as Record<string, any>,
        ),
      }));

      // Move to next step
      setCurrentStep(3);
      scrollToNextStep(3);

      toast.success(
        "User info verification and LDAP user creation completed successfully!",
      );
    } catch (error) {
      console.error("Error in user verification or LDAP user creation:", error);
      toast.error(
        "Failed to verify user info or create LDAP user. Please try again.",
      );
    }
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
