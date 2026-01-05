# Services Required for Next.js Application on AlmaLinux with Nginx

## Core Services (Required)

### 1. **Node.js Service**
- **Purpose**: Runs the Next.js application
- **Service Name**: `node` (or `nodejs`)
- **Status**: Must be running
- **Port**: Typically 3000 (or configured port)
- **Command**: `npm start` or `next start` (production mode)

### 2. **Nginx Service**
- **Purpose**: Web server and reverse proxy
- **Service Name**: `nginx`
- **Status**: Must be running
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Configuration**: Should proxy requests to Node.js application

## External Services (Required)

### 3. **Backend API Server**
- **Purpose**: Main backend API for the application
- **Environment Variable**: `NEXT_PUBLIC_BACKEND_URL`
- **Default**: `http://localhost:8000/`
- **Protocol**: HTTP/HTTPS
- **Features**: Authentication, data operations, business logic

### 4. **Firebase Services**
- **Purpose**: Push notifications, authentication, storage
- **Environment Variables Required**:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
  - `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- **Service Type**: Cloud service (Google Firebase)

## Real-Time Services (Required for specific features)

### 5. **CTI WebSocket Server**
- **Purpose**: Computer Telephony Integration (call handling)
- **Environment Variable**: `NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL`
- **Protocol**: WebSocket (ws/wss)
- **Port**: Configurable (default 8008)
- **Service Type**: External WebSocket server

### 6. **AI/ML Analysis WebSocket Server**
- **Purpose**: Real-time analysis and AI/ML processing
- **Environment Variable**: `NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL`
- **Protocol**: WebSocket (ws/wss)
- **Service Type**: External WebSocket server

### 7. **Call Logs Socket Server**
- **Purpose**: Real-time call logs streaming
- **Environment Variable**: `NEXT_PUBLIC_CALL_LOGS_SOCKET_URL`
- **Protocol**: WebSocket (ws/wss)
- **Service Type**: External WebSocket server

## Optional Services

### 8. **SQL Server** (Optional)
- **Purpose**: Database (if enabled)
- **Status**: Currently disabled in `systeminfo.py`
- **Port**: 1433 (default)
- **Driver**: ODBC Driver for SQL Server
- **Note**: Can be enabled by setting `CONFIG["SQL"]["ENABLED"] = True` in `systeminfo.py`

### 9. **Stripe Payment Service** (Optional - for payment features)
- **Purpose**: Payment processing
- **Environment Variable**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Server-side**: `STRIPE_SECRET_KEY`
- **Service Type**: Cloud service (Stripe)

## Authentication Services

### 10. **NextAuth**
- **Purpose**: Authentication framework
- **Environment Variables**:
  - `NEXTAUTH_SECRET` (required)
  - `NEXT_PUBLIC_BASE_URL`
- **Service Type**: Built into Next.js application

## Service Monitoring

Based on `systeminfo.py`, the following services are monitored:
- `node` - Node.js/Next.js application
- `nginx` - Web server

## Service Status Check Commands

```bash
# Check Node.js service
systemctl status node
# or
ps aux | grep node

# Check Nginx service
systemctl status nginx

# Check if Node.js is listening on port
ss -tlnp | grep :3000

# Check if Nginx is listening
ss -tlnp | grep :80
ss -tlnp | grep :443
```

## Recommended Service Setup

### 1. Create systemd service for Node.js application:
```bash
# Create service file: /etc/systemd/system/nextjs-app.service
[Unit]
Description=Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/mainapp
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### 2. Enable and start services:
```bash
sudo systemctl enable nginx
sudo systemctl enable nextjs-app
sudo systemctl start nginx
sudo systemctl start nextjs-app
```

## Environment Variables Summary

Required environment variables:
- `NEXTAUTH_SECRET` - Secret for NextAuth
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL
- `NEXT_PUBLIC_BASE_URL` - Application base URL

Optional but recommended:
- `NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL` - CTI WebSocket server
- `NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL` - AI/ML WebSocket server
- `NEXT_PUBLIC_CALL_LOGS_SOCKET_URL` - Call logs WebSocket server
- Firebase configuration variables
- Stripe keys (if using payments)

## Network Ports Summary

- **80/443**: Nginx (HTTP/HTTPS)
- **3000**: Next.js application (internal, proxied by Nginx)
- **8000**: Backend API (default, configurable)
- **8008**: CTI Server (configurable)
- **1433**: SQL Server (if enabled, optional)

## Notes

1. The application uses **Next.js 15.3.4** with **React 19**
2. Nginx should be configured as a reverse proxy to forward requests to the Node.js application
3. All WebSocket services are external and must be accessible from the server
4. Firebase is a cloud service and doesn't require local installation
5. The `systeminfo.py` script monitors `node` and `nginx` services specifically

