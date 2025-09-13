import { useState, useEffect } from 'react';
import { OrganizationUnit, IndexRequestOrganizationUnit } from '@models/tms/Company';

export const useOrganizationUnits = (params: IndexRequestOrganizationUnit) => {
    const [data, setData] = useState<OrganizationUnit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setData([]);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [params.parent_id, params.search]);

    return { data, isLoading, error };
};
