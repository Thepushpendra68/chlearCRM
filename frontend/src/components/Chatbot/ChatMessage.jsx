import { formatDistanceToNow } from 'date-fns';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

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
    <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{lead.name || `${lead.first_name} ${lead.last_name}`}</h4>
        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(lead.status)}`}>
          {lead.status}
        </span>
      </div>
      <div className="space-y-1 text-sm text-gray-700">
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
        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 text-center text-gray-600">
          No leads found
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        {leads.slice(0, 5).map((lead, index) => (
          <div key={index} className="p-2 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">
                  {lead.name || `${lead.first_name} ${lead.last_name}`}
                </p>
                <p className="text-xs text-gray-600">{lead.email}</p>
                {lead.company && <p className="text-xs text-gray-600">{lead.company}</p>}
              </div>
              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(lead.status)}`}>
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
    <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
      <h4 className="font-semibold text-gray-900 mb-2">Lead Statistics</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-600">Total Leads</p>
          <p className="font-bold text-lg text-blue-600">{stats.total_leads || 0}</p>
        </div>
        <div>
          <p className="text-gray-600">Recent Leads</p>
          <p className="font-bold text-lg text-green-600">{stats.recent_leads || 0}</p>
        </div>
      </div>
      {stats.status_distribution && (
        <div className="mt-3">
          <p className="text-gray-600 font-medium mb-1">By Status:</p>
          <div className="space-y-1">
            {Object.entries(stats.status_distribution).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span className="capitalize">{status}</span>
                <span className="font-medium">{count}</span>
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start space-x-2`}>
      {!isUser && (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? 'bg-blue-600 text-white' : isError ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-white text-gray-800'} rounded-lg p-3 shadow-sm`}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {/* Render data if available */}
        {!isUser && message.data && renderLeadData(message.data)}

        {/* Timestamp */}
        <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </p>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;