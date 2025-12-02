// Environment configuration
export const config = {
  // NextAuth configuration
  nextAuth: {
    url: process.env.NEXT_PUBLIC_BASE_URL,
    secret: process.env.NEXTAUTH_SECRET || '',
  },
  
  // Backend API configuration
  backend: {
    url: process.env.NEXT_PUBLIC_BACKEND_URL || '',
    timeout: 10000,
  },
  
  // Application configuration
  app: {
    name: 'Business Contact Center',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  },
  
  // Firebase configuration
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '',
  },
};

// Validate required environment variables
export const validateEnv = () => {
  const required = [
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_BACKEND_URL',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Export environment validation for server-side use
export const isServer = typeof window === 'undefined';

if (isServer) {
  validateEnv();
} 