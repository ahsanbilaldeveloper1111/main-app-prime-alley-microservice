import axiosInstance from "@utils/axios";
import {
    PaginatedResponse,
    ApiResponse,
    handleApiError,
} from "@utils/tms/apiResponse";

import {
    
    SearchParams,
} from "@models/tms/CiscoPBXResponse";

import {  AdLdapDetail, GetUserProfilingDraftParams, UnifiedOpUpdateParams, VerifyUserInfoParams, UserProfilingDraft, GetUserProfilingDraftListParams, UpdateUserParams, UpdateAppUserParams, AddPhoneParams, RemovePhoneParams, RemoveUserParams, RemoveLineParams, AddLineParams, AddRemoteDestinationParams, UpdateLineParams, UpdateDNCRParams, SyncImagicleParams, SyncPBXParams, UpdatePhoneParams, AddUserParams, UpdateOnlyLdapUserParams, AddOnlyLdapUserParams, RemoveLdapUserParams, GetUserProfilingErrorLogRequest, UpdateUserProfilingErrorLogRequest, UserProfilingErrorLog, AddRemoteDestinationProfileParams, TestUpdateOnlyLdapUserParams, TestUpdateDNCRParams, UpdateProfilingErrorLogsRequest,VerifyLdapUserParams } from "@models/tms/UnfidiedOp";


class UnifiedOpService {
    private static instance: UnifiedOpService;

    private constructor() {}

    public static getInstance(): UnifiedOpService {
        if (!UnifiedOpService.instance) {
            UnifiedOpService.instance = new UnifiedOpService();
        }
        return UnifiedOpService.instance;
    }

    async index(
        params: SearchParams,
    ): Promise<PaginatedResponse<AdLdapDetail[]>> {
        const response = await axiosInstance.get('tms/unified-op', { params });
        try {
            return response.data as PaginatedResponse<AdLdapDetail[]>;
        } catch (error) {
            throw handleApiError(error);
        }
    }
    async update({UserID, ...data}: UnifiedOpUpdateParams): Promise<ApiResponse<AdLdapDetail>> {
        const response = await axiosInstance.put(`tms/unified-op/${UserID}`, data);
        try {
            return response.data as ApiResponse<AdLdapDetail>;
        } catch (error) {
            throw handleApiError(error);
        }
    }
    async addFacInfo(data: any): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/add-fac-info', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            console.log(error, "error.addFacInfo")
            throw handleApiError(error);
        });
    }
    async verifyUserInfo(data: VerifyUserInfoParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/verify-calling-access', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async addUserInfo(data: any): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/add-user-info', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);

        });
    }
    async createLdapUser(data: any): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/create-ldap-user', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async getUserProfilingDraft(id: number): Promise<ApiResponse<UserProfilingDraft>> {
        return await axiosInstance.get(`tms/unified-op/user-profiling-draft/${id}`).then((response) => {
            return response.data as ApiResponse<UserProfilingDraft>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async getUserProfilingDraftList(data: GetUserProfilingDraftListParams): Promise<PaginatedResponse<UserProfilingDraft[]>> {
        return await axiosInstance.get('tms/unified-op/user-profiling-draft-list', { params: data }).then((response) => {
            return response.data as PaginatedResponse<UserProfilingDraft[]>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async deleteDraft(id: string|number): Promise<ApiResponse<any>> {
        return await axiosInstance.delete(`tms/unified-op/delete-draft/${id}`).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async updateUserInfo(data: any): Promise<ApiResponse<any>> {
        return await axiosInstance.post(`tms/unified-op/update-user-info/${data.user_id}`, data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }

    async addOnlyLdapUser(data: AddOnlyLdapUserParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/add-only-ldap-user', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async updateOnlyLdapUser(data: UpdateOnlyLdapUserParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/update-only-ldap-user', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async addRemoteDestination(data: Partial<AddRemoteDestinationParams>): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/add-remote-destination', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async addRemoteDestinationProfile(data: Partial<AddRemoteDestinationProfileParams>): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/add-remote-destination-profile', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }

    async addUser(data: AddUserParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/add-user', data).then((response) => {
            return response.data as ApiResponse<any>;
            }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async updateUser(data: UpdateUserParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/update-user', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async updatePhone(data: Partial<UpdatePhoneParams>): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/update-phone', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async updateLine(data: Partial<UpdateLineParams>): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/update-line', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async updateAppUser(data: UpdateAppUserParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/update-app-user', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async removeUser(data: RemoveUserParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/remove-user', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }   
    async removePhone(data: RemovePhoneParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/remove-phone', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
            }
    async removeLine(data: RemoveLineParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/remove-line', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async addPhone(data: Partial<AddPhoneParams>): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/add-phone', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async updateDNCR(data: Partial<UpdateDNCRParams>): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/update-dncr', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async syncPBX(data: Partial<SyncPBXParams>): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/sync-pbx', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async runLdapSync(): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/run-ldap-sync').then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    
    async syncImagicle(data: SyncImagicleParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/sync-imagicle', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
        
        }
    async addLine(data: Partial<AddLineParams>): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/add-line', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async removeLdapUser(data: RemoveLdapUserParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/remove-ldap-user', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async getUserProfilingErrorLog(params: Partial<GetUserProfilingErrorLogRequest>): Promise<PaginatedResponse<UserProfilingErrorLog[]>> {
        return await axiosInstance.get('tms/unified-op/user-profiling-error-log', { params }).then((response) => {
            return response.data as PaginatedResponse<UserProfilingErrorLog[]>;
        }).catch((error) => {
            console.log(error, "error.companyUserProfilingErrorLog")
            throw handleApiError(error);
        });
    }
    async updateUserProfilingErrorLog(params: Partial<UpdateUserProfilingErrorLogRequest>): Promise<ApiResponse<UserProfilingErrorLog>> {
        return await axiosInstance.put(`tms/unified-op/update-user-profiling-error-log/${params.id||0}`, params).then((response) => {
            return response.data as ApiResponse<UserProfilingErrorLog>;
        }).catch((error) => {
            console.log(error, "error.companyUserProfilingErrorLog")
            throw handleApiError(error);
        });
    }
    async verifyLdapUser(data: VerifyLdapUserParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/verify-ldap-user', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
    async addLdapUser(data: VerifyUserInfoParams): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/add-ldap-user', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }

    async updateProfilingErrorLogs(data: Partial<UpdateProfilingErrorLogsRequest>): Promise<ApiResponse<any>> {
        return await axiosInstance.post('tms/unified-op/update-profiling-error-logs', data).then((response) => {
            return response.data as ApiResponse<any>;
        }).catch((error) => {
            throw handleApiError(error);
        });
    }
}
export default UnifiedOpService.getInstance();