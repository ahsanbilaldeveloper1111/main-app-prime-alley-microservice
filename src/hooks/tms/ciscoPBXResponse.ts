import { useState, useEffect, useMemo } from 'react';
import { 
    ListRoutePartition, 
    ListFacilitiesInfo, 
    ListAppUsers, 
    ListRecordingProfile, 
    ListDeviePool, 
    ListCSS, 
    getCiscoPbxUsersDirectory 
} from '@utils/tms/List';

interface ListParams {
    search?: string;
    cluster_name?: string;
    order?: {
        column: string;
        dir: string;
    };
}

export const useListRoutePartition = (params: ListParams) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Memoize params to prevent unnecessary re-renders
    const memoizedParams = useMemo(() => ({
        search: params.search || "",
        cluster_name: params.cluster_name || "",
    }), [params.search, params.cluster_name]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await ListRoutePartition();
                setData(response.dataList || []);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [memoizedParams.search, memoizedParams.cluster_name]);

    return { data, isLoading, error };
};

export const useListFacInfo = (params: ListParams) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Memoize params to prevent unnecessary re-renders
    const memoizedParams = useMemo(() => ({
        search: params.search || "",
        cluster_name: params.cluster_name || "",
    }), [params.search, params.cluster_name]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await ListFacilitiesInfo();
                setData(response.dataList || []);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [memoizedParams.search, memoizedParams.cluster_name]);

    return { data, isLoading, error };
};

export const useListAppUser = (params: ListParams) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Memoize params to prevent unnecessary re-renders
    const memoizedParams = useMemo(() => ({
        search: params.search || "",
        cluster_name: params.cluster_name || "",
    }), [params.search, params.cluster_name]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await ListAppUsers();
                setData(response.dataList || []);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [memoizedParams.search, memoizedParams.cluster_name]);

    return { data, isLoading, error };
};

export const useListRecordingProfile = (params: ListParams) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Memoize params to prevent unnecessary re-renders
    const memoizedParams = useMemo(() => ({
        search: params.search || "",
    }), [params.search]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await ListRecordingProfile();
                setData(response.dataList || []);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [memoizedParams.search]);

    return { data, isLoading, error };
};

export const useListDevicePool = (params: ListParams) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Memoize params to prevent unnecessary re-renders
    const memoizedParams = useMemo(() => ({
        search: params.search || "",
    }), [params.search]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await ListDeviePool();
                setData(response.dataList || []);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [memoizedParams.search]);

    return { data, isLoading, error };
};

export const useListCSS = (params: ListParams) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Memoize params to prevent unnecessary re-renders
    const memoizedParams = useMemo(() => ({
        search: params.search || "",
        cluster_name: params.cluster_name || "",
        order: params.order || { column: "name", dir: "asc" },
    }), [params.search, params.cluster_name, params.order?.column, params.order?.dir]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await ListCSS();
                setData(response.dataList || []);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [memoizedParams.search, memoizedParams.cluster_name, memoizedParams.order]);

    return { data, isLoading, error };
};

export const useListLdapDirectory = (params: ListParams) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // Memoize params to prevent unnecessary re-renders
    const memoizedParams = useMemo(() => ({
        search: params.search || "",
        cluster_name: params.cluster_name || "",
    }), [params.search, params.cluster_name]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await getCiscoPbxUsersDirectory();
                setData(response.dataList || []);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [memoizedParams.search, memoizedParams.cluster_name]);

    return { data, isLoading, error };
};
