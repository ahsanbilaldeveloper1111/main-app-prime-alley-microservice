import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { GetUserById } from '@utils/tms/tmsUserManagement';
import { GetUserCompany } from '@utils/tms/tmsUserManagement';
import { useFormErrors } from '@hooks/tms/useFormErrors';
import { useUpdateUserInfo, useVerifyUserInfo } from '@hooks/tms/UnifiedOp';
import {
    DNCRCallingAccess,
    FacInfoCallingAccess,
    MobileUser,
    DeviceType,
} from '@models/tms/Company';
import { VerifyUserInfoParams } from '@models/tms/UnfidiedOp';
import { generateCustomId } from '@utils/Helper';
import UpdateCallingAccessForm from "@page-modules/tms/profiling/user/create/components/UpdateCallingAccessForm";
import type { CompanyIccid } from '@models/tms/Company';
import { toast } from 'react-toastify';

interface UserCallingAccessProps {
    userId: string;
    session: any;
}

const callRepetitionOptions = [
    { value: 'individual', label: 'Individual' },
    { value: 'company', label: 'Company' },
];

const deviceTypeOptions = [
    { value: 'TCT', label: 'IPHONE' },
    { value: 'BOT', label: 'ANDROID' },
];

interface TmsUserProfile {
    allow_dncr?: string;
    allow_fac_info?: string;
    shareLineAppearanceCssName?: string;
    mobile_user?: string;
    device_type?: string | null;
    call_repetition?: string | null;
    call_repetition_daily?: string | null;
    call_repetition_weekly?: string | null;
    iccid_number?: string | number | null;
}

const getInitialFormFromProfile = (
    profile: TmsUserProfile | undefined,
    current: VerifyUserInfoParams
): Partial<VerifyUserInfoParams> => {
    if (!profile) return {};
    return {
        allow_dncr:
            profile.allow_dncr === '1' ? DNCRCallingAccess.ALLOW_DNCR : DNCRCallingAccess.DISALLOW_DNCR,
        allow_fac_info:
            profile.allow_fac_info === '1'
                ? FacInfoCallingAccess.ALLOW_FAC_INFO
                : FacInfoCallingAccess.DISALLOW_FAC_INFO,
        shareLineAppearanceCssName: profile.shareLineAppearanceCssName ?? current.shareLineAppearanceCssName,
        mobile_user:
            profile.mobile_user === 'Yes' ? MobileUser.Yes : MobileUser.No,
        device_type:
            profile.device_type === 'TCT'
                ? DeviceType.TCT
                : profile.device_type === 'BOT'
                  ? DeviceType.BOT
                  : null,
        call_repetition:
            profile.call_repetition === 'individual' || profile.call_repetition === 'company'
                ? profile.call_repetition
                : null,
        call_repetition_daily: profile.call_repetition_daily
            ? Number.parseInt(String(profile.call_repetition_daily), 10)
            : null,
        call_repetition_weekly: profile.call_repetition_weekly
            ? Number.parseInt(String(profile.call_repetition_weekly), 10)
            : null,
        // Store as-is so Select matches (option.value is string); cast to satisfy VerifyUserInfoParams
        iccid_number:
            profile.iccid_number != null && profile.iccid_number !== ''
                ? (typeof profile.iccid_number === 'number'
                      ? profile.iccid_number
                      : profile.iccid_number)
                : null,
    } as Partial<VerifyUserInfoParams>;
};

