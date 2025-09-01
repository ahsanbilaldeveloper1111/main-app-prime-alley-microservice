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
  formData.append('email', email);
  formData.append('password', password);

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}testTmsLogin`, {
    method: 'get',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const json = (await res.json()) as TmsLoginResponse;
  return json;
}
