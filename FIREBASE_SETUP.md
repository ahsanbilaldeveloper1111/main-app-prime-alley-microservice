# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to set up and use Firebase Cloud Messaging in your Next.js application.

## Prerequisites

1. A Firebase project with Cloud Messaging enabled
2. Firebase Web App configuration
3. VAPID key for web push notifications

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase VAPID Key (for web push notifications)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

## Getting Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on the Web app icon (`</>`) or select your existing web app
6. Copy the configuration values to your `.env.local` file

## Getting VAPID Key

1. In Firebase Console, go to Project Settings
2. Click on the "Cloud Messaging" tab
3. Scroll down to "Web configuration"
4. Under "Web Push certificates", click "Generate key pair" if you don't have one
5. Copy the key and add it to `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

## Backend API Endpoints

Your backend should implement the following endpoints:

### Register FCM Token

**POST** `/api/notifications/register-token`

Request body:
```json
{
  "fcmToken": "string",
  "deviceId": "string (optional)",
  "deviceType": "string (optional)",
  "platform": "string (optional)"
}
```

Response:
```json
{
  "success": true,
  "message": "Token registered successfully"
}
```

### Unregister FCM Token

**POST** `/api/notifications/unregister-token`

Request body:
```json
{
  "fcmToken": "string"
}
```

Response:
```json
{
  "success": true,
  "message": "Token unregistered successfully"
}
```

## Usage in Components

### Basic Usage (Auto-registration)

```tsx
import { useFCM } from '@hooks/useFCM';

export const MyComponent = () => {
  const { token, isLoading, error, permission } = useFCM(true);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (permission !== 'granted') return <div>Permission not granted</div>;

  return <div>Token: {token}</div>;
};
```

### Manual Token Management

```tsx
import { useFCM } from '@hooks/useFCM';

export const MyComponent = () => {
  const {
    token,
    requestPermission,
    registerToken,
    refreshToken,
    unregisterToken,
  } = useFCM(false); // Set autoRegister to false

  const handleRegister = async () => {
    await requestPermission();
    await registerToken();
  };

  return (
    <div>
      <button onClick={handleRegister}>Register Token</button>
      <button onClick={refreshToken}>Refresh Token</button>
      <button onClick={unregisterToken}>Unregister Token</button>
    </div>
  );
};
```

## How It Works

1. **Initialization**: The `FirebaseNotificationProvider` initializes Firebase when the app loads
2. **Service Worker**: A service worker is registered to handle background notifications
3. **Token Generation**: The `useFCM` hook requests notification permission and generates an FCM token
4. **Token Registration**: The token is automatically sent to your backend API (if `autoRegister` is true)
5. **Foreground Messages**: When the app is in the foreground, notifications are handled via the `onMessage` listener
6. **Background Messages**: When the app is in the background, notifications are handled by the service worker

## Notification Payload Format

When sending notifications from your backend, use this format:

```json
{
  "notification": {
    "title": "Notification Title",
    "body": "Notification body text",
    "icon": "/icon-192x192.png",
    "image": "https://example.com/image.jpg"
  },
  "data": {
    "url": "/path/to/page",
    "tag": "notification-tag",
    "requireInteraction": "false",
    "silent": "false"
  }
}
```

## Testing

1. Make sure all environment variables are set
2. Start your development server: `npm run dev`
3. Open the browser console to see FCM initialization logs
4. Check the Network tab to verify the token registration API call
5. Test notifications using Firebase Console or your backend

## Troubleshooting

### Token not generated
- Check browser console for errors
- Verify all Firebase environment variables are set correctly
- Ensure notification permission is granted
- Check that VAPID key is correct

### Service worker not registering
- Check browser console for service worker errors
- Verify `firebase-messaging-sw.js` is accessible at `/firebase-messaging-sw.js`
- Check browser's Application tab > Service Workers

### Notifications not appearing
- Verify notification permission is granted
- Check browser notification settings
- Ensure service worker is active
- Verify notification payload format is correct

### API calls failing
- Check network tab for API errors
- Verify backend endpoints are correct
- Ensure authentication tokens are included in requests
- Check CORS settings on backend

## Files Structure

```
src/
├── config/
│   └── firebase.ts              # Firebase initialization
├── services/
│   ├── fcmService.ts           # FCM token management
│   └── notificationApi.ts      # Backend API calls
├── hooks/
│   └── useFCM.ts               # React hook for FCM
├── components/
│   └── FirebaseNotificationProvider.tsx  # Provider component
└── examples/
    └── FCMUsageExample.tsx     # Usage examples

public/
└── firebase-messaging-sw.js    # Service worker for background notifications
```

## Best Practices

1. **Error Handling**: Always handle errors gracefully and provide user feedback
2. **Permission Requests**: Request notification permission at an appropriate time (e.g., after user action)
3. **Token Refresh**: Handle token refresh when needed (e.g., after app updates)
4. **Token Cleanup**: Unregister tokens when users log out
5. **Testing**: Test on multiple browsers and devices
6. **Security**: Never expose Firebase private keys in client-side code
7. **Performance**: Cache tokens to avoid unnecessary API calls

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [Service Workers Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

