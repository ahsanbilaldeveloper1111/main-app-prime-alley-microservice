import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authAPI } from '../../../utils/api';
import { signOut } from "next-auth/react";
import { sessionStore } from '../../../utils/sessionStore';

// Function to clear any existing TMS session data
function clearExistingTmsSessions() {
  try {
    const sessionsToDelete: string[] = [];
    
    // Find all sessions that have TMS data
    if (global.nextAuthSessions) {
      global.nextAuthSessions.forEach((sessionData: any, sessionId: string) => {
        if (sessionData.user?.tmsSession) {
          sessionsToDelete.push(sessionId);
        }
      });
    }
    
    // Delete sessions with TMS data
    sessionsToDelete.forEach(sessionId => {
      sessionStore.delete(sessionId);
      //console.log('Cleared existing TMS session:', sessionId);
    });
    
    //console.log(`Cleared ${sessionsToDelete.length} existing TMS sessions`);
  } catch (error) {
    console.error('Error clearing existing TMS sessions:', error);
  }
}


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
      tmsSession?: {
        accessToken: string;
        expiresAt: number;
        user?: {
          id?: string;
          name?: string;
          email?: string;
          user_access_info?: {
            permissions?: Array<{
              module: string;
              action: string;
            }>;
          };
          [key: string]: any;
        };
      };
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
    tmsSession?: {
      accessToken: string;
      expiresAt: number;
      user?: {
        id?: string;
        name?: string;
        email?: string;
        user_access_info?: {
          permissions?: Array<{
            module: string;
            action: string;
          }>;
        };
        [key: string]: any;
      };
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
          return null;
        }

        try {
          const formData = new URLSearchParams();
          formData.append("email", credentials.email);
          formData.append("password", credentials.password);
          const res = await fetch(
            process.env.NEXT_PUBLIC_BACKEND_URL + "auth/login",
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: formData,
            }
          );
         
        
          const jsonData = await res.json();
          
          if (jsonData.code === 400) { 
            return null;
          }
          //console.log("jsonData", jsonData)
          if (!jsonData?.data?.token?.access_token) {
            return null;
          }
        
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
              access_token: jsonData.data?.token?.access_token,
              access_token_expires: jsonData.data?.token?.expires_in,
              refresh_token: jsonData.data?.token?.refresh_token.access_token,
              refresh_token_expires: jsonData.data?.token?.refresh_token.expires_in,
            }
          };

          // Clear TMS sessions from server-side memory
          clearExistingTmsSessions();
          
          return user;
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 2 * 60 * 60, // 2 hours in seconds
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
  },

  callbacks: {
    async jwt({ token, user }) {
      // Store only essential data in JWT to minimize size
      if (user) {
        // Clear any existing TMS session data when creating new main app session
        //console.log('Clearing any existing TMS session data for new main app session');
        clearExistingTmsSessions();
        
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.username = user.username;
        token.is_admin = user.is_admin;
        token.login_as = user.login_as;
        token.phone = user.phone;
        token.role = user.role;
        token.permissions = user.permissions;
        
        if (user.token) {
          token.access_token = user.token.access_token;
          token.access_token_expires = user.token.access_token_expires;
          token.refresh_token = user.token.refresh_token;
          token.refresh_token_expires = user.token.refresh_token_expires;
        }
        
      }

      return token;
    },

    async session({ session, token }) {
      // Return minimal session data
      if (session.user) {
        session.user.id = token.id as string | null;
        session.user.name = token.name as string | null;
        session.user.email = token.email as string | null;
        session.user.username = token.username as string | null;
        session.user.role = token.role as string | null;
        session.user.is_admin = token.is_admin as string | null;
        session.user.login_as = token.login_as as string | null;
        session.user.phone = token.phone as string | null;
        session.user.permissions = token.permissions as string[];
        session.user.access_token = token.access_token as string | undefined;
        session.user.access_token_expires = token.access_token_expires as number | string | undefined;
        session.user.refresh_token = token.refresh_token as string | undefined;
        session.user.refresh_token_expires = token.refresh_token_expires as number | string | undefined;
        
      }

      return session;
    },
  },
};

export default NextAuth(authOptions);