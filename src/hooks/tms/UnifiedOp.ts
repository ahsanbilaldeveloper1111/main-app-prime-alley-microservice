
import { useState, useEffect, useMemo } from 'react';
import { AdLdapDetail, SearchParams, UnifiedOpUpdateParams, AddLineParams, AddPhoneParams, UpdateAppUserParams, UpdateUserParams, AddUpdateUserInfoParams, VerifyUserInfoParams, CreateUpdateLdapUserParams, GetUserProfilingDraftParams, UserProfilingDraft, GetUserProfilingDraftListParams, UpdatePhoneParams, UpdateLineParams, AddRemoteDestinationParams, AddRemoteDestinationProfileParams, RemoveLdapUserParams, GetUserProfilingErrorLogRequest, UpdateUserProfilingErrorLogRequest, SyncPBXParams, UpdateDNCRParams, RemoveLineParams, RemovePhoneParams, SyncImagicleParams, RemoveUserParams, UpdateProfilingErrorLogsRequest } from '../../Models/tms/UnfidiedOp';
import UnifiedOpService from '../../services/tms/UnifiedOpService';
import { ApiResponse, PaginatedResponse } from '../../utils/tms/apiResponse';
import { toast } from 'react-toastify';
import { VerifyLdapUserParams } from '../../Models/tms/UnfidiedOp';

export const useUnifiedOp = (params: SearchParams) => {
    const [data, setData] = useState<PaginatedResponse<AdLdapDetail[]> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Memoize the params to prevent unnecessary re-renders
    const memoizedParams = useMemo(() => ({
        ...params
    }), [params]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await UnifiedOpService.index(memoizedParams);
            setData(response);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [memoizedParams]);

    return { data, isLoading, error, refetch: fetchData };
};
export const useUpdateUnifiedOp = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateUnifiedOp = async (data: UnifiedOpUpdateParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.update(data);
            console.log("Unified Op updated successfully");
            toast.success("Unified Op updated successfully");
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

    return { updateUnifiedOp, isLoading, error };
};
export const useAddFacInfo = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const addFacInfo = async (data: any) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.addFacInfo(data);
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

    return { addFacInfo, isLoading, error };
};
export const useVerifyUserInfo = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const verifyUserInfo = async (data: VerifyUserInfoParams) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await UnifiedOpService.verifyUserInfo(data);
            // Call the success callback to refetch data
            if (onSuccess) {
                onSuccess();
            }
            return response;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return { verifyUserInfo, isLoading, error };
};

export const useAddUserInfo = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const addUserInfo = async (data: AddUpdateUserInfoParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.addUserInfo(data);
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

    return { addUserInfo, isLoading, error };
};
export const useCreateLdapUser = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const createLdapUser = async (data: CreateUpdateLdapUserParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.createLdapUser(data);
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

    return { createLdapUser, isLoading, error };
};
export const useGetUserProfilingDraft = (id: number) => {
    const [data, setData] = useState<ApiResponse<UserProfilingDraft> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchData = async (id: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await UnifiedOpService.getUserProfilingDraft(id);
            setData(response);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData(id);
        }
    }, [id]);

    return { data: data?.data, isLoading, error, refetch: fetchData };
};
export const useGetUserProfilingDraftList = (params: GetUserProfilingDraftListParams) => {
    const [data, setData] = useState<PaginatedResponse<UserProfilingDraft[]> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Memoize the params to prevent unnecessary re-renders
    const memoizedParams = useMemo(() => ({
        ...params
    }), [params]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await UnifiedOpService.getUserProfilingDraftList(memoizedParams);
            setData(response);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [memoizedParams]);

    return { data, isLoading, error, refetch: fetchData };
};
export const useDeleteDraft = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const deleteDraft = async (id: string | number) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.deleteDraft(id);
            console.log("Draft deleted successfully");
            toast.success("Draft deleted successfully");
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

    return { deleteDraft, isLoading, error };
};  
export const useUpdateUserInfo = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateUserInfo = async (data: Omit<AddUpdateUserInfoParams, 'password' | 'userId' | 'extensionNumber'>) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.updateUserInfo(data);
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

    return { updateUserInfo, isLoading, error };
};
export const useUpdateLdapUser = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateLdapUser = async (data: Omit<CreateUpdateLdapUserParams, 'companyName'|'description' | 'userId' | 'extensionNumber' | 'userId'>) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.updateOnlyLdapUser(data);
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

    return { updateLdapUser, isLoading, error };
};
export const useUpdatePhone = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updatePhone = async (data: UpdatePhoneParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.updatePhone(data);
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

    return { updatePhone, isLoading, error };
};
export const useUpdateLine = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateLine = async (data: UpdateLineParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.updateLine(data);
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

    return { updateLine, isLoading, error };
};
export const useUpdateDNCR = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateDNCR = async (data: UpdateDNCRParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.updateDNCR(data);
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

    return { updateDNCR, isLoading, error };
};
export const useRunLdapSync = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const runLdapSync = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.runLdapSync();
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

    return { runLdapSync, isLoading, error };
};
export const useSyncPBX = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const syncPBX = async (data: SyncPBXParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.syncPBX(data);
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

    return { syncPBX, isLoading, error };
};
export const useSyncImagicle = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const syncImagicle = async (data: SyncImagicleParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.syncImagicle(data);
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

    return { syncImagicle, isLoading, error };
};
export const useAddLine = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const addLine = async (data: AddLineParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.addLine(data);
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

    return { addLine, isLoading, error };
};
export const useRemoveLdapUser = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const removeLdapUser = async (data: RemoveLdapUserParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.removeLdapUser(data);
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

    return { removeLdapUser, isLoading, error };
};
export const useAddPhone = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const addPhone = async (data: AddPhoneParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.addPhone(data);
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

    return { addPhone, isLoading, error };
};
export const useAddRemoteDestination = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const addRemoteDestination = async (data: AddRemoteDestinationParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.addRemoteDestination(data);
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

    return { addRemoteDestination, isLoading, error };
};
export const useAddRemoteDestinationProfile = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const addRemoteDestinationProfile = async (data: AddRemoteDestinationProfileParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.addRemoteDestinationProfile(data);
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

    return { addRemoteDestinationProfile, isLoading, error };
};

