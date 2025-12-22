import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { nextAuthLogger } from '../../../utils/nextAuthLogger';

// Constants
const REFRESH_BUFFER_MS = 2 * 60 * 1000; // 2 minutes before expiry
const SESSION_MAX_AGE = 15 * 60; // 15 minutes in seconds

// Helper function to parse token expiry
const parseTokenExpiry = (expires: unknown): number => {
  if (typeof expires === 'number') return expires;
  if (typeof expires === 'string') return Number.parseInt(expires, 10) || 0;
  return 0;
};

// Helper function to calculate token expiry timestamp
const calculateTokenExpiry = (expiresIn: number, now: number = Date.now()): number => {
  return now + (expiresIn * 1000);
};

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      username?: string | null;
      is_admin?: string | null;
      login_as?: string | null;
      phone?: string | null;
      role?: string | null;
      permissions?: string[];
      access_token?: string;
      access_token_expires?: number | string;
      refresh_token?: string;
      refresh_token_expires?: number | string;
      sessionId?: string; // Add session ID for custom session retrieval
    };
  }

  interface User {
    name?: string | null;
    email?: string | null;
    username?: string | null;
    role?: string | null;
    is_admin?: string | null;
    login_as?: string | null;
    phone?: string | null;
    permissions?: string[];
    access_token?: string;
    access_token_expires?: number | string;
    refresh_token?: string;
    refresh_token_expires?: number | string;
    token?: {
      access_token: string;
      access_token_expires: number | string;
      refresh_token: string;
      refresh_token_expires: number | string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          nextAuthLogger.warn('Authorization attempt with missing credentials');
          return null;
        }

        try {
          const formData = new URLSearchParams();
          formData.append("email", credentials.email);
          formData.append("password", credentials.password);
          
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
          if (!backendUrl) {
            nextAuthLogger.error('Backend URL not configured');
            return null;
          }

          nextAuthLogger.debug('Attempting login', { email: credentials.email });
          
          const res = await fetch(`${backendUrl}auth/login`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
          });
        
          const jsonData = await res.json();
          
          if (jsonData.code === 400) {
            nextAuthLogger.warn('Login failed: Invalid credentials', { code: jsonData.code });
            return null;
          }
          
          if (!jsonData?.data?.token?.access_token) {
            nextAuthLogger.warn('Login failed: Missing access token', { 
              hasData: !!jsonData?.data,
              hasToken: !!jsonData?.data?.token 
            });
            return null;
          }
        
          const now = Date.now();
          const tokenData = jsonData.data.token;
          const accessTokenExpiresIn = tokenData.expires_in || 0;
          const refreshTokenExpiresIn = tokenData.refresh_token?.expires_in || 0;
          
          const user = {
            id: jsonData.data?.id,
            name: jsonData.data?.name,
            email: jsonData.data?.email,
            username: jsonData.data?.username,
            role: jsonData.data?.role,
            phone: jsonData.data?.phone,
            is_admin: jsonData.data?.is_admin || null,
            login_as: jsonData.data?.login_as || null,
            permissions: jsonData.data?.permissions || [],
            token: {
              access_token: tokenData.access_token,
              access_token_expires: calculateTokenExpiry(accessTokenExpiresIn, now),
              refresh_token: tokenData.refresh_token?.access_token,
              refresh_token_expires: calculateTokenExpiry(refreshTokenExpiresIn, now),
            }
          };
          
          nextAuthLogger.info('Login successful', { 
            userId: user.id, 
            username: user.username,
            accessTokenExpiresIn: `${Math.floor(accessTokenExpiresIn / 60)}m`,
            refreshTokenExpiresIn: `${Math.floor(refreshTokenExpiresIn / 60)}m`
          });
          
          return user;
        } catch (error) {
          nextAuthLogger.error('Login error', error, { email: credentials.email });
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
  },

  callbacks: {
    async jwt({ token, user }) {
      // Initial login - store user data and tokens
      if (user) {
        nextAuthLogger.debug('JWT callback: Initial login', { userId: user.id, username: user.username });
        
        // Copy user data to token
        Object.assign(token, {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          is_admin: user.is_admin,
          login_as: user.login_as,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
        });
        
        // Store tokens if available
        if (user.token) {
          token.access_token = user.token.access_token;
          token.access_token_expires = user.token.access_token_expires;
          token.refresh_token = user.token.refresh_token;
          token.refresh_token_expires = user.token.refresh_token_expires;
        }
        
        return token;
      }

      // Check if token was refreshed externally (client-side refresh)
      // If the access token in the JWT is different from what's expected based on expiry,
      // it might have been refreshed externally. We should check and sync.
      // Note: This is a best-effort sync - the primary refresh mechanism is below
      
      // Token refresh check - refresh if expired or about to expire
      const now = Date.now();
      const accessTokenExpires = parseTokenExpiry(token.access_token_expires);
      const refreshTokenExpires = parseTokenExpiry(token.refresh_token_expires);
      const timeUntilExpiry = accessTokenExpires - now;

      // Check if token needs refresh (within buffer time)
      if (accessTokenExpires > 0 && timeUntilExpiry <= REFRESH_BUFFER_MS) {
        // Validate refresh token is still available and not expired
        if (!token.refresh_token || refreshTokenExpires <= now) {
          nextAuthLogger.warn('Cannot refresh: Refresh token expired or missing', {
            hasRefreshToken: !!token.refresh_token,
            refreshTokenExpired: refreshTokenExpires <= now,
            timeUntilRefreshExpiry: refreshTokenExpires > 0 ? `${Math.floor((refreshTokenExpires - now) / 1000)}s` : 'N/A'
          });
          return token;
        }

        try {
          nextAuthLogger.debug('Refreshing access token', {
            timeUntilExpiry: `${Math.floor(timeUntilExpiry / 1000)}s`,
            accessTokenExpiresAt: new Date(accessTokenExpires).toISOString()
          });

          const formData = new URLSearchParams();
          formData.append('refresh_token', token.refresh_token as string);
          
          const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
          const refreshResponse = await fetch(`${baseUrl}/api/token/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
          });

          if (!refreshResponse.ok) {
            nextAuthLogger.error('Token refresh failed', undefined, {
              status: refreshResponse.status,
              statusText: refreshResponse.statusText
            });
            return token;
          }

          const refreshData = await refreshResponse.json();
          
          if (refreshData.code === 200 && refreshData.data?.access_token) {
            // Update access token
            token.access_token = refreshData.data.access_token;
            token.access_token_expires = calculateTokenExpiry(refreshData.data.expires_in || 0, now);
            
            // Update refresh token if provided
            if (refreshData.data.refresh_token?.access_token) {
              token.refresh_token = refreshData.data.refresh_token.access_token;
              token.refresh_token_expires = calculateTokenExpiry(
                refreshData.data.refresh_token.expires_in || 0, 
                now
              );
            }
            
            nextAuthLogger.info('Token refreshed successfully', {
              newAccessTokenExpiresIn: `${Math.floor((refreshData.data.expires_in || 0) / 60)}m`,
              refreshTokenUpdated: !!refreshData.data.refresh_token?.access_token
            });
          } else {
            nextAuthLogger.error('Token refresh failed: Invalid response', undefined, {
              code: refreshData.code,
              hasAccessToken: !!refreshData.data?.access_token
            });
          }
        } catch (error) {
          nextAuthLogger.error('Token refresh error', error);
          // Don't throw - return token as-is so session doesn't break
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Map token data to session user object
      if (session.user) {
        session.user = {
          id: token.id as string | null,
          name: token.name as string | null,
          email: token.email as string | null,
          username: token.username as string | null,
          role: token.role as string | null,
          is_admin: token.is_admin as string | null,
          login_as: token.login_as as string | null,
          phone: token.phone as string | null,
          permissions: (token.permissions as string[]) || [],
          access_token: token.access_token as string | undefined,
          access_token_expires: token.access_token_expires as number | string | undefined,
          refresh_token: token.refresh_token as string | undefined,
          refresh_token_expires: token.refresh_token_expires as number | string | undefined,
        };
      }

      return session;
    },
  },
};

export default NextAuth(authOptions);