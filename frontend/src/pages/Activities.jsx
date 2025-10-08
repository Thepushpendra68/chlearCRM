import React, { useState, useEffect } from 'react';
import ActivityList from '../components/Activities/ActivityList';
import ActivityForm from '../components/Activities/ActivityForm';
import ActivityDetail from '../components/Activities/ActivityDetail';
import activityService from '../services/activityService';

const Activities = () => {
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [activityType, setActivityType] = useState('note');
  
  // Move activities state to parent for proper management
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  // Fetch activities on component mount
  useEffect(() => {
    fetchActivities();
  }, []);

  // Debug activities state changes
  useEffect(() => {
    console.log('Activities state changed:', activities.length, 'activities');
  }, [activities]);

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError(null);
      console.log('Fetching activities...');
      const response = await activityService.getActivities();
      console.log('Activities API response:', response);
      if (response.success) {
        console.log('Setting activities:', response.data);
        setActivities(response.data);
      } else {
        console.error('Activities API error:', response.error);
        setActivitiesError(response.error || 'Failed to load activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivitiesError('Failed to load activities');
    } finally {
      setActivitiesLoading(false);
    }
  };


  const handleAddActivity = (leadId = null, type = 'note') => {
    setSelectedLeadId(leadId);
    setActivityType(type);
    setSelectedActivity(null);
    setShowActivityForm(true);
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setSelectedLeadId(activity.lead_id);
    setActivityType(activity.activity_type);
    setShowActivityForm(true);
  };

  const handleActivityClick = (activity) => {
    // Show activity detail modal
    setSelectedActivity(activity);
    setShowActivityDetail(true);
  };

  const handleCloseActivityDetail = () => {
    setShowActivityDetail(false);
    setSelectedActivity(null);
  };

  const handleEditFromDetail = (activity) => {
    // Close detail modal and open edit form
    setShowActivityDetail(false);
    setSelectedActivity(activity);
    setSelectedLeadId(activity.lead_id);
    setActivityType(activity.activity_type);
    setShowActivityForm(true);
  };

  const handleActivityFormSubmit = (activityData) => {
    // Activity was created/updated successfully - implement optimistic update
    console.log('handleActivityFormSubmit called with:', activityData);
    console.log('Current activities count:', activities.length);
    console.log('selectedActivity:', selectedActivity);
    
    if (selectedActivity) {
      // Update existing activity
      console.log('Updating existing activity');
      setActivities(prev => {
        const updated = prev.map(activity => 
          activity.id === activityData.id ? activityData : activity
        );
        console.log('Updated activities:', updated.length);
        return updated;
      });
    } else {
      // Add new activity to the top of the list (optimistic update)
      console.log('Adding new activity to list');
      setActivities(prev => {
        const newList = [activityData, ...prev];
        console.log('New activities count:', newList.length);
        return newList;
      });
    }
    
    // Close the form and reset state
    setShowActivityForm(false);
    setSelectedActivity(null);
    setSelectedLeadId(null);
  };

  const handleCloseActivityForm = () => {
    setShowActivityForm(false);
    setSelectedActivity(null);
    setSelectedLeadId(null);
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      console.log('Deleting activity:', activityId);
      const response = await activityService.deleteActivity(activityId);

      if (response.success) {
        // Remove the activity from the list
        setActivities(prev => prev.filter(activity => activity.id !== activityId));
        console.log('Activity deleted successfully');
      } else {
        console.error('Failed to delete activity:', response.error);
        alert('Failed to delete activity: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity');
    }
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
                onClick={() => handleAddActivity(selectedLeadId)}
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
              activities={activities}
              loading={activitiesLoading}
              error={activitiesError}
              onActivityClick={handleActivityClick}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              onRefresh={fetchActivities}
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

        {/* Activity Detail Modal */}
        {showActivityDetail && (
          <ActivityDetail
            isOpen={showActivityDetail}
            onClose={handleCloseActivityDetail}
            activity={selectedActivity}
            onEdit={handleEditFromDetail}
            onDelete={handleDeleteActivity}
          />
        )}
      </div>
    </div>
  );
};

export default Activities;
