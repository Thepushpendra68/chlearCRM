#!/bin/bash
cd frontend
echo "Manually installing minimal frontend dependencies..."

# Create minimal package.json with only essential deps
cat > package.json.minimal << 'PKGJSON'
{
  "name": "sakha-frontend-minimal",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5"
  }
}
PKGJSON

# Install minimal deps
npm install --no-optional --legacy-peer-deps package.json.minimal

# Restore original package.json
# mv package.json.minimal package.json.bak
# Restore after install
echo "Minimal install complete!"
