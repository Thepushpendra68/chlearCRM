# 🚀 CRM Development Setup

## 🎯 **PERMANENT SOLUTION FOR PORT CONFLICTS**

You now have **AUTOMATED STARTUP SCRIPTS** that handle all port conflicts and configuration automatically.

## 📋 **Available Scripts**

### 🐳 **Docker Development (Recommended)**
```bash
# Double-click or run from terminal:
start-dev.bat
```
**What it does:**
- ✅ Kills any conflicting processes on ports 3000, 5000, 5001
- ✅ Starts Docker containers with consistent configuration
- ✅ Backend: `http://localhost:5001/api`
- ✅ Frontend: `http://localhost:3000`

### 💻 **Local Development**
```bash
# Double-click or run from terminal:
start-local.bat
```
**What it does:**
- ✅ Kills any conflicting processes
- ✅ Stops Docker containers
- ✅ Updates frontend config to use port 5000
- ✅ Starts backend locally on port 5000
- ✅ Starts frontend locally on port 3000
- ✅ Backend: `http://localhost:5000/api`
- ✅ Frontend: `http://localhost:3000`

### 🛑 **Stop Everything**
```bash
# Double-click or run from terminal:
stop-all.bat
```
**What it does:**
- ✅ Stops all Docker containers
- ✅ Kills all processes on ports 3000, 5000, 5001
- ✅ Completely clean slate

## 🔧 **Port Configuration**

| Service | Docker Mode | Local Mode |
|---------|------------|------------|
| Backend API | :5001 | :5000 |
| Frontend | :3000 | :3000 |

## 🎯 **How This Solves The Port Issue**

1. **Automated Cleanup**: Scripts automatically kill conflicting processes
2. **Consistent Configuration**: Scripts ensure frontend always points to correct backend port
3. **Clear Separation**: Choose Docker OR Local - no mixing
4. **One-Click Start**: No manual port checking or configuration needed

## 🚨 **NEVER RUN SERVICES MANUALLY AGAIN**

❌ **DON'T DO:**
- `npm run dev` manually
- `docker-compose up` manually
- Mix Docker and local services

✅ **DO:**
- Use `start-dev.bat` for Docker development
- Use `start-local.bat` for local development
- Use `stop-all.bat` to clean everything

## 🔍 **Troubleshooting**

If you still get port errors:
1. Run `stop-all.bat`
2. Wait 10 seconds
3. Run your preferred start script

## 📊 **Quick Start**

1. **Choose your development mode:**
   - Docker: `start-dev.bat`
   - Local: `start-local.bat`

2. **Open browser:**
   - Frontend: `http://localhost:3000`
   - Backend Health: `http://localhost:5001/health` (Docker) or `http://localhost:5000/health` (Local)

3. **Login with your Supabase credentials**

## 🎉 **Result**

- ✅ No more port conflicts
- ✅ No more manual configuration
- ✅ Consistent development environment
- ✅ One-click startup/shutdown
- ✅ Authentication works perfectly

**Your port nightmare is over! 🎉**