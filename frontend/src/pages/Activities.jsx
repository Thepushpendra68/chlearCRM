import React, { useState } from 'react';
import ActivityList from '../components/Activities/ActivityList';
import ActivityForm from '../components/Activities/ActivityForm';
import QuickActions from '../components/Activities/QuickActions';

const Activities = () => {
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [activityType, setActivityType] = useState('note');

  const handleAddActivity = (leadId = null, type = 'note') => {
    setSelectedLeadId(leadId);
    setActivityType(type);
    setSelectedActivity(null);
    setShowActivityForm(true);
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setSelectedLeadId(activity.lead_id);
    setShowActivityForm(true);
  };

  const handleActivityClick = (activity) => {
    // Handle activity click - could open a detail modal
    console.log('Activity clicked:', activity);
  };

  const handleActivityFormSubmit = (activityData) => {
    // Activity was created/updated successfully
    setShowActivityForm(false);
    setSelectedActivity(null);
    setSelectedLeadId(null);
    // The ActivityList will refresh automatically due to its useEffect
  };

  const handleCloseActivityForm = () => {
    setShowActivityForm(false);
    setSelectedActivity(null);
    setSelectedLeadId(null);
  };

  const handleQuickAction = (leadId) => {
    setSelectedLeadId(leadId);
  };

  return (
    <div className="activities-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track and manage all your lead activities
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleAddActivity()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Activity
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select a lead ID to perform quick actions, or use the full form below.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead ID (for quick actions)
              </label>
              <input
                type="text"
                placeholder="Enter lead ID"
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => setSelectedLeadId(e.target.value)}
                value={selectedLeadId || ''}
              />
            </div>
            
            {selectedLeadId && (
              <QuickActions 
                leadId={selectedLeadId} 
                onActivityCreated={handleActivityFormSubmit}
              />
            )}
          </div>
        </div>

        {/* Activity Types Quick Buttons */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { type: 'call', label: 'Log Call', icon: '📞', color: 'bg-blue-500 hover:bg-blue-600' },
              { type: 'email', label: 'Send Email', icon: '📧', color: 'bg-green-500 hover:bg-green-600' },
              { type: 'meeting', label: 'Schedule Meeting', icon: '🤝', color: 'bg-purple-500 hover:bg-purple-600' },
              { type: 'note', label: 'Add Note', icon: '📝', color: 'bg-yellow-500 hover:bg-yellow-600' },
              { type: 'task', label: 'Create Task', icon: '✅', color: 'bg-orange-500 hover:bg-orange-600' }
            ].map(action => (
              <button
                key={action.type}
                onClick={() => handleAddActivity(selectedLeadId, action.type)}
                className={`flex items-center space-x-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${action.color}`}
              >
                <span className="text-lg">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">All Activities</h2>
            <p className="mt-1 text-sm text-gray-600">
              View and manage all activities across your leads
            </p>
          </div>
          
          <div className="p-6">
            <ActivityList
              onActivityClick={handleActivityClick}
              onEditActivity={handleEditActivity}
              showFilters={true}
            />
          </div>
        </div>

        {/* Activity Form Modal */}
        {showActivityForm && (
          <ActivityForm
            isOpen={showActivityForm}
            onClose={handleCloseActivityForm}
            onSubmit={handleActivityFormSubmit}
            leadId={selectedLeadId}
            activity={selectedActivity}
            initialType={activityType}
          />
        )}
      </div>
    </div>
  );
};

export default Activities;
