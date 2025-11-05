import { useState, useEffect } from 'react';
import emailService from '../services/emailService';
import { format } from 'date-fns';
import {
  ChartBarIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  CursorArrowRippleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const EmailAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [sentEmails, setSentEmails] = useState([]);
  const [stats, setStats] = useState({
    total_sent: 0,
    total_delivered: 0,
    total_opened: 0,
    total_clicked: 0,
    total_bounced: 0,
    delivery_rate: 0,
    open_rate: 0,
    click_rate: 0,
    bounce_rate: 0
  });
  
  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await emailService.getSentEmails({ limit: 100 });
      const emails = response.data || [];
      setSentEmails(emails);

      // Calculate stats
      const total_sent = emails.length;
      const total_delivered = emails.filter(e => e.status === 'delivered').length;
      const total_opened = emails.filter(e => e.opened_at).length;
      const total_clicked = emails.filter(e => e.clicked_at).length;
      const total_bounced = emails.filter(e => e.status === 'bounced').length;

      const delivery_rate = total_sent > 0 ? (total_delivered / total_sent) * 100 : 0;
      const open_rate = total_delivered > 0 ? (total_opened / total_delivered) * 100 : 0;
      const click_rate = total_opened > 0 ? (total_clicked / total_opened) * 100 : 0;
      const bounce_rate = total_sent > 0 ? (total_bounced / total_sent) * 100 : 0;

      setStats({
        total_sent,
        total_delivered,
        total_opened,
        total_clicked,
        total_bounced,
        delivery_rate: delivery_rate.toFixed(1),
        open_rate: open_rate.toFixed(1),
        click_rate: click_rate.toFixed(1),
        bounce_rate: bounce_rate.toFixed(1)
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (stats.total_sent === 0) {
      return;
    }

    try {
      setAiAnalyzing(true);
      const response = await emailService.aiAnalyzePerformance(
        {
          sent: stats.total_sent,
          delivered: stats.total_delivered,
          opened: stats.total_opened,
          clicked: stats.total_clicked,
          bounced: stats.total_bounced,
          delivery_rate: parseFloat(stats.delivery_rate),
          open_rate: parseFloat(stats.open_rate),
          click_rate: parseFloat(stats.click_rate),
          bounce_rate: parseFloat(stats.bounce_rate)
        },
        { name: 'Overall Campaign Performance' }
      );
      setAiAnalysis(response.data);
    } catch (error) {
      console.error('Error getting AI analysis:', error);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendUp }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Icon className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
            )}
            {trend}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ChartBarIcon className="h-8 w-8 mr-3 text-primary-600" />
              Email Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Track your email campaign performance
            </p>
          </div>
          {stats.total_sent > 0 && (
            <button
              onClick={handleAiAnalysis}
              disabled={aiAnalyzing}
              className="btn-primary flex items-center space-x-2"
            >
              <SparklesIcon className="h-5 w-5" />
              <span>{aiAnalyzing ? 'Analyzing...' : 'AI Insights'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Sent"
          value={stats.total_sent}
          icon={EnvelopeIcon}
        />
        <StatCard
          title="Delivered"
          value={stats.total_delivered}
          subtitle={`${stats.delivery_rate}% delivery rate`}
          icon={EnvelopeIcon}
        />
        <StatCard
          title="Opened"
          value={stats.total_opened}
          subtitle={`${stats.open_rate}% open rate`}
          icon={EnvelopeOpenIcon}
        />
        <StatCard
          title="Clicked"
          value={stats.total_clicked}
          subtitle={`${stats.click_rate}% click rate`}
          icon={CursorArrowRippleIcon}
        />
      </div>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-sm border-2 border-purple-200 p-6 mb-8">
          <div className="flex items-start space-x-3 mb-4">
            <LightBulbIcon className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                AI Performance Insights
              </h2>
              <p className="text-sm text-gray-700">
                Performance Level: <span className={`font-semibold capitalize ${
                  aiAnalysis.performance_level === 'excellent' ? 'text-green-700' :
                  aiAnalysis.performance_level === 'good' ? 'text-blue-700' :
                  aiAnalysis.performance_level === 'average' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {aiAnalysis.performance_level}
                </span>
                {aiAnalysis.overall_score && (
                  <span className="ml-2">• Score: {aiAnalysis.overall_score}/100</span>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                  <span className="mr-2">✓</span> What's Working Well
                </h3>
                <ul className="space-y-1">
                  {aiAnalysis.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h3 className="text-sm font-semibold text-orange-800 mb-2 flex items-center">
                  <span className="mr-2">!</span> Areas for Improvement
                </h3>
                <ul className="space-y-1">
                  {aiAnalysis.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-orange-600 mr-2">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
            <div className="mt-4 bg-white rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-3">
                📋 Action Recommendations
              </h3>
              <div className="space-y-3">
                {aiAnalysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="border-l-4 border-purple-400 pl-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{rec.area}</h4>
                        <p className="text-sm text-gray-700 mt-1">{rec.suggestion}</p>
                        {rec.expected_impact && (
                          <p className="text-xs text-purple-700 mt-1">
                            Expected Impact: {rec.expected_impact}
                          </p>
                        )}
                      </div>
                      <span className={`ml-3 px-2 py-1 rounded text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Insights */}
          {aiAnalysis.key_insights && aiAnalysis.key_insights.length > 0 && (
            <div className="mt-4 p-3 bg-purple-100 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">💡 Key Insights</h4>
              <ul className="space-y-1">
                {aiAnalysis.key_insights.map((insight, idx) => (
                  <li key={idx} className="text-sm text-purple-800">• {insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Performance Rates</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Open Rate</span>
                <span className="text-sm font-semibold text-gray-900">{stats.open_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(stats.open_rate, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Click Rate</span>
                <span className="text-sm font-semibold text-gray-900">{stats.click_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(stats.click_rate, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Bounce Rate</span>
                <span className="text-sm font-semibold text-gray-900">{stats.bounce_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${Math.min(stats.bounce_rate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 col-span-2">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Industry Benchmarks</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">20-25%</p>
              <p className="text-sm text-gray-600 mt-1">Avg. Open Rate</p>
              <p className="text-xs text-gray-500 mt-1">
                Your rate: <span className={stats.open_rate >= 20 ? 'text-green-600' : 'text-orange-600'}>
                  {stats.open_rate}%
                </span>
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">2-5%</p>
              <p className="text-sm text-gray-600 mt-1">Avg. Click Rate</p>
              <p className="text-xs text-gray-500 mt-1">
                Your rate: <span className={stats.click_rate >= 2 ? 'text-green-600' : 'text-orange-600'}>
                  {stats.click_rate}%
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Emails Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Emails</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opened
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicked
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sentEmails.slice(0, 20).map((email) => (
                <tr key={email.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{email.to_name || email.to_email}</div>
                    <div className="text-sm text-gray-500">{email.to_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 line-clamp-1">{email.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      email.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      email.status === 'bounced' ? 'bg-red-100 text-red-800' :
                      email.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {email.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(email.sent_at), 'MMM d, h:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {email.opened_at ? (
                      <span className="text-green-600 flex items-center">
                        <EnvelopeOpenIcon className="h-4 w-4 mr-1" />
                        {format(new Date(email.opened_at), 'MMM d, h:mm a')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {email.clicked_at ? (
                      <span className="text-blue-600 flex items-center">
                        <CursorArrowRippleIcon className="h-4 w-4 mr-1" />
                        {format(new Date(email.clicked_at), 'MMM d, h:mm a')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sentEmails.length === 0 && (
          <div className="text-center py-12">
            <EnvelopeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No emails sent yet</h3>
            <p className="text-gray-600">
              Start sending emails to see analytics here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailAnalytics;

