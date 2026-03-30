import { useEffect, useState } from 'react';
import { GetHierarchyData } from '@utils/users';

export const useHierarchyData = (
  moduleSlug?: string,
  /** When false, skips GetHierarchyData (e.g. parent already loaded extensions). */
  fetchEnabled: boolean = true,
) => {
  const [hierarchyDataUsers, setHierarchyDataUsers] = useState<string[]>([]);
  const [hierarchyDataDepartments, setHierarchyDataDepartments] = useState<string[]>([]);
  const [hierarchyDataCompanies, setHierarchyDataCompanies] = useState<string[]>([]);
  const [hierarchyDataExtensions, setHierarchyDataExtensions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!fetchEnabled) {
      setLoading(false);
      return;
    }
    const fetchHierarchyData = async () => {
      try {
        setLoading(true);
        const hierarchyData = await GetHierarchyData(moduleSlug);
        if (hierarchyData) {
          setHierarchyDataUsers(hierarchyData?.users);
          setHierarchyDataDepartments(hierarchyData?.departments);
          setHierarchyDataCompanies(hierarchyData?.companies);
          setHierarchyDataExtensions(hierarchyData?.extensions);
        }
      } catch (error) {
        console.error('Error fetching hierarchy data:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    void fetchHierarchyData();
  }, [moduleSlug, fetchEnabled]);

  return {
    hierarchyDataUsers,
    hierarchyDataDepartments,
    hierarchyDataCompanies,
    hierarchyDataExtensions,
    loading,
    error
  };
}; 