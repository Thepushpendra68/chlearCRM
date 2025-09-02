# CRM Frontend

A modern React.js frontend for the Customer Relationship Management (CRM) system.

## Features

- 🔐 JWT Authentication & Authorization
- 📱 Responsive Design with Tailwind CSS
- 🎨 Modern UI Components with Headless UI
- 🚀 Fast Development with Vite
- 📊 Dashboard with Statistics
- 👥 User Management
- 📋 Lead Management
- 🔍 Search and Filtering
- 📱 Mobile-First Design

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Header, Sidebar)
│   └── UI/             # Basic UI components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API service functions
├── utils/              # Utility functions
├── App.jsx             # Main app component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Pages

- **Login** (`/login`) - User authentication
- **Register** (`/register`) - User registration
- **Dashboard** (`/dashboard`) - Main dashboard with statistics
- **Leads** (`/leads`) - Lead management
- **Users** (`/users`) - User management (admin only)

## Authentication

The app uses JWT tokens for authentication. Tokens are stored in localStorage and automatically included in API requests.

### Default Users

- **Admin**: admin@crm.com / admin123
- **Manager**: manager@crm.com / admin123
- **Sales Rep**: sales@crm.com / admin123

## API Integration

The frontend communicates with the backend API through:

- **Base URL**: `/api` (proxied to `http://localhost:5000` in development)
- **Authentication**: Bearer token in Authorization header
- **Error Handling**: Automatic token refresh and logout on 401 errors

## Styling

The app uses Tailwind CSS with custom components:

- **Colors**: Primary blue theme with gray scale
- **Components**: Pre-built button, input, and card styles
- **Responsive**: Mobile-first design approach
- **Dark Mode**: Ready for future implementation

## Development

1. **Start the backend server** (port 5000)
2. **Start the frontend dev server**:
   ```bash
   npm run dev
   ```
3. **Open** `http://localhost:3000`

## Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost:5000/api
```

## Building for Production

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Serve the built files**:
   ```bash
   npm run preview
   ```

3. **Deploy** the `dist` folder to your hosting service

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License