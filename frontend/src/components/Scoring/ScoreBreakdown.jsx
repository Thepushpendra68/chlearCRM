import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import ScoreBadge from './ScoreBadge';
import { ClockIcon, TrophyIcon } from '../../utils/icons';
import axios from 'axios';

const ScoreBreakdown = ({ leadId, className = '' }) => {
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScoreBreakdown = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `/api/leads/${leadId}/score-breakdown`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          setBreakdown(response.data.data);
        } else {
          setError('Failed to fetch score breakdown');
        }
      } catch (err) {
        console.error('Error fetching score breakdown:', err);
        setError(err.response?.data?.message || 'Error fetching score breakdown');
      } finally {
        setLoading(false);
      }
    };

    if (leadId) {
      fetchScoreBreakdown();
    }
  }, [leadId]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="font-semibold">Error loading score breakdown</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return null;
  }

  const { current_score, events } = breakdown;

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyIcon className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Lead Score</h3>
          </div>
          <ScoreBadge score={current_score} size="lg" showLabel={true} />
        </div>
      </div>

      <div className="p-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Score History</h4>

        {events && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {event.reason}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <ClockIcon className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span
                    className={`text-sm font-semibold ${
                      event.points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {event.points > 0 ? '+' : ''}{event.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrophyIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">No scoring events yet</p>
            <p className="text-xs mt-1">
              Score will increase as the lead engages with activities
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreBreakdown;
