import { Session } from 'next-auth';

/**
 * Helper function to get current user's role/type from members array
 * @param membersArray - Array of project members
 * @param session - NextAuth session object
 * @returns The current user's role (e.g., 'owner', 'admin', 'member', 'viewer') or null if not found
 */
export const getCurrentUserRoleInMembers = (
  membersArray: any[],
  session: Session | null
): string | null => {
  if (!session?.user || !Array.isArray(membersArray) || membersArray.length === 0) {
    return null;
  }

  // Get current user's extension_number from session (check multiple possible properties)
  const user = session.user as any;
  const currentUserExtension = user?.extension_number || user?.extension || user?.id || null;
  if (!currentUserExtension) {
    return null;
  }

  // Find the member matching current user's extension_number
  const currentUserMember = membersArray.find((member: any) => {
    const memberExt = String(member?.extension_number || '').trim();
    const currentExt = String(currentUserExtension || '').trim();
    return memberExt && currentExt && memberExt === currentExt;
  });

  return currentUserMember?.role || null;
};

/**
 * Helper function to check if current user can add members to a project
 * @param membersArray - Array of project members
 * @param selectedProject - Selected project object with owner_extension_number
 * @param session - NextAuth session object
 * @returns true if user can add members, false otherwise
 */
export const canManage = (
  membersArray: any[],
  selectedProject: any,
  session: Session | null
): boolean => {
  if (!session?.user) return false;

  // Get current user's extension number from session
  const user = session.user as any;
  const currentUserExtension = user?.extension_number || user?.extension || user?.id || null;
  if (!currentUserExtension) {
    return false;
  }

  // Check if user is the project owner
  const ownerExtension = selectedProject?.apiData?.owner_extension_number;
  if (ownerExtension) {
    const ownerExt = String(ownerExtension || '').trim();
    const userExt = String(currentUserExtension || '').trim();
    if (ownerExt && userExt && ownerExt === userExt) {
      return true;
    }
  }

  // Get current user's role in members
  const currentUserRole = getCurrentUserRoleInMembers(membersArray, session);

  // If user is not found in members, allow
  if (currentUserRole === null) {
    return true;
  }

  // If user is found and role is admin, allow
  return currentUserRole === 'admin';
};
