import { toast } from "react-toastify";
import axiosInstance from "@utils/axios";

export interface TmsLoginResponse {
  success: boolean;
  message?: string;
  action?: string;
  data?: {
    user?: {
      id?: number;
      name?: string;
      username?: string;
      email?: string;
      company?: string;
      company_id?: string;
      phone_no?: string;
      notify_email?: string;
      status?: string;
      first_name?: string;
      last_name?: string;
      country?: string;
      department?: string;
      user_type?: string;
      job_title?: string;
      guid?: string;
      domain?: string;
      google2fa_secret?: string;
      last_login_at?: string;
      user_access_info?: {
        permissions?: Array<{
          module: string;
          action: string;
        }>;
      };
      ranks?: Array<{
        id: number;
        name: string;
        description?: string;
        company_id?: string;
        created_at: string;
        updated_at: string;
        pivot: {
          user_id: string;
          rank_id: string;
        };
      }>;
      settings?: {
        id: number;
        user_id: string;
        enable_email_notification: boolean;
        enable_sms_notification: boolean;
        enable_google_authentication: boolean;
        created_at: string;
        updated_at: string;
      };
      [key: string]: any;
    };
    message?: string;
    requires_email_verification?: boolean;
    requires_google_auth_verification?: boolean;
    access_token?: string;
    expires_in?: number;
  };
  // Legacy fields for backward compatibility
  requires_email_verification?: boolean;
  requires_google_auth_verification?: boolean;
  enable_google_authentication?: boolean;
  access_token?: string;
  expires_in?: number; // seconds from now
  user?: {
    id?: number;
    name?: string;
    username?: string;
    email?: string;
    company?: string;
    company_id?: string;
    phone_no?: string;
    notify_email?: string;
    status?: string;
    first_name?: string;
    last_name?: string;
    country?: string;
    department?: string;
    user_type?: string;
    job_title?: string;
    guid?: string;
    domain?: string;
    google2fa_secret?: string;
    last_login_at?: string;
    user_access_info?: {
      permissions?: Array<{
        module: string;
        action: string;
      }>;
    };
    ranks?: Array<{
      id: number;
      name: string;
      description?: string;
      company_id?: string;
      created_at: string;
      updated_at: string;
      pivot: {
        user_id: string;
        rank_id: string;
      };
    }>;
    [key: string]: any;
  };
}

export interface TmsVerificationResponse {
  success: boolean;
  message?: string;
  action?: string;
  data?: {
    access_token?: string;
    expires_in?: number | string; // Can be either number or string
    user?: {
      id?: number;
      name?: string;
      username?: string;
      email?: string;
      company?: string;
      company_id?: string;
      phone_no?: string;
      notify_email?: string;
      status?: string;
      first_name?: string;
      last_name?: string;
      country?: string;
      department?: string;
      user_type?: string;
      job_title?: string;
      guid?: string;
      domain?: string;
      google2fa_secret?: string;
      last_login_at?: string;
      user_access_info?: {
        permissions?: Array<{
          module: string;
          action: string;
        }>;
      };
      ranks?: Array<{
        id: number;
        name: string;
        description?: string;
        company_id?: string;
        created_at: string;
        updated_at: string;
        pivot: {
          user_id: string;
          rank_id: string;
        };
      }>;
      profile?: {
        id: number;
        user_id: string;
        device_pool: string;
        device_pool_mobile: string;
        allow_fac_info: string;
        shareLineAppearanceCssName: string;
        mobile_user: string;
        recording_profile: string;
        app_user: string;
        partition: string;
        device_type: string;
        recording_profile_mobile: string;
        allow_dncr: string;
        call_repetition: string;
        call_repetition_daily: string;
        call_repetition_weekly: string;
        created_at: string;
        updated_at: string;
        user_phone_name?: string;
        company_name?: string;
        iccid_number?: string;
        syncing_ldap_steps: any[];
        status: string;
      };
      parent_company?: {
        id: number;
        name: string;
        parent_id?: string;
        created_at: string;
        updated_at: string;
        organization_unit: string;
        profile: {
          id: number;
          partition: string;
          extention_ranges: Array<{
            start: number;
            end: number;
          }>;
          recording_profile: string;
          mobile_user: string;
          sim_ports: any[];
          additional_info: string;
          company_id: string;
          created_at: string;
          updated_at: string;
          app_user: string;
          device_pool: string;
          fac_info?: string;
          recording_profile_mobile: string;
          app_user_mobile?: string;
          device_pool_mobile: string;
          fact_code?: string;
          max_users: string;
          user_id_prefix: string;
          directory_name: string;
          allow_gsm: boolean;
        };
        calling_access: Array<{
          id: number;
          company_id: string;
          front_end_calling_access: string;
          back_end_calling_access?: string;
          created_at: string;
          updated_at: string;
          allow_dncr: string;
          allow_fac_info: string;
          company_iccid_id?: string;
        }>;
        iccids: Array<{
          id: number;
          name: string;
          iccid_numbers: string[];
          company_id: string;
          created_at: string;
          updated_at: string;
        }>;
      };
      settings?: {
        id: number;
        user_id: string;
        enable_email_notification: boolean;
        enable_sms_notification: boolean;
        enable_google_authentication: boolean;
        created_at: string;
        updated_at: string;
      };
      [key: string]: any;
    };
    message?: string;
    requires_google_auth_verification?: boolean;
  };
  // Legacy fields for backward compatibility
  code?: number;
  response?: {
    message?: string;
    errors?: {
      [key: string]: string[];
    };
  };
  access_token?: string;
  expires_in?: number | string; // Can be either number or string
  requires_google_auth_verification?: boolean;
  user?: {
    id?: number;
    name?: string;
    email?: string;
    [key: string]: any;
  };
}

export async function tmsLogin(email: string, password: string, enable_2fa: boolean): Promise<TmsLoginResponse> {
 

  const res = await axiosInstance.post(`tms/verification`, {
    samaccountname: email,
    password: password,
    enable_2fa: enable_2fa,
  });
  console.log('res', res);

  return res.data as TmsLoginResponse;
}

export async function sendEmailVerificationCode(email: string): Promise<{ code: number; message?: string }> {
  const res = await axiosInstance.post(`tms/send-email-verification`, {
    email: email,
  });
  return res.data;
}

export async function verifyEmailCode(user_id: string, code: string, isGoogleCode: boolean = false): Promise<TmsVerificationResponse> {
  console.log('API verifyEmailCode - user_id:', user_id, 'code:', code, 'code length:', code.length, 'isGoogleCode:', isGoogleCode);
  
  const payload = {
    user_id: user_id,
    code: code,
    isGoogleCode: isGoogleCode,
  };
  
  console.log('API verifyEmailCode - payload:', payload);
  
  const res = await axiosInstance.post(`tms/verify-email-code`, payload);
  
  console.log('API verifyEmailCode - response:', res.data);
  
  return res.data as TmsVerificationResponse;
}

export interface ResendEmailCodeResponse {
  success: boolean;
  message?: string;
  action?: string;
  data?: {
    message?: string;
  };
  response?: {
    message?: string;
    errors?: {
      [key: string]: string[];
    };
  };
}

export async function resendEmailCode(user_id: string): Promise<ResendEmailCodeResponse> {
  const res = await axiosInstance.post(`tms/resend-email-code`, {
    user_id: user_id,
  });
  return res.data;
}

export async function verify2FACode(email: string, code: string): Promise<TmsVerificationResponse> {
  const res = await axiosInstance.post(`tms/verify-2fa-code`, {
    email: email,
    code: code,
  });
  return res.data as TmsVerificationResponse;
}