const UserCallingAccess: React.FC<UserCallingAccessProps> = ({ userId, session }) => {
    const username = session?.user?.username ?? session?.user?.name ?? '';
    const { errors, touched } = useFormErrors();
    const { updateUserInfo, isLoading: isUpdating } = useUpdateUserInfo();
    const { verifyUserInfo, isLoading: isVerifying } = useVerifyUserInfo();

    const [companyData, setCompanyData] = useState<{ success?: boolean; data?: any } | null>(null);
    const [userData, setUserData] = useState<{ success?: boolean; data?: any } | null>(null);
    const [verifyUserInfoFormData, setVerifyUserInfoFormData] = useState<VerifyUserInfoParams>({
        extensionNumber: null,
        company_id: 0,
        displayName: '',
        iccid_number: null,
        company: null,
        update_user: false,
        shareLineAppearanceCssName: '',
        call_repetition: null,
        call_repetition_weekly: null,
        password: '',
        display: null,
        call_repetition_daily: null,
        allow_dncr: DNCRCallingAccess.DISALLOW_DNCR,
        allow_fac_info: FacInfoCallingAccess.DISALLOW_FAC_INFO,
        verify: false,
        mobile_user: MobileUser.No,
        device_type: null,
        client_transactionid: generateCustomId('tms-', 20),
        userId: null,
        country: '',
        department: '',
        jobTitle: '',
        companyName: '',
        firstName: '',
        lastName: '',
        email: '',
        previous_mobile_user: null,
        previous_device_type: null,
    });

    useEffect(() => {
        const fetchUserCompany = async () => {
            try {
                const response = await GetUserCompany();
                if (response?.success && response?.data) {
                    setCompanyData(response);
                }
            } catch (error) {
                console.error('GetUserCompany error:', error);
            }
        };
        fetchUserCompany();
    }, []);

    const handleVerifyUserInfoChange = (field: keyof VerifyUserInfoParams, value: any) => {
        setVerifyUserInfoFormData((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'call_repetition' && value === 'company') {
                const profile = companyData?.data?.profile;
                if (profile) {
                    next.call_repetition_daily = profile.call_repetition_daily
                        ? Number.parseInt(String(profile.call_repetition_daily), 10)
                        : null;
                    next.call_repetition_weekly = profile.call_repetition_weekly
                        ? Number.parseInt(String(profile.call_repetition_weekly), 10)
                        : null;
                } else {
                    next.call_repetition_daily = null;
                    next.call_repetition_weekly = null;
                }
            }
            return next;
        });
    };

    const callAccessOptions = useMemo(() => {
        const iccids = companyData?.data?.iccids || [];
        const iccidData = iccids.find((iccid: CompanyIccid) =>
            iccid.iccid_numbers?.includes(
                String(verifyUserInfoFormData.iccid_number ?? '')
            )
        );
        const iccid = iccidData?.id ?? null;

        return (companyData?.data?.calling_access || [])
            .filter((access: any) => {
                const allowDncr = verifyUserInfoFormData.allow_dncr === DNCRCallingAccess.ALLOW_DNCR;
                const allowFacInfo = verifyUserInfoFormData.allow_fac_info === FacInfoCallingAccess.ALLOW_FAC_INFO;
                const accessFacInfo = access.allow_fac_info == FacInfoCallingAccess.ALLOW_FAC_INFO;
                const accessDncr = access.allow_dncr == DNCRCallingAccess.ALLOW_DNCR;
                const accessFacInfoDis = access.allow_fac_info == FacInfoCallingAccess.DISALLOW_FAC_INFO;
                const accessDncrDis = access.allow_dncr == DNCRCallingAccess.DISALLOW_DNCR;
                if (allowFacInfo) {
                    return accessFacInfo && iccid === (access.company_iccid_id ?? null);
                }
                if (allowDncr || verifyUserInfoFormData.call_repetition) {
                    return accessDncr && iccid === (access.company_iccid_id ?? null);
                }
                return accessFacInfoDis && accessDncrDis && iccid === (access.company_iccid_id ?? null);
            })
            .map((access: any) => ({
                value: access.back_end_calling_access,
                label: access.front_end_calling_access,
            }));
    }, [
        companyData?.data?.calling_access,
        companyData?.data?.iccids,
        verifyUserInfoFormData.allow_dncr,
        verifyUserInfoFormData.allow_fac_info,
        verifyUserInfoFormData.call_repetition,
        verifyUserInfoFormData.iccid_number,
    ]);

    const iccidOptions = useMemo(() => {
        const iccids = companyData?.data?.iccids || [];
        const allIccidNumbers: string[] = [];
        iccids.forEach((iccidItem: CompanyIccid) => {
            if (iccidItem.iccid_numbers && Array.isArray(iccidItem.iccid_numbers)) {
                allIccidNumbers.push(...iccidItem.iccid_numbers);
            }
        });
        return allIccidNumbers.map((iccid: string) => ({
            value: iccid,
            label: iccid,
        }));
    }, [companyData?.data?.iccids]);

    const refetchUser = useCallback(async () => {
        const un = session?.user?.username;
        if (!un) return;
        try {
            const data = await GetUserById(un);
            if (data?.success && data?.data) {
                setUserData(data);
                setVerifyUserInfoFormData((prev) => ({
                    ...prev,
                    ...getInitialFormFromProfile(data.data?.profile, prev),
                }));
            }
        } catch (error) {
            console.error('GetUserById error:', error);
        }
    }, [session?.user?.username]);

    useEffect(() => {
        refetchUser();
    }, [refetchUser]);

    const handleUpdateCallingAccess = useCallback(async () => {
        const d = userData?.data;
        const tmsUserName = d?.name ?? d?.username;
        const tmsUserId = d?.id != null ? String(d.id) : null;
        const phoneNo = d?.phone_no;
        const extensionNumberForVerify =
            phoneNo != null && phoneNo !== '' ? Number(phoneNo) : null;
        const extensionNumberForUpdate =
            phoneNo != null && phoneNo !== '' ? String(phoneNo) : null;

        if (!tmsUserName) {
            toast.error('User data not loaded. Please refresh the page.');
            return;
        }
        const companyId = companyData?.data?.id ?? 0;
        const companyName = companyData?.data?.name ?? '';

        const verifyPayload: VerifyUserInfoParams = {
            ...verifyUserInfoFormData,
            userId: tmsUserName,
            firstName: verifyUserInfoFormData.firstName || (d as any)?.first_name || '',
            lastName: verifyUserInfoFormData.lastName || (d as any)?.last_name || '',
            email: verifyUserInfoFormData.email || (d as any)?.email || (d as any)?.notify_email || '',
            country: verifyUserInfoFormData.country || (d as any)?.country || '',
            companyName: verifyUserInfoFormData.companyName || (d as any)?.company || companyName,
            displayName: verifyUserInfoFormData.displayName || (d as any)?.name || '',
            extensionNumber: extensionNumberForVerify,
            department: verifyUserInfoFormData.department || (d as any)?.department || '',
            jobTitle: verifyUserInfoFormData.jobTitle || (d as any)?.job_title || '',
            client_transactionid: verifyUserInfoFormData.client_transactionid,
            password: '',
            company_id: verifyUserInfoFormData.company_id || companyId,
            update_user: true,
            company: companyData?.data ?? null,
            verify: true,
        };

        let verifyValueFromResponse: boolean = true;
        try {
            const verifyResponse = await verifyUserInfo(verifyPayload);
            if (verifyResponse?.success === false) {
                const errorMessage =
                    (verifyResponse as any)?.message || 'Verification failed. Please check your data.';
                toast.error(errorMessage);
                return;
            }
            verifyValueFromResponse =
                (verifyResponse as any)?.data?.verify !== undefined
                    ? Boolean((verifyResponse as any).data.verify)
                    : true;
        } catch (err: any) {
            toast.error(err?.message || 'Verification failed. Please check your data.');
            return;
        }

        if (!tmsUserId) {
            toast.error('User id not found. Please refresh the page.');
            return;
        }

        const payload = {
            user_id: tmsUserId,
            extensionNumber: extensionNumberForUpdate,
            company_id: verifyUserInfoFormData.company_id || companyId,
            companyName: verifyUserInfoFormData.companyName || '',
            displayName: verifyUserInfoFormData.displayName || (d as any)?.name || '',
            iccid_number:
                verifyUserInfoFormData.iccid_number != null
                    ? (typeof verifyUserInfoFormData.iccid_number === 'string'
                          ? Number(verifyUserInfoFormData.iccid_number)
                          : verifyUserInfoFormData.iccid_number)
                    : null,
            company: null,
            update_user: true,
            shareLineAppearanceCssName: verifyUserInfoFormData.shareLineAppearanceCssName || '',
            call_repetition: verifyUserInfoFormData.call_repetition ?? null,
            call_repetition_weekly: verifyUserInfoFormData.call_repetition_weekly ?? null,
            call_repetition_daily: verifyUserInfoFormData.call_repetition_daily ?? null,
            password: '',
            display: null,
            allow_dncr: verifyUserInfoFormData.allow_dncr,
            allow_fac_info: verifyUserInfoFormData.allow_fac_info,
            verify: verifyValueFromResponse,
            mobile_user: verifyUserInfoFormData.mobile_user,
            device_type: verifyUserInfoFormData.device_type,
            client_transactionid: verifyUserInfoFormData.client_transactionid,
            userId: tmsUserName,
            country: verifyUserInfoFormData.country || (d as any)?.country || '',
            department: verifyUserInfoFormData.department || (d as any)?.department || '',
            jobTitle: verifyUserInfoFormData.jobTitle || (d as any)?.job_title || '',
            firstName: verifyUserInfoFormData.firstName || (d as any)?.first_name || '',
            lastName: verifyUserInfoFormData.lastName || (d as any)?.last_name || '',
            email: verifyUserInfoFormData.email || (d as any)?.email || '',
            previous_mobile_user: verifyUserInfoFormData.previous_mobile_user ?? verifyUserInfoFormData.mobile_user,
            previous_device_type: verifyUserInfoFormData.previous_device_type ?? verifyUserInfoFormData.device_type,
            company_iccid_id: null,
            // self_app: true,
        };
        updateUserInfo(payload).catch(() => {});
        toast.success('Your information will be updated in a while.');
    }, [
        userData?.data,
        companyData?.data,
        companyData?.data?.id,
        companyData?.data?.name,
        verifyUserInfoFormData,
        updateUserInfo,
        verifyUserInfo,
        refetchUser,
    ]);

    const completedSteps = useMemo(() => new Set([1, 2]), []);

    if (!companyData?.data) {
        return (
            <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading calling access...</p>
            </div>
        );
    }

    return (
        <UpdateCallingAccessForm
            verifyUserInfoFormData={verifyUserInfoFormData}
            handleVerifyUserInfoChange={handleVerifyUserInfoChange}
            errors={errors}
            showCallingAccessHeader={false}
            submitButtonText="Save Changes"
            touched={touched}
            companyData={companyData}
            company_id={companyData?.data?.id ?? null}
            companyName={companyData?.data?.name ?? ''}
            callAccessOptions={callAccessOptions}
            iccidOptions={iccidOptions}
            callRepetitionOptions={callRepetitionOptions}
            deviceTypeOptions={deviceTypeOptions}
            completedSteps={completedSteps}
            hasPreviousStepChanges={false}
            getCurrentLoadingState={(step) => step === 2 && isVerifying}
            canProceedToNext={() => true}
            onSubmit={handleUpdateCallingAccess}
        />
    );
};

export default UserCallingAccess;
