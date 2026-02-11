import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { nextAuthLogger } from '../../../utils/nextAuthLogger';

// Constants
const REFRESH_BUFFER_MS = 2 * 60 * 1000; // 2 minutes before expiry
const SESSION_MAX_AGE = 2 * 60 * 60; // 2 hours in seconds (matches refresh token expiry)

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

      company_id?: string | null;
      company_name?: string | null;
      company_identifier?: string | null;

      username?: string | null;
      is_admin?: string | null;
      login_as?: string | null;
      phone?: string | null;
      role?: string | null;
      user_type?: string | null;
      country?: string | null;
      profile_picture?: string | null;
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
    company_id?: string | null;
    company_name?: string | null;
    company_identifier?: string | null;
    role?: string | null;
    is_admin?: string | null;
    login_as?: string | null;
    phone?: string | null;
    user_type?: string | null;
    country?: string | null;
    profile_picture?: string | null;
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
          console.log(jsonData);
          
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
            company_id: jsonData.data?.company_id,
            company_name: jsonData.data?.company_name,
            company_identifier: jsonData.data?.company_identifier,
            username: jsonData.data?.username,
            role: jsonData.data?.role,
            phone: jsonData.data?.phone,
            country: jsonData.data?.country,
            user_type: jsonData.data?.userType,
            profile_picture: jsonData.data?.profile_picture,
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
          company_id: user.company_id,
          company_name: user.company_name,
          company_identifier: user.company_identifier,
          username: user.username,
          is_admin: user.is_admin,
          login_as: user.login_as,
          phone: user.phone,
          user_type: user.user_type,
          country: user.country,
          profile_picture: user.profile_picture,
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

      // Note: Token refresh is now handled by tokenService on the client-side
      // NextAuth no longer performs token refresh - it only reads tokens from JWT
      // TokenService syncs refreshed tokens to cookies, which are read in session callback
      // This eliminates race conditions and ensures single source of truth

      return token;
    },

    async session({ session, token }) {
      // Map token data to session user object
      // Note: Tokens are managed by tokenService (sessionStorage) for axios
      // NextAuth session provides initial tokens on login, but tokenService is the source of truth
      // Client-side code reads from sessionStorage via tokenService, not from NextAuth session tokens
      if (session.user) {
        session.user = {
          id: token.id as string | null,
          name: token.name as string | null,
          email: token.email as string | null,
          
          company_id: token.company_id as string | null,
          company_name: token.company_name as string | null,
          company_identifier: token.company_identifier as string | null,

          username: token.username as string | null,
          role: token.role as string | null,
          is_admin: token.is_admin as string | null,
          login_as: token.login_as as string | null,
          phone: token.phone as string | null,
          user_type: token.user_type as string | null,
          country: token.country as string | null,
          profile_picture: token.profile_picture as string | null,
          permissions: (token.permissions as string[]) || [],
          // Include tokens from JWT for initial session setup
          // tokenService will sync these to sessionStorage on client-side
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