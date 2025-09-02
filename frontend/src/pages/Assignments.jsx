import React, { useState, useEffect } from 'react';
import RuleBuilder from '../components/Assignment/RuleBuilder';
import WorkloadDashboard from '../components/Assignment/WorkloadDashboard';
import BulkAssignment from '../components/Assignment/BulkAssignment';
import AssignmentHistory from '../components/Assignment/AssignmentHistory';
import Modal from '../components/Modal';

const Assignments = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [showWorkloadDashboard, setShowWorkloadDashboard] = useState(false);
  const [showAssignmentHistory, setShowAssignmentHistory] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const tabs = [
    { id: 'rules', label: 'Assignment Rules', icon: '⚙️' },
    { id: 'workload', label: 'Team Workload', icon: '📊' },
    { id: 'bulk', label: 'Bulk Assignment', icon: '📦' },
    { id: 'history', label: 'Assignment History', icon: '📋' }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleOpenRuleBuilder = () => {
    setShowRuleBuilder(true);
  };

  const handleCloseRuleBuilder = () => {
    setShowRuleBuilder(false);
  };

  const handleOpenBulkAssignment = () => {
    setShowBulkAssignment(true);
  };

  const handleCloseBulkAssignment = () => {
    setShowBulkAssignment(false);
  };

  const handleOpenWorkloadDashboard = () => {
    setShowWorkloadDashboard(true);
  };

  const handleCloseWorkloadDashboard = () => {
    setShowWorkloadDashboard(false);
  };

  const handleOpenAssignmentHistory = (leadId = null) => {
    setSelectedLeadId(leadId);
    setShowAssignmentHistory(true);
  };

  const handleCloseAssignmentHistory = () => {
    setShowAssignmentHistory(false);
    setSelectedLeadId(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'rules':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Assignment Rules</h2>
                <p className="text-gray-600 mt-1">Configure automatic lead assignment rules</p>
              </div>
              <button
                onClick={handleOpenRuleBuilder}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Rule
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Active Rules</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Rules are evaluated in priority order (highest first)
                </p>
              </div>
              <div className="p-6">
                <RuleBuilder isReadOnly={true} />
              </div>
            </div>
          </div>
        );

      case 'workload':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Team Workload</h2>
                <p className="text-gray-600 mt-1">Monitor lead distribution across team members</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleOpenWorkloadDashboard}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  View Dashboard
                </button>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Workload Overview</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Current lead distribution and team performance
                </p>
              </div>
              <div className="p-6">
                <WorkloadDashboard isEmbedded={true} />
              </div>
            </div>
          </div>
        );

      case 'bulk':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bulk Assignment</h2>
                <p className="text-gray-600 mt-1">Assign multiple leads at once</p>
              </div>
              <button
                onClick={handleOpenBulkAssignment}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Bulk Assign
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Bulk Operations</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Perform bulk assignment operations on multiple leads
                </p>
              </div>
              <div className="p-6">
                <BulkAssignment isEmbedded={true} />
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Assignment History</h2>
                <p className="text-gray-600 mt-1">Track all lead assignment changes</p>
              </div>
              <button
                onClick={() => handleOpenAssignmentHistory()}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                View All History
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Assignments</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Latest assignment changes across all leads
                </p>
              </div>
              <div className="p-6">
                <AssignmentHistory isEmbedded={true} />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="assignments-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lead Assignment & Routing</h1>
          <p className="text-gray-600 mt-2">
            Manage automatic lead assignment rules, monitor team workload, and track assignment history
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* Modals */}
      {showRuleBuilder && (
        <Modal
          isOpen={showRuleBuilder}
          onClose={handleCloseRuleBuilder}
          title="Assignment Rule Builder"
          size="xl"
        >
          <RuleBuilder onClose={handleCloseRuleBuilder} />
        </Modal>
      )}

      {showBulkAssignment && (
        <Modal
          isOpen={showBulkAssignment}
          onClose={handleCloseBulkAssignment}
          title="Bulk Assignment"
          size="lg"
        >
          <BulkAssignment onClose={handleCloseBulkAssignment} />
        </Modal>
      )}

      {showWorkloadDashboard && (
        <Modal
          isOpen={showWorkloadDashboard}
          onClose={handleCloseWorkloadDashboard}
          title="Team Workload Dashboard"
          size="xl"
        >
          <WorkloadDashboard onClose={handleCloseWorkloadDashboard} />
        </Modal>
      )}

      {showAssignmentHistory && (
        <Modal
          isOpen={showAssignmentHistory}
          onClose={handleCloseAssignmentHistory}
          title={selectedLeadId ? "Lead Assignment History" : "All Assignment History"}
          size="lg"
        >
          <AssignmentHistory 
            leadId={selectedLeadId}
            onClose={handleCloseAssignmentHistory}
          />
        </Modal>
      )}
    </div>
  );
};

export default Assignments;
