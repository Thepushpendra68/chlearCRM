import React from 'react';
import { useIndustryConfig } from '../../context/IndustryConfigContext';

/**
 * ConfigLoader Component
 *
 * Shows loading state while industry configuration is being fetched.
 * Displays error state with retry button if configuration fails to load.
 * Only renders children when configuration is successfully loaded.
 *
 * Usage:
 *   <ConfigLoader>
 *     <YourComponent />
 *   </ConfigLoader>
 *
 * @param {React.ReactNode} children - Components to render after config loads
 * @param {React.ReactNode} fallback - Custom loading component (optional)
 */
const ConfigLoader = ({ children, fallback = null }) => {
  const { loading, error, refetch } = useIndustryConfig();

  // Show loading state
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 font-medium">
              Loading configuration...
            </p>
          </div>
        </div>
      )
    );
  }

  // Show error state with retry button
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md px-4">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to Load Configuration
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {error || 'An error occurred while loading the industry configuration.'}
          </p>
          <button
            onClick={refetch}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Configuration loaded successfully, render children
  return <>{children}</>;
};

export default ConfigLoader;
