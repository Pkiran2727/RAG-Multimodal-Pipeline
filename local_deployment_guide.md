# 🚀 Local Network Deployment Guide: RAG Monolith with Nginx & Docker

This guide explains how to deploy your RAG Monolith application locally using Nginx as a reverse proxy, making it accessible to anyone in your local Wi-Fi or LAN network. 

No SSL certificates or DNS are required. This setup automatically supports WebSockets (for pipeline traces) and handles routing dynamically, meaning **it will work even if your server's local IP address changes!**

---

## 🛠️ The Architecture

When multiple devices in a local network try to access your application, hardcoding `localhost:8001` or a specific IP in the frontend build will cause connection issues. 

We solve this using **Nginx as a unified gateway** on port `8080` (or `80`):
```mermaid
graph TD
    Client[Devices on Local Network] -->|Access http://192.168.1.5:8080| Nginx[Nginx Reverse Proxy]
    Nginx -->|Route / (Static Files)| Frontend[Frontend Container]
    Nginx -->|Route /api, /auth, etc.| Backend[Backend Container]
    Nginx -->|Route /ws (WebSockets)| Backend[Backend Container]
```

---

## 📋 Step-by-Step Setup

### Step 1: Create Nginx Configuration
Create a new directory named `nginx` in `/Content/AI-PROJECTS/RAG_FULL_APPLICATION_LOCAL` and write the reverse proxy configuration:

```nginx
# nginx/nginx.conf
server {
    listen 80;

    # 1. Route for Frontend Static Assets
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 2. Route for API Endpoints
    location ~ ^/(auth|ingest|query|health) {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. Route for WebSockets (Pipeline Live Tracer)
    location ~ ^/ws/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

---

### Step 2: Update `docker-compose.yml`
Configure your services to use Nginx on the host's port `8080` (or `80`) and leave `VITE_API_BASE_URL` empty so the frontend dynamically uses the active IP:

```yaml
version: "3.9"

services:
  backend:
    build:
      context: ./RAG_FULL_APPLICATION_BACKEND
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - ./RAG_FULL_APPLICATION_BACKEND/.env
    volumes:
      - ./RAG_FULL_APPLICATION_BACKEND:/app
      - ./RAG_FULL_APPLICATION_BACKEND/data:/app/data
    depends_on:
      - redis
    restart: unless-stopped

  frontend:
    build:
      context: ./RAG_FULL_APPLICATION_FRONTEND
      dockerfile: Dockerfile
      args:
        - VITE_API_BASE_URL= # Left empty so it uses window.location.origin dynamically!
    depends_on:
      - backend

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:stable-alpine
    ports:
      - "8080:80"  # Exposes the portal to your local network on port 8080
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

---

### Step 3: Run the Application
Start the containers in detached mode:
```bash
docker compose up -d --build
```

---

## 👥 How Others Can Access It

1. **Find your local IP Address:**
   Run the following command to find your machine's IP inside your Wi-Fi/LAN network:
   ```bash
   ip route get 1.1.1.1 | awk '{print $7}'
   ```
   *(For example: `192.168.1.5`)*

2. **Access URL:**
   Any device connected to the **same Wi-Fi or router** can simply open their browser and visit:
   ```text
   http://<YOUR_LOCAL_IP>:8080
   # Example: http://192.168.1.5:8080
   ```
