import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { AlertCircle, Zap } from 'lucide-react';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  const formatKey = (key = '') =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());

  const sourceMap = {
    gemini: { label: 'Gemini AI', className: 'bg-blue-100 text-blue-700' },
    fallback: { label: 'Fallback mode', className: 'bg-orange-100 text-orange-700' },
    system: { label: 'System', className: 'bg-gray-200 text-gray-700' }
  };

  const sourceMeta = message.meta?.source
    ? sourceMap[message.meta.source] || { label: formatKey(message.meta.source), className: 'bg-gray-200 text-gray-700' }
    : null;

  const parameterEntries = !isUser && message.parameters && typeof message.parameters === 'object'
    ? Object.entries(message.parameters).filter(([, value]) => value !== undefined && value !== null && value !== '')
    : [];

  const showPendingSummary = !isUser && message.data?.pending && parameterEntries.length > 0;

  // Format lead data if available
  const renderLeadData = (data) => {
    if (!data) return null;

    // Handle different data structures
    if (data.lead) {
      return renderSingleLead(data.lead);
    }

    if (data.leads && Array.isArray(data.leads)) {
      return renderLeadList(data.leads);
    }

    if (data.stats) {
      return renderStats(data.stats);
    }

    return null;
  };

  // Render single lead card
  const renderSingleLead = (lead) => (
    <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 text-base">{lead.name || `${lead.first_name} ${lead.last_name}`}</h4>
        <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
          {lead.status}
        </span>
      </div>
      <div className="space-y-2 text-sm text-gray-700">
        {lead.email && (
          <p className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {lead.email}
          </p>
        )}
        {lead.company && (
          <p className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {lead.company}
          </p>
        )}
        {lead.phone && (
          <p className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {lead.phone}
          </p>
        )}
      </div>
    </div>
  );

  // Render list of leads
  const renderLeadList = (leads) => {
    if (leads.length === 0) {
      return (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-600">
          No leads found
        </div>
      );
    }

    return (
      <div className="mt-3 space-y-3">
        {leads.slice(0, 5).map((lead, index) => (
          <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {lead.name || `${lead.first_name} ${lead.last_name}`}
                </p>
                <p className="text-xs text-gray-600 truncate mt-1">{lead.email}</p>
                {lead.company && <p className="text-xs text-gray-600 truncate mt-0.5">{lead.company}</p>}
              </div>
              <span className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>
          </div>
        ))}
        {leads.length > 5 && (
          <p className="text-xs text-gray-600 text-center mt-2">
            And {leads.length - 5} more...
          </p>
        )}
      </div>
    );
  };

  // Render statistics
  const renderStats = (stats) => (
    <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="font-semibold text-gray-900 mb-4 text-base">Lead Statistics</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-white rounded border border-blue-100">
          <p className="text-gray-600 text-xs font-medium">Total Leads</p>
          <p className="font-bold text-2xl text-blue-600 mt-2">{stats.total_leads || 0}</p>
        </div>
        <div className="p-3 bg-white rounded border border-green-100">
          <p className="text-gray-600 text-xs font-medium">Recent Leads</p>
          <p className="font-bold text-2xl text-green-600 mt-2">{stats.recent_leads || 0}</p>
        </div>
      </div>
      {stats.status_distribution && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-gray-600 font-medium mb-3 text-sm">By Status:</p>
          <div className="space-y-2">
            {Object.entries(stats.status_distribution).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm items-center">
                <span className="capitalize text-gray-700">{status}</span>
                <span className="font-semibold px-2 py-1 bg-white rounded text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-purple-100 text-purple-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      won: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3 mb-2`}>
      {!isUser && (
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">AI</AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-[85%]`}>
        <div className={`rounded-lg p-4 ${isUser ? 'bg-primary text-primary-foreground' : isError ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-card border'}`}>
          <p className="text-sm whitespace-pre-wrap break-words leading-loose">{message.content}</p>

          {/* Render data if available */}
          {!isUser && message.data && renderLeadData(message.data)}

          {!isUser && sourceMeta && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge variant="outline" className={`${sourceMeta.className} font-medium`}>
                {sourceMeta.label}
              </Badge>
              {message.meta?.model && message.meta.source === 'gemini' && (
                <span className="text-muted-foreground flex items-center gap-1 font-medium">
                  <Zap className="h-3 w-3" />
                  {message.meta.model}
                </span>
              )}
            </div>
          )}

          {!isUser && message.missingFields?.length > 0 && (
            <div className="mt-3 bg-muted border border-muted-foreground/20 text-muted-foreground text-xs rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Missing: {message.missingFields.join(', ')}</span>
            </div>
          )}

          {showPendingSummary && (
            <div className="mt-3 bg-muted border border-input rounded-lg p-4 text-xs">
              <p className="font-semibold text-foreground mb-3">Details to confirm</p>
              <ul className="space-y-2">
                {parameterEntries.map(([key, value]) => (
                  <li key={key} className="flex justify-between gap-3 items-center">
                    <span className="font-medium flex-shrink-0 text-foreground">{formatKey(key)}</span>
                    <span className="text-right text-muted-foreground truncate text-xs">{String(value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timestamp */}
          <p className={`text-xs mt-3 ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </p>
        </div>
      </div>

      {isUser && (
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;