import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import picklistService from '../services/picklistService';
import toast from 'react-hot-toast';

const PicklistContext = createContext();

const sanitizeOptions = (options = []) => {
  return options
    .map(option => ({
      ...option,
      metadata: option.metadata || {}
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
};

export const PicklistProvider = ({ children }) => {
  const [leadSources, setLeadSources] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLeadPicklists = useCallback(async ({ includeInactive = false, silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const data = await picklistService.getLeadPicklists({ includeInactive });
      setLeadSources(sanitizeOptions(data?.sources || []));
      setLeadStatuses(sanitizeOptions(data?.statuses || []));

      return data;
    } catch (err) {
      console.error('Failed to load lead picklists', err);
      setError(err?.message || 'Failed to load picklists');
      if (!silent) {
        toast.error('Failed to load picklist options');
      }
      throw err;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadLeadPicklists({ silent: true }).catch(() => {
      // Initial fetch errors are already handled via toast/logging
    });
  }, [loadLeadPicklists]);

  const refreshLeadPicklists = useCallback(() => loadLeadPicklists({ silent: false }), [loadLeadPicklists]);

  const displayLeadSources = useMemo(
    () => leadSources.filter(option => !option.metadata?.is_system),
    [leadSources]
  );

  const value = useMemo(() => ({
    leadSources,
    leadStatuses,
    leadSourcesDisplay: displayLeadSources,
    leadStatusesDisplay: leadStatuses,
    loading,
    error,
    refreshLeadPicklists,
    fetchLeadPicklists: loadLeadPicklists
  }), [leadSources, leadStatuses, displayLeadSources, loading, error, refreshLeadPicklists, loadLeadPicklists]);

  return (
    <PicklistContext.Provider value={value}>
      {children}
    </PicklistContext.Provider>
  );
};

export const usePicklists = () => {
  const context = useContext(PicklistContext);
  if (!context) {
    throw new Error('usePicklists must be used within a PicklistProvider');
  }
  return context;
};

export default PicklistContext;
