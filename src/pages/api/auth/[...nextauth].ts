import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authAPI } from '../../../utils/api';
import { signOut } from "next-auth/react";


declare module 'next-auth' {
  interface Session {
    user: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      is_admin?: string | null;
      role?: string | null;
      permissions?: string[];
      access_token?: string;
      access_token_expires?: number | string;
      refresh_token?: string;
      refresh_token_expires?: number | string;
    };
  }

  interface User {

    name?: string | null;
    email?: string | null;
    role?: string | null;
    is_admin?: string | null;
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

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    is_admin?: string | null;
    role?: string | null;
    permissions?: string[];
    access_token?: string;
    access_token_expires?: number | string;
    refresh_token?: string;
    refresh_token_expires?: number | string;
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
          // console.log('login response:', jsonData);
          // return;
          
          
          if (jsonData.code === 400) { 
            return null;
          }
          console.log("jsonData", jsonData)
          if (!jsonData?.data?.token?.access_token) {
            return null;
          }
        
          const user = {
            id: jsonData.data?.id,
            name: jsonData.data?.name,
            email: jsonData.data?.email,
            role: jsonData.data?.role,
            is_admin: jsonData.data?.is_admin || null,
            permissions: jsonData.data?.permissions || [],
            token: {
              access_token: jsonData.data?.token?.access_token,
              access_token_expires: jsonData.data?.token?.expires_in,
              refresh_token: jsonData.data?.token?.refresh_token.access_token,
              refresh_token_expires: jsonData.data?.token?.refresh_token.expires_in,
            }
          };
          
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
  },

  pages: {
    signIn: '/auth/signin',
  },

  callbacks: {
    async jwt({ token, user }) {
      
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.is_admin = user.is_admin;
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
    
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.is_admin = token.is_admin;
        session.user.permissions = token.permissions;
        session.user.access_token = token.access_token;
        session.user.access_token_expires = token.access_token_expires;
        session.user.refresh_token = token.refresh_token;
        session.user.refresh_token_expires = token.refresh_token_expires;
      }

      return session;
    },
  },
};

export default NextAuth(authOptions);