# DAD - Distributed Application Development

A simple full-stack web application with:
- **Backend**: Laravel API (PHP)
- **Frontend**: Vue 3 (JavaScript)
- **Real-time**: WebSocket Server (Node.js)
- **Database**: SQLite
- **Deployment**: Kubernetes

---

## 📋 What You Need

Before starting, make sure you have:

1. **Docker Desktop** - Download from [docker.com](https://www.docker.com/products/docker-desktop)
2. **Git** - Download from [git-scm.com](https://git-scm.com)
3. **kubectl** - Install with your package manager or download from [kubernetes.io](https://kubernetes.io/docs/tasks/tools/)
4. **Composer** - For Laravel (optional for local dev)
5. **Node.js** - For npm (optional for local dev)
6. **VPN** - Connected to our school network or use its VPN [VPN](https://intranet.ipleiria.pt/catalogo/entidades/DSI/categorias/bb2c9adf5f724c2e9322c800b17dca5d/servicos/e544e40fa845428e8e4ebc08d93cefa5)


### Quick Install (macOS with Chocolatey)

```bash
choco install docker
choco install kubernetes-cli
choco install git
```

---

## 🚀 Setup & Run (The Easy Way)

### Step 1: Clone the Project

```bash
git clone https://github.com/zee02/projeto-DAD.git
cd projeto-DAD
```

### Step 2: Make Sure Docker & Kubernetes Are Running

- Start Docker Desktop and wait for it to finish loading
- Make sure you are connected to the schools network or its VPN
- Check Kubernetes is running

```bash
kubectl cluster-info
```

### Step 3: Build Docker Images

- Build all 3 images in `./projeto-DAD`

```bash
# Api(Laravel)
docker build -f deployment/DockerfileLaravel --platform linux/amd64 -t registry-172.22.21.115.sslip.io/dad-group-10/api:v1.0.0 .

# Vue
docker build -f deployment/DockerfileVue --platform linux/amd64 \ -t registry-172.22.21.115.sslip.io/dad-group-10/web:v1.0.0 .

# WebSockets
docker build -f deployment/DockerfileWS --platform linux/amd64 \ -t registry-172.22.21.115.sslip.io/dad-group-10/ws:v1.0.0 .
```

### Step 4: Create Namespace

```bash
kubectl create namespace dad-group-10
```

### Step 5: Deploy to Kubernetes

```bash
kubectl apply -f deployment/kubernetes-laravel.yml
kubectl apply -f deployment/kubernetes-vue.yml
kubectl apply -f deployment/kubernetes-ws.yml
kubectl apply -f deployment/kubernetes-ingress.yml
```

### Step 6: Wait for Everything to Start

- Watch the pods start (wait until all show "Running")

```bash
kubectl get pods -n dad-group-10
```

### Step 7: Find Your App URL

- Get your ingress IP

```bash
kubectl get ingress -n dad-group-10
```

Look for the URL that looks like: `http://web-dad-group-10-172.22.21.253.sslip.io`

### Step 8: Open in Browser & Login

1. Open the URL in your browser
2. Login with:
   - **Email**: `pa@mail.pt`
   - **Password**: `123`

✅ **Done! Your app is running!**

---

## 🔧 Common Tasks

### View Logs
```bash
# See what's happening in the backend
kubectl logs -n dad-group-10 -l app=laravel-app -f

# See frontend logs
kubectl logs -n dad-group-10 -l app=vue-app -f
```

### Restart a Service
```bash
# Restart the backend
kubectl rollout restart deployment/laravel-app -n dad-group-10

# Restart the frontend
kubectl rollout restart deployment/vue-app -n dad-group-10
```

### Connect to the Database
```bash
# Get the pod name
POD=$(kubectl get pods -n dad-group-10 -l app=laravel-app -o jsonpath='{.items[0].metadata.name}')

# Connect to database
kubectl exec -it -n dad-group-10 $POD -- sqlite3 /app/database/database.sqlite
```

### Check API is Working
```bash
# Test the login endpoint
curl -X POST http://api-dad-group-10-172.22.21.253.sslip.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pa@mail.pt","password":"123"}'
```

---

## ❌ Troubleshooting

### Pods Not Starting?
```bash
# Check what went wrong
kubectl describe pod <pod-name> -n dad-group-10

# Check the logs
kubectl logs <pod-name> -n dad-group-10
```

### Can't Access the App?
```bash
# Make sure pods are running
kubectl get pods -n dad-group-10

# Try accessing with port-forward
kubectl port-forward -n dad-group-10 svc/vue-app 8080:80
# Then visit http://localhost:8080
```

### Database Error on First Run?
```bash
# Get the pod name
POD=$(kubectl get pods -n dad-group-10 -l app=laravel-app -o jsonpath='{.items[0].metadata.name}')

# Initialize database
kubectl exec -n dad-group-10 $POD -- touch /app/database/database.sqlite
kubectl exec -n dad-group-10 $POD -- php artisan migrate
kubectl exec -n dad-group-10 $POD -- php artisan db:seed
```

---

## 🏗️ Architecture Overview

This project follows a distributed architecture with 3 independent services:

### **1. Laravel API**
- Handles authentication (Sanctum)
- Exposes REST API endpoints
- Persists data in SQLite

### **2. Vue 3 Frontend**
- SPA (Single Page Application) built with Vue Router
- Calls the Laravel API for authentication & game operations
- Connects to the WebSocket Server for real-time features

### **3. WebSocket Server (Node.js)**
- Receives WebSocket connections from the frontend
- Broadcasts echo messages for real-time testing
- Runs independently from the API

All services are containerized using Docker and deployed on a shared Kubernetes cluster managed by the school (ESTG/IPLeiria).


---

## 📡 API Routes Summary

| Method | Endpoint              | Description                      | Auth |
|--------|------------------------|----------------------------------|------|
| POST   | `/api/auth/login`     | Login and returns auth token     | ❌ No |
| POST   | `/api/auth/logout`    | Logout (invalidate token)        | ✔️ Yes |
| GET    | `/api/users/me`       | Returns authenticated user       | ✔️ Yes |
| GET    | `/api/games`          | List all games                   | ✔️ Yes |
| POST   | `/api/games`          | Create a new game                | ✔️ Yes |

> Note: Authentication is handled by Laravel Sanctum.


---
## 📚 What's Inside

```
projeto/
├── api/              # Laravel REST API backend
├── frontend/         # Vue 3 frontend
├── websockets/       # Node.js WebSocket server
├── deployment/       # Docker & Kubernetes files
└── README.md         # This file
```

**Login Credentials** (auto-created):
- Admin: `a1@mail.pt` / `123`
- Player: `pa@mail.pt` / `123`

---

## 🧪 Test

API testada no cluster:

http://api-dad-group-10-172.22.21.253.sslip.io/api/games

Frontend:

http://web-dad-group-10-172.22.21.253.sslip.io

WebSocket service:

http://ws-dad-group-10-172.22.21.253.sslip.io (ingress requires websocket upgrade)

---

## 🛑 Stop Everything

```bash
# Delete all running services
kubectl delete namespace dad-group-10

# Verify it's gone
kubectl get namespaces | grep dad-group-10
```

---

## 📞 Need More Help?

- **Check logs**: `kubectl logs -n dad-group-10 -f`
- **Check pods**: `kubectl get pods -n dad-group-10`
- **Check services**: `kubectl get svc -n dad-group-10`
- **Check ingress**: `kubectl get ingress -n dad-group-10`

---

## 📝 Technologies Used

- **Laravel 12** - Backend API
- **Vue 3** - Frontend UI
- **Node.js** - WebSocket Server
- **SQLite** - Database
- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **Nginx** - Web Server



Enjoy! 🎉
