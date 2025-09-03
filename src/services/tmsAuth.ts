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

export async function tmsLogin(email: string, password: string): Promise<TmsLoginResponse> {
  const formData = new URLSearchParams();
  formData.append('suser', email);
  formData.append('password', password);

  const res = await axiosInstance.post(`tms/login`, formData, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  console.log('res', res);

  return res.data as TmsLoginResponse;
}
