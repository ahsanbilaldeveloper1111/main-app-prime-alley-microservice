import { useEffect, useState } from 'react';
import { GetHierarchyData } from '@utils/users';

export const useHierarchyData = (
  moduleSlug?: string,
  /** When false, skips GetHierarchyData (e.g. parent already loaded extensions). */
  fetchEnabled: boolean = true,
) => {
  /** API returns object rows; was incorrectly typed as `string[]` in several consumers. */
  const [hierarchyDataUsers, setHierarchyDataUsers] = useState<unknown[]>([]);
  const [hierarchyDataDepartments, setHierarchyDataDepartments] = useState<unknown[]>([]);
  const [hierarchyDataCompanies, setHierarchyDataCompanies] = useState<unknown[]>([]);
  const [hierarchyDataExtensions, setHierarchyDataExtensions] = useState<unknown[]>([]);
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