import { useState, useEffect, useMemo } from 'react';
import { Company, IndexCompanyParams, CallingAccess } from '../../Models/tms/Company';
import { ListCompanies, createUpdateCompanyCallingAccess as createUpdateCompanyCallingAccessAPI, createUpdateCompanyProfile, GetCompany, GetAvailableCompanyIccids, GetAvailableExtensions } from '@utils/tms/tmsProfiling';
import { toast } from 'react-toastify';
import { createUpdateCompany, generateFacCode } from '@utils/accounting';

export const useCompanyList = (params: IndexCompanyParams) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Memoize the params to prevent unnecessary re-renders
    const memoizedParams = useMemo(() => ({
        parent_id: params.parent_id,
        ids: params.ids || [],
        search: params.search || "",
        load_calling_access: params.load_calling_access || false,
        load_profile: params.load_profile || false,
        load_company_iccid: params.load_company_iccid || false,
    }), [
        params.parent_id,
        params.ids,
        params.search,
        params.load_calling_access,
        params.load_profile,
        params.load_company_iccid
    ]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await ListCompanies(memoizedParams.parent_id, memoizedParams.ids);
            setData(response?.dataList || []);
            
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if we have valid params
        if (memoizedParams.parent_id !== undefined || memoizedParams.ids.length > 0) {
            fetchData();
        }
    }, [memoizedParams.parent_id, memoizedParams.ids]);

    return { data, isLoading, error, refetch: fetchData };
};

export const useCreateUpdateCompanyCallingAccess = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateCreateUpdateCompanyCallingAccess = async (data: CallingAccess) => {
        try {
            setIsLoading(true);
            setError(null);
            await createUpdateCompanyCallingAccessAPI(data);
            // Call the success callback to refetch data
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    return { updateCreateUpdateCompanyCallingAccess, isLoading, error };
};

export const useCreateUpdateCompanyProfile = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateCompanyProfile = async (data: any) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await createUpdateCompanyProfile(data);
            console.log("response", response);
            if(response.success){
               toast.success("Company profile updated successfully");
            }
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    return { 
        updateCompanyProfile, 
        isUpdateCompanyProfilePending: isLoading, 
        isUpdateCompanyProfileError: !!error,
        updateCompanyProfileError: error 
    };
};

export const useDeleteCompanyCallingAccess = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const deleteCompanyCallingAccess = async (id: number) => {
        try {
            setIsLoading(true);
            setError(null);
            // TODO: Implement API call
            // Call the success callback to refetch data
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    return { deleteCompanyCallingAccess, isLoading, error };
};


export const useGetCompany = (id: number) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchData = async (id: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await GetCompany(id);
            setData(response);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(id);
    }, [id]);

    return { data, isLoading, error, refetch: fetchData };
};

export const useGetAvailableCompanyIccids = (companyId: number, userId: number) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchData = async (companyId: number, userId: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await GetAvailableCompanyIccids(companyId, userId);
            setData(response);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(companyId, userId);
    }, [companyId, userId]);

    return { data, isLoading, error, refetch: fetchData };
};

export const useGetAvailableExtensions = (companyId: number) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchData = async (companyId: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await GetAvailableExtensions(companyId);
            setData(response);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(companyId);
    }, [companyId]);

    return { data, isLoading, error, refetch: fetchData };
};

export const useCreateUpdateFacCode = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const createUpdateFacCode = async (data: any) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await generateFacCode(data);
            if(response.success){
                toast.success("Fac code generated successfully");
            }
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return { createUpdateFacCode, isLoading, error, refetch: createUpdateFacCode };
};