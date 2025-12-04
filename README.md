# DAD - Distributed Application Development

A simple full-stack web application with:
- **Backend**: Laravel API (PHP)
- **Frontend**: Vue 3 (JavaScript)
- **Real-time**: WebSocket Server (Node.js)
- **Database**: SQLite
- **Deployment**: Kubernetes

---

## 📋 What You Need

You have **two options** for running this project:

### Option A: Local Development (Recommended for Development)

1. **PHP 8.2+** - Download from [php.net](https://www.php.net/downloads) or use XAMPP
2. **Node.js & npm** - Download from [nodejs.org](https://nodejs.org/)
3. **Composer** - Download from [getcomposer.org](https://getcomposer.org/)
4. **Git** - Download from [git-scm.com](https://git-scm.com)

### Option B: Docker & Kubernetes (Production-like)

1. **Docker Desktop** - Download from [docker.com](https://www.docker.com/products/docker-desktop)
2. **Git** - Download from [git-scm.com](https://git-scm.com)
3. **kubectl** - Install with your package manager or download from [kubernetes.io](https://kubernetes.io/docs/tasks/tools/)
4. **VPN** - Connected to our school network or use its VPN [VPN](https://intranet.ipleiria.pt/catalogo/entidades/DSI/categorias/bb2c9adf5f724c2e9322c800b17dca5d/servicos/e544e40fa845428e8e4ebc08d93cefa5)


### Quick Install (macOS with Chocolatey - Optional)

```bash
choco install php composer nodejs-lts git
```

---

## 🚀 Quick Start

Choose your path:

### ✅ For Development: Follow "Local Development Setup" (Recommended)
### ☸️ For Production/Learning: Follow "Setup & Run with Docker & Kubernetes"

---

## 🚀 Setup & Run with Docker & Kubernetes

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
docker build -f deployment/DockerfileLaravel --platform linux/amd64 \ -t registry-172.22.21.115.sslip.io/dad-group-10/api:v1.0.0 .

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

## 💻 Local Development Setup (Without Docker/Kubernetes)

If you want to run the project locally on your machine for development:

### Prerequisites

1. **PHP 8.2+** with extensions:
   - `fileinfo` (for file uploads)
   - `sqlite3`
   - `curl`
   - `json`
   - Install from [php.net](https://www.php.net/downloads) or use a local server like XAMPP/WAMP

2. **Node.js & npm** - Download from [nodejs.org](https://nodejs.org/)

3. **Composer** - Download from [getcomposer.org](https://getcomposer.org/)

4. **Git** - Download from [git-scm.com](https://git-scm.com)

### Step 1: Clone the Project

```bash
git clone https://github.com/zee02/projeto-DAD.git
cd projeto-DAD
```

### Step 2: Setup Backend (Laravel API)

#### 2.1 Install PHP Dependencies

```bash
cd api
composer install
```

#### 2.2 Create Environment File

```bash
cp .env.example .env
```

#### 2.3 Generate Application Key

```bash
php artisan key:generate
```

#### 2.4 Create SQLite Database

```bash
# Windows
type nul > database\database.sqlite

# macOS/Linux
touch database/database.sqlite
```

#### 2.5 Run Migrations

```bash
php artisan migrate
```

#### 2.6 Seed the Database (Optional - Creates test data)

```bash
php artisan db:seed
```

#### 2.7 Create Storage Symlink (For Avatar Uploads)

```bash
php artisan storage:link
```

#### 2.8 Enable PHP fileinfo Extension (Windows Only)

If you're on Windows and using XAMPP:

1. Open `php.ini` (usually in `C:\xampp\php\php.ini`)
2. Find the line `;extension=fileinfo`
3. Remove the semicolon to uncomment it: `extension=fileinfo`
4. Save and restart Apache

#### 2.9 Start Laravel Development Server

```bash
php artisan serve
```

The API will be running on `http://127.0.0.1:8000`

---

### Step 3: Setup Frontend (Vue.js)

#### 3.1 Install Node Dependencies

```bash
cd frontend
npm install
```

#### 3.2 Start Development Server

```bash
npm run dev
```

The frontend will be running on `http://localhost:5173` (or similar)

---

### Step 4: Setup WebSocket Server

#### 4.1 Install Node Dependencies

```bash
cd websockets
npm install
```

#### 4.2 Start WebSocket Server

```bash
node server.js
# or
npm start
```

The WebSocket server will be running on `http://localhost:3000`

---

### Step 5: Access the Application

1. Open your browser and go to `http://localhost:5173`

✅ **Done! Your local development environment is ready!**

---

### Running All 3 Services Locally (Windows PowerShell Example)

Open 3 separate PowerShell terminals and run:

**Terminal 1 - Backend:**
```powershell
cd api
php artisan serve
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

**Terminal 3 - WebSocket:**
```powershell
cd websockets
npm start
```

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

## ❌ Troubleshooting Local Development

### Port Already in Use?

If you get a "port already in use" error:

```bash
# Find what process is using the port (Windows)
netstat -ano | findstr :<PORT>

# Kill the process (Windows)
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :<PORT>
kill -9 <PID>
```

### Composer Install Failing?

```bash
# Clear composer cache
composer clear-cache

# Remove composer.lock and vendor folder
rm -r vendor composer.lock

# Try install again
composer install
```

### npm Install Issues?

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -r node_modules package-lock.json

# Reinstall
npm install
```

### Database Not Working?

```bash
# Check database file exists
# Windows: .\api\database\database.sqlite

# Reset database (be careful!)
rm .\api\database\database.sqlite
php artisan migrate
php artisan db:seed
```

### Storage Link Not Working (Avatar Uploads Failing)?

```bash
# Make sure you're in the api directory
cd api

# Create the symlink
php artisan storage:link

# Verify it worked
ls -la storage/  # Look for "public -> /path/to/public/storage"
```

### PHP Extensions Missing?

```bash
# Check what extensions are installed
php -m

# If fileinfo, sqlite3, etc. are missing:
# On Windows (XAMPP): Edit php.ini and uncomment the extensions
# On macOS/Linux: brew install php@8.2 or update your PHP installation
```

### Frontend Not Connecting to Backend?

Check that:
1. Laravel API is running on `http://127.0.0.1:8000`
2. Vue is configured to use the correct API URL
3. Check `frontend/src/stores/` for API configuration
4. Make sure CORS is configured correctly in Laravel

---

## ❌ Troubleshooting Kubernetes Deployment
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


## 📝 Technologies Used

- **Laravel 12** - Backend API
- **Vue 3** - Frontend UI
- **Node.js** - WebSocket Server
- **SQLite** - Database
- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **Nginx** - Web Server



Enjoy! 🎉
