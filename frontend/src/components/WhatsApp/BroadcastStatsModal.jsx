/**
 * Broadcast Stats Modal
 * Display detailed statistics for a broadcast
 */

import React from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const BroadcastStatsModal = ({ isOpen, onClose, broadcast, stats, loading }) => {
  if (!isOpen) return null;

  const statsData = stats || {
    total: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    pending: 0,
    skipped: 0
  };

  const successRate = statsData.total > 0
    ? ((statsData.sent + statsData.delivered + statsData.read) / statsData.total * 100).toFixed(1)
    : 0;

  const deliveryRate = statsData.sent > 0
    ? (statsData.delivered / statsData.sent * 100).toFixed(1)
    : 0;

  const readRate = statsData.delivered > 0
    ? (statsData.read / statsData.delivered * 100).toFixed(1)
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Broadcast Statistics</h3>
              {broadcast && (
                <p className="text-sm text-gray-600 mt-1">{broadcast.name}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Success Rate</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">{successRate}%</p>
                      </div>
                      <CheckCircleIcon className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Recipients</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">{statsData.total}</p>
                      </div>
                      <ClockIcon className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Message Status Breakdown</h4>
                  
                  <div className="space-y-2">
                    {/* Sent */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-700">Sent</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900">{statsData.sent}</span>
                        <span className="text-xs text-gray-500">
                          {statsData.total > 0 ? ((statsData.sent / statsData.total) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>

                    {/* Delivered */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-700">Delivered</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900">{statsData.delivered}</span>
                        <span className="text-xs text-gray-500">
                          Delivery: {deliveryRate}%
                        </span>
                      </div>
                    </div>

                    {/* Read */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-sm text-gray-700">Read</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900">{statsData.read}</span>
                        <span className="text-xs text-gray-500">
                          Read Rate: {readRate}%
                        </span>
                      </div>
                    </div>

                    {/* Failed */}
                    {statsData.failed > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3">
                          <XCircleIcon className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-700 font-medium">Failed</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-red-900">{statsData.failed}</span>
                          <span className="text-xs text-red-600">
                            {statsData.total > 0 ? ((statsData.failed / statsData.total) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Pending */}
                    {statsData.pending > 0 && (
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <ClockIcon className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-700 font-medium">Pending</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-yellow-900">{statsData.pending}</span>
                          <span className="text-xs text-yellow-600">
                            {statsData.total > 0 ? ((statsData.pending / statsData.total) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span>{successRate}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${successRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastStatsModal;

