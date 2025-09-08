import { PermissionAction } from "@models/tms";
import toast from "react-toastify";

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    action?: PermissionAction;
    data?: T;
    errors?: Record<string, string[]>;
}

export interface PaginationData {
    total: number;
    limit: number;
    page: number;
    last_page: number;
    from: number;
    to: number;
}

export interface PaginatedData<T> {
    data: T[];
    pagination: PaginationData;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    order?: {
        column: string;
        dir: 'asc' | 'desc';
    };
}   

export interface PaginatedResponse<T> extends ApiResponse {
    data: T[];
    pagination: PaginationData;
}

export interface CollectionResponse<T> extends ApiResponse {
    data: {
        data: T[];
        [key: string]: any; // For additional data
    };
}

export class ApiError extends Error {
    constructor(
        public message: string,
        public status: number,
        public errors?: Record<string, string[]>,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export function handleApiError(error: unknown): Error {
    console.log(error, "error11111112222");
    if (isAxiosError(error)) {


        console.log(error, "error1111111");


        const responseData = error.response?.data;

        if (typeof responseData === "object" && responseData !== null) {
            const apiResponse = responseData as {
                message?: unknown;
                errors?: Record<string, string[]>;
            };

            // Laravel validation error (collect all messages)
            // Laravel validation error (separate toasts)
            if (apiResponse.errors && typeof apiResponse.errors === "object") {
                const allMessages = Object.values(apiResponse.errors).flat();

                for (const msg of allMessages) {
                    console.log(msg);
                }

                throw apiResponse.errors; // still return one Error
            }

            // General API message
            if (typeof apiResponse.message === "string") {
                  console.log(apiResponse.message);

                  throw new Error(apiResponse.message);
            }
        }

        const axiosMessage = error.message || "Network request failed";
        console.log(axiosMessage);
        return new Error(axiosMessage);
    }

    if (error instanceof Error) {
        return error;
    }

    const fallbackMessage = "An unknown error occurred";
    console.log(fallbackMessage);
    return new Error(fallbackMessage);
}

function isAxiosError(
    error: unknown,
): error is {
    isAxiosError: boolean;
    response?: { data?: any };
    message?: string;
} {
    return (
        typeof error === "object" && error !== null && "isAxiosError" in error
    );
}
