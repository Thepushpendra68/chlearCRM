# 🐳 Docker Setup for CHLEAR CRM

This guide will help you run the CHLEAR CRM application using Docker Desktop, eliminating port conflicts and providing a consistent development environment.

## 🎯 What This Setup Provides

- **PostgreSQL Database**: Containerized database with persistent data
- **Backend API**: Node.js application running in container
- **Frontend**: React application with nginx (production) or dev server (development)
- **No Port Conflicts**: All services run in isolated containers
- **Easy Development**: Hot reload for both frontend and backend

## 📋 Prerequisites

1. **Docker Desktop**: Download and install from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **Git**: For cloning the repository (if not already done)

## 🚀 Quick Start

### 1. Start All Services (Production Mode)

```bash
# Navigate to your project directory
cd "C:\Users\Vishaka\Downloads\CHLEAR CRM"

# Start all services
docker-compose up -d
```

This will start:
- **Database**: PostgreSQL on port 5432
- **Backend**: Node.js API on port 5000
- **Frontend**: React app on port 3000

### 2. Start with Development Mode (Hot Reload)

```bash
# Start with development frontend (hot reload)
docker-compose --profile dev up -d
```

This will start:
- **Database**: PostgreSQL on port 5432
- **Backend**: Node.js API on port 5000 (with hot reload)
- **Frontend Dev**: React app on port 3001 (with hot reload)

## 🌐 Access Your Application

- **Frontend**: http://localhost:3000 (production) or http://localhost:3001 (development)
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432
- **Health Check**: http://localhost:5000/health

## 🔧 Development Commands

### Start Services
```bash
# Production mode
docker-compose up -d

# Development mode with hot reload
docker-compose --profile dev up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete your database data)
docker-compose down -v
```

### Database Operations
```bash
# Run migrations
docker-compose exec backend npm run migrate

# Run seeds
docker-compose exec backend npm run seed

# Access database shell
docker-compose exec postgres psql -U crm_user -d chlear_crm
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Rebuild and start
docker-compose up -d --build
```

## 🗄️ Database Management

### Default Database Credentials
- **Host**: localhost (or `postgres` from within containers)
- **Port**: 5432
- **Database**: chlear_crm
- **Username**: crm_user
- **Password**: crm_password_2024

### Persistent Data
Your database data is stored in a Docker volume named `postgres_data`. This means:
- ✅ Data persists between container restarts
- ✅ Data persists when you stop/start services
- ❌ Data is lost when you run `docker-compose down -v`

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U crm_user chlear_crm > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U crm_user chlear_crm < backup.sql
```

## 🔧 Configuration

### Environment Variables

The Docker setup uses these environment variables:

**Backend (.env or docker-compose.yml)**:
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_for_docker_development_2024
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=chlear_crm
DB_USER=crm_user
DB_PASSWORD=crm_password_2024
```

**Frontend**:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=CHLEAR CRM
VITE_APP_VERSION=1.0.0
```

### Custom Ports

If you need to change ports, edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "5001:5000"  # Change 5001 to your preferred port
  frontend:
    ports:
      - "3001:3000"  # Change 3001 to your preferred port
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Check what's using the port
   netstat -ano | findstr :5000
   
   # Kill the process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```

2. **Container Won't Start**:
   ```bash
   # Check container logs
   docker-compose logs backend
   
   # Rebuild container
   docker-compose build --no-cache backend
   ```

3. **Database Connection Issues**:
   ```bash
   # Check if database is running
   docker-compose ps
   
   # Restart database
   docker-compose restart postgres
   ```

4. **Permission Issues**:
   ```bash
   # Reset Docker Desktop
   # Go to Docker Desktop > Settings > Reset
   ```

### Reset Everything
```bash
# Stop all services and remove everything
docker-compose down -v
docker system prune -a

# Start fresh
docker-compose up -d --build
```

## 📊 Monitoring

### Check Service Status
```bash
# View running containers
docker-compose ps

# View resource usage
docker stats

# View logs in real-time
docker-compose logs -f
```

### Health Checks
- **Backend**: http://localhost:5000/health
- **Frontend**: http://localhost:3000/health
- **Database**: `docker-compose exec postgres pg_isready -U crm_user`

## 🔄 Development Workflow

### Daily Development
1. Start services: `docker-compose --profile dev up -d`
2. Make changes to your code
3. Changes are automatically reflected (hot reload)
4. Stop services: `docker-compose down`

### Production Testing
1. Start production services: `docker-compose up -d`
2. Test your application
3. Stop services: `docker-compose down`

## 🎉 Benefits of This Setup

- ✅ **No Port Conflicts**: Each service runs in its own container
- ✅ **Consistent Environment**: Same setup works on any machine
- ✅ **Easy Database Management**: PostgreSQL with persistent data
- ✅ **Hot Reload**: Development mode with automatic code reloading
- ✅ **Production Ready**: Production mode with optimized builds
- ✅ **Easy Cleanup**: Stop all services with one command
- ✅ **Isolated Dependencies**: No conflicts with other projects

## 🆘 Need Help?

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify Docker Desktop is running
3. Try rebuilding: `docker-compose up -d --build`
4. Reset everything: `docker-compose down -v && docker-compose up -d --build`

Your CHLEAR CRM is now running in Docker! 🚀