export const useAddUser = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const addUser = async (data: any) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.addUser(data);
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

    return { addUser, isLoading, error };
};

export const useUpdateUser = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateUser = async (data: UpdateUserParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.updateUser(data);
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

    return { updateUser, isLoading, error };
};

export const useRemoveUser = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const removeUser = async (data: RemoveUserParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.removeUser(data);
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

    return { removeUser, isLoading, error };
};

export const useRemovePhone = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const removePhone = async (data: RemovePhoneParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.removePhone(data);
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

    return { removePhone, isLoading, error };
};

export const useRemoveLine = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const removeLine = async (data: RemoveLineParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.removeLine(data);
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

    return { removeLine, isLoading, error };
};

export const useUpdateAppUser = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateAppUser = async (data: UpdateAppUserParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.updateAppUser(data);
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

    return { updateAppUser, isLoading, error };
};

export const useAddOnlyLdapUser = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const addOnlyLdapUser = async (data: CreateUpdateLdapUserParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.addOnlyLdapUser(data);
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

    return { addOnlyLdapUser, isLoading, error };
};

export const useUpdateOnlyLdapUser = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateOnlyLdapUser = async (data: CreateUpdateLdapUserParams) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.updateOnlyLdapUser(data);
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

    return { updateOnlyLdapUser, isLoading, error };
};



export const useListUserProfilingErrorLog = (params: Partial<GetUserProfilingErrorLogRequest>) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Memoize the params to prevent unnecessary re-renders
    const memoizedParams = useMemo(() => ({
        ...params
    }), [params]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await UnifiedOpService.getUserProfilingErrorLog(memoizedParams);
            setData(response);
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [memoizedParams]);

    return { data, isLoading, error, refetch: fetchData };
};
export const useUpdateUserProfilingErrorLog = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateUserProfilingErrorLog = async (data: Partial<UpdateUserProfilingErrorLogRequest>) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.updateUserProfilingErrorLog(data);
            toast.success("User profiling error log updated successfully");
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

    return { updateUserProfilingErrorLog, isLoading, error };
};
export const useVerifyLdapUser = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const verifyLdapUser = async (data: VerifyLdapUserParams) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await UnifiedOpService.verifyLdapUser(data);
            // Call the success callback to refetch data
            if (onSuccess) {
                onSuccess();
            }
            return response;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return { verifyLdapUser, isLoading, error };
};

export const useAddLdapUser = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const addLdapUser = async (data: VerifyUserInfoParams) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await UnifiedOpService.addLdapUser(data);
            // Call the success callback to refetch data
            if (onSuccess) {
                onSuccess();
            }
            return response;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return { addLdapUser, isLoading, error };
};

export const useUpdateProfilingErrorLogs = (onSuccess?: () => void) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const updateProfilingErrorLogs = async (data: Partial<UpdateProfilingErrorLogsRequest>) => {
        try {
            setIsLoading(true);
            setError(null);
            await UnifiedOpService.updateProfilingErrorLogs(data);
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

    return { updateProfilingErrorLogs, isLoading, error };
};