import { toast } from "react-toastify";
import axiosInstance from "@utils/axios";

export interface TmsLoginResponse {
  code: number;
  message?: string;
  data?: {
    access_token: string;
    expires_in: number; // seconds from now
    user?: {
      id?: string;
      name?: string;
      email?: string;
      [key: string]: any;
    };
  };
}

export async function tmsLogin(email: string, password: string, enable_2fa: boolean): Promise<TmsLoginResponse> {
 

  const res = await axiosInstance.post(`tms/login`, {
    samaccountname: email,
    password: password,
    enable_2fa: enable_2fa,
  });
  console.log('res', res);

  return res.data as TmsLoginResponse;
}
