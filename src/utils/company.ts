import axiosInstance from '@utils/axios';
import { reportApiErrorFromCatch } from './sentryLogger';

const PREFIX = '/users/companies';

/**
 * Fetches the current user's company logo image (no company_id = current user's company).
 */
export async function getCurrentUserCompanyImage(): Promise<Blob | null> {
  try {
    console.log('getCurrentUserCompanyImage');
    const { data } = await axiosInstance.get<Blob>(`${PREFIX}/image`, {
      responseType: 'blob',
    });
    console.log('data', data);
    return data;
  } catch (error) {
    reportApiErrorFromCatch(error, 'company');
    return null;
  }
}
