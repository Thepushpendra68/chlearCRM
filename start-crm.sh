#!/bin/bash

echo "🚀 Starting CRM Application Setup..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the CRM project root directory"
    exit 1
fi

# Create .env file for backend if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env file..."
    cat > backend/.env << EOF
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_database
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_12345
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo "✅ Created backend/.env file"
else
    echo "✅ backend/.env file already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Go back to root
cd ..

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure PostgreSQL is running"
echo "2. Create database: createdb crm_database"
echo "3. Run migrations: cd backend && npm run migrate"
echo "4. Seed data: cd backend && npm run seed"
echo "5. Start backend: cd backend && npm run dev"
echo "6. Start frontend: cd frontend && npm run dev"
echo ""
echo "Login credentials:"
echo "- Admin: admin@crm.com / Admin123!"
echo "- Manager: manager@crm.com / Manager123!"
echo "- Sales: sales1@crm.com / Sales123!"
