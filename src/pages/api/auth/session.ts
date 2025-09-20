import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { sessionStore, NextAuthSessionData } from '../../../utils/sessionStore';
import { randomBytes } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Handle GET request - return existing session
    try {
      const session = await getServerSession(req, res, authOptions);
      
      if (!session?.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Generate a session ID for this request
      const sessionId = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

      // Create session data without TMS session
      const sessionData: NextAuthSessionData = {
        user: {
          ...session.user,
          // TMS permissions will be empty for main app sessions
          tmsPermissions: []
        },
        expires: expires.toISOString()
      };

      // Store session data in memory
      sessionStore.set(sessionId, sessionData);

      // Return session with session ID
      return res.status(200).json({
        ...session,
        user: {
          ...session.user,
          sessionId: sessionId
        }
      });

    } catch (error) {
      console.error('Session API error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    // Handle POST request - create session from TMS verification
    try {
      console.log('Session API POST request received');
      const { accessToken, userData, expiresIn, email } = req.body;
      
        console.log('Request body details:', { 
        accessToken: accessToken ? 'present' : 'missing',
        accessTokenValue: accessToken,
        userData: userData ? 'present' : 'missing',
        userDataType: typeof userData,
        userDataKeys: userData ? Object.keys(userData) : 'N/A',
        expiresIn,
        email
      });

      if (!accessToken || !userData || !email) {
        console.log('Missing required fields - detailed check:');
        console.log('- accessToken:', !!accessToken, accessToken);
        console.log('- userData:', !!userData, userData);
        console.log('- email:', !!email, email);
        return res.status(400).json({ message: 'Missing required fields' });
      }

      
      // Check if permissions are in the correct format or need processing
      let tmsPermissions = userData?.user_access_info?.permissions || [];
      console.log('tmsPermissions extracted (raw):', tmsPermissions);
      
      // If permissions are in string format like "view_ranks", convert to objects
      if (tmsPermissions.length > 0 && typeof tmsPermissions[0] === 'string') {
        console.log('Converting string permissions to objects...');
        tmsPermissions = tmsPermissions.map((p: string) => {
          const parts = p.split('_');
          return {
            action: parts[0] || p,
            module: parts[1] || p
          };
        });
        console.log('Converted tmsPermissions:', tmsPermissions);
      }
      
      // If permissions have the same action and module (like "view-ranks" for both), 
      // try to extract the proper action and module
      if (tmsPermissions.length > 0 && typeof tmsPermissions[0] === 'object') {
        console.log('Processing object permissions...');
        tmsPermissions = tmsPermissions.map((p: any) => {
          // If action and module are the same, try to split them
          if (p.action === p.module && p.action.includes('-')) {
            const parts = p.action.split('-');
            return {
              action: parts[0] || p.action,
              module: parts[1] || p.module
            };
          }
          return p;
        });
        console.log('Processed tmsPermissions:', tmsPermissions);
      }
      
      const tmsPermissionsArray = tmsPermissions.map((p: any) => `${p.action}_${p.module}`);
      console.log('tmsPermissionsArray:', tmsPermissionsArray);

      // Create user object for TMS session
      const user = {
        id: userData.id?.toString(),
        name: userData.name,
        email: userData.email,
        role: userData.user_type,
        is_admin: userData.is_admin || null,
        // No main application permissions for TMS-only session
        permissions: [],
        // Add TMS permissions as a separate field
        tmsPermissions: tmsPermissionsArray,
        token: {
          access_token: accessToken,
          access_token_expires: expiresIn,
          refresh_token: '',
          refresh_token_expires: 0,
        }
      };

      console.log('TMS user data structure:', {
        hasUserAccessInfo: !!userData?.user_access_info,
        tmsPermissionsCount: tmsPermissions.length,
        tmsPermissionsArray: tmsPermissionsArray.length,
        originalPermissions: userData?.permissions?.length || 0
      });
      console.log('Main app permissions:', user.permissions?.length || 0, 'permissions');
      console.log('TMS permissions:', user.tmsPermissions?.length || 0, 'permissions');

      // Generate session ID
      const sessionId = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

      // Create session data
      const sessionData: NextAuthSessionData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_admin: user.is_admin,
          permissions: user.permissions, // Original main app permissions
          tmsPermissions: user.tmsPermissions, // TMS permissions as separate field
          access_token: user.token.access_token,
          access_token_expires: user.token.access_token_expires,
          refresh_token: user.token.refresh_token,
          refresh_token_expires: user.token.refresh_token_expires,
        },
        expires: expires.toISOString()
      };

      // Store session data in memory
      console.log('Storing session data:', JSON.stringify(sessionData, null, 2));
      sessionStore.set(sessionId, sessionData);

      // Set the TMS session ID cookie (not HttpOnly so client can read it)
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = [
        `tmsSessionId=${sessionId}`,
        'Path=/',
        'SameSite=Lax',
        'Max-Age=7200'
      ];
      
      // Only add Secure flag in production
      if (isProduction) {
        cookieOptions.push('Secure');
      }
      
      const cookieString = cookieOptions.join('; ');
      res.setHeader('Set-Cookie', [cookieString]);

      console.log('Session created successfully, sessionId:', sessionId);
      console.log('Cookie set:', cookieString);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Is production:', isProduction);

      return res.status(200).json({
        success: true,
        sessionId: sessionId,
        user: sessionData.user
      });

    } catch (error) {
      console.error('Session creation error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
