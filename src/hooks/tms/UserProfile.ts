import { useState } from 'react';
import axiosInstance from '@utils/axios';

import { 
    AddLineParams, 
    AddPhoneParams, 
    UpdateAppUserParams, 
    UpdateUserParams, 
    UpdateLineParams, 
    UpdatePhoneParams, 
    AddRemoteDestinationParams, 
    AddRemoteDestinationProfileParams, 
    UpdateDNCRParams, 
    UpdateOnlyLdapUserParams, 
    RemoveLineParams, 
    RemovePhoneParams, 
    SyncPBXParams, 
    UpdateUserProfilingErrorLogRequest 
} from '../../Models/tms/UnfidiedOp';
import { ApiResponse } from '../../utils/tms/apiResponse';
import { toast } from 'react-toastify';

export const useUserProfile = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);


    // Helper function to handle API calls with loading and error states
    const handleApiCall = async <T>(
        apiCall: () => Promise<ApiResponse<T>>,
        successMessage?: string,
        errorMessage?: string
    ): Promise<ApiResponse<T>> => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await apiCall();
            
            if (successMessage) {
                toast.success(successMessage);
            }
            
            return response;
        } catch (err) {
            setError(err);
            if (errorMessage) {
                toast.error(errorMessage);
            }
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Add Line function
    const addLine = async (params: Partial<AddLineParams>): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/add-line', params),
            `Line added successfully for ${params.ClusterName} cluster`,
            `Failed to add line for ${params.ClusterName} cluster. Please check the form and try again.`
        );
    };

    // Add Phone function
    const addPhone = async (params: Partial<AddPhoneParams>): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/add-phone', params),
            `Phone added successfully for ${params.ClusterName} cluster`,
            `Failed to add phone for ${params.ClusterName} cluster. Please check the form and try again.`
        );
    };

    // Update App User function
    const updateAppUser = async (params: UpdateAppUserParams): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/update-app-user', params),
            `App user updated successfully for ${params.ClusterName} cluster`,
            `Failed to update app user for ${params.ClusterName} cluster. Please check the form and try again.`
        );
    };

    // Update User function
    const updateUser = async (params: UpdateUserParams): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/update-user', params),
            `User updated successfully for ${params.ClusterName} cluster`,
            `Failed to update user for ${params.ClusterName} cluster. Please check the form and try again.`
        );
    };

    // Update Line function
    const updateLine = async (params: Partial<UpdateLineParams>): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/update-line', params),
            `Line updated successfully for ${params.ClusterName} cluster`,
            `Failed to update line for ${params.ClusterName} cluster. Please check the form and try again.`
        );
    };

    // Update Phone function
    const updatePhone = async (params: Partial<UpdatePhoneParams>): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/update-phone', params),
            `Phone updated successfully for ${params.ClusterName} cluster`,
            `Failed to update phone for ${params.ClusterName} cluster. Please check the form and try again.`
        );
    };

    // Add Remote Destination function
    const addRemoteDestination = async (params: Partial<AddRemoteDestinationParams>): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/add-remote-destination', params),
            "Remote destination added successfully",
            "Failed to add remote destination. Please check the form and try again."
        );
    };

    // Add Remote Destination Profile function
    const addRemoteDestinationProfile = async (params: Partial<AddRemoteDestinationProfileParams>): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/add-remote-destination-profile', params),
            "Remote destination profile added successfully",
            "Failed to add remote destination profile. Please check the form and try again."
        );
    };

    // Update DNCR function
    const updateDNCR = async (params: Partial<UpdateDNCRParams>): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/update-dncr', params),
            "DNCR Settings updated successfully",
            "Failed to update DNCR settings. Please check the form and try again."
        );
    };

    // Update User Info function
    const updateUserInfo = async (params: any): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/update-user-info', params),
            "User information updated successfully",
            "Failed to update user. Please check the form and try again."
        );
    };

    // Add User Info function
    const addUserInfo = async (params: any): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/add-user-info', params),
            "User information added successfully",
            "Failed to add user information. Please check the form and try again."
        );
    };

    // Update Only LDAP User function
    const updateOnlyLdapUser = async (params: UpdateOnlyLdapUserParams): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/update-only-ldap-user', params),
            "LDAP User updated successfully",
            "Failed to update LDAP user. Please check the form and try again."
        );
    };

    // Remove Line function
    const removeLine = async (params: RemoveLineParams): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/remove-line', params),
            "Line removed successfully",
            "Failed to remove line. Please check the form and try again."
        );
    };

    // Remove Phone function
    const removePhone = async (params: RemovePhoneParams): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/remove-phone', params),
            "Phone removed successfully",
            "Failed to remove phone. Please check the form and try again."
        );
    };

    // Sync PBX function
    const syncPBX = async (params: Partial<SyncPBXParams>): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/sync-pbx', params),
            "PBX sync completed successfully",
            "Failed to sync PBX. Please check the form and try again."
        );
    };

    // Run LDAP Sync function
    const runLdapSync = async (params: any): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/run-ldap-sync', params),
            "LDAP Sync completed successfully",
            "Failed to run LDAP sync. Please check the form and try again."
        );
    };

    // Update User Profiling Error Log function
    const updateUserProfilingErrorLog = async (params: Partial<UpdateUserProfilingErrorLogRequest>): Promise<ApiResponse<any>> => {
        return handleApiCall(
            () => axiosInstance.post('tms/unified-op/update-user-profiling-error-log', params),
            "Error log status updated successfully",
            "Failed to update error log status. Please try again."
        );
    };

    return {
        // State
        isLoading,
        error,
        
        // Functions
        addLine,
        addPhone,
        updateAppUser,
        updateUser,
        updateLine,
        updatePhone,
        addRemoteDestination,
        addRemoteDestinationProfile,
        updateDNCR,
        updateUserInfo,
        addUserInfo,
        updateOnlyLdapUser,
        removeLine,
        removePhone,
        syncPBX,
        runLdapSync,
        updateUserProfilingErrorLog,
    };
};

export default useUserProfile;
