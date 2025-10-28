import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef } from 'react';
import leadService from '../services/leadService';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  leads: [],
  loading: false,
  error: null,
  lastUpdated: null,
  pagination: {
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20,
    has_next: false,
    has_prev: false
  }
};

// Action types
const LEAD_ACTIONS = {
  FETCH_LEADS_START: 'FETCH_LEADS_START',
  FETCH_LEADS_SUCCESS: 'FETCH_LEADS_SUCCESS',
  FETCH_LEADS_ERROR: 'FETCH_LEADS_ERROR',
  UPDATE_LEAD: 'UPDATE_LEAD',
  ADD_LEAD: 'ADD_LEAD',
  DELETE_LEAD: 'DELETE_LEAD',
  REFRESH_LEADS: 'REFRESH_LEADS'
};

// Reducer
const leadReducer = (state, action) => {
  switch (action.type) {
    case LEAD_ACTIONS.FETCH_LEADS_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case LEAD_ACTIONS.FETCH_LEADS_SUCCESS:
      return {
        ...state,
        leads: action.payload.leads || action.payload,
        pagination: action.payload.pagination || state.pagination,
        loading: false,
        error: null,
        lastUpdated: new Date()
      };
    
    case LEAD_ACTIONS.FETCH_LEADS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case LEAD_ACTIONS.UPDATE_LEAD:
      return {
        ...state,
        leads: state.leads.map(lead => 
          lead.id === action.payload.id ? { ...lead, ...action.payload } : lead
        ),
        lastUpdated: new Date()
      };
    
    case LEAD_ACTIONS.ADD_LEAD:
      // Check if lead already exists to prevent duplicates
      const existingLead = state.leads.find(lead => lead.id === action.payload.id);
      if (existingLead) {
        // If lead exists, update it instead of adding
        return {
          ...state,
          leads: state.leads.map(lead =>
            lead.id === action.payload.id ? { ...lead, ...action.payload } : lead
          ),
          lastUpdated: new Date()
        };
      }
      // If lead doesn't exist, add it
      return {
        ...state,
        leads: [action.payload, ...state.leads],
        lastUpdated: new Date()
      };
    
    case LEAD_ACTIONS.DELETE_LEAD:
      return {
        ...state,
        leads: state.leads.filter(lead => lead.id !== action.payload),
        lastUpdated: new Date()
      };
    
    case LEAD_ACTIONS.REFRESH_LEADS:
      return {
        ...state,
        lastUpdated: new Date()
      };
    
    default:
      return state;
  }
};

// Create context
const LeadContext = createContext();

// Provider component
export const LeadProvider = ({ children }) => {
  const [state, dispatch] = useReducer(leadReducer, initialState);
  const lastFetchParamsRef = useRef({
    page: 1,
    limit: initialState.pagination.items_per_page
  });

  // Fetch leads function
  const fetchLeads = useCallback(async (params = {}) => {
    try {
      dispatch({ type: LEAD_ACTIONS.FETCH_LEADS_START });
      const mergedParams = {
        ...lastFetchParamsRef.current,
        ...params
      };

      if (!mergedParams.page || mergedParams.page < 1) {
        mergedParams.page = 1;
      }

      if (!mergedParams.limit || mergedParams.limit < 1) {
        mergedParams.limit = initialState.pagination.items_per_page;
      }

      const response = await leadService.getLeads(mergedParams);

      // Handle response with pagination metadata
      const payload = {
        leads: response.data || [],
        pagination: response.pagination || {
          current_page: mergedParams.page,
          total_pages: 1,
          total_items: (response.data || []).length,
          items_per_page: mergedParams.limit,
          has_next: false,
          has_prev: mergedParams.page > 1
        }
      };

      dispatch({
        type: LEAD_ACTIONS.FETCH_LEADS_SUCCESS,
        payload
      });

      lastFetchParamsRef.current = {
        ...mergedParams,
        page: payload.pagination.current_page,
        limit: payload.pagination.items_per_page
      };

      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      dispatch({
        type: LEAD_ACTIONS.FETCH_LEADS_ERROR,
        payload: error.message || 'Failed to fetch leads'
      });
      toast.error('Failed to load leads');
      throw error;
    }
  }, []);

  // Update lead function
  const updateLead = useCallback((leadData) => {
    dispatch({ 
      type: LEAD_ACTIONS.UPDATE_LEAD, 
      payload: leadData 
    });
  }, []);

  // Add lead function
  const addLead = useCallback((leadData) => {
    dispatch({ 
      type: LEAD_ACTIONS.ADD_LEAD, 
      payload: leadData 
    });
  }, []);

  // Delete lead function
  const deleteLead = useCallback((leadId) => {
    dispatch({ 
      type: LEAD_ACTIONS.DELETE_LEAD, 
      payload: leadId 
    });
  }, []);

  // Refresh leads function
  const refreshLeads = useCallback(() => {
    dispatch({ type: LEAD_ACTIONS.REFRESH_LEADS });
    return fetchLeads(lastFetchParamsRef.current);
  }, [fetchLeads]);

  // Move lead to stage function (for pipeline)
  const moveLeadToStage = useCallback((leadId, stageId) => {
    dispatch({
      type: LEAD_ACTIONS.UPDATE_LEAD,
      payload: {
        id: leadId,
        pipeline_stage_id: stageId,
        updated_at: new Date().toISOString()
      }
    });
  }, []);

  // Context value
  const value = useMemo(() => ({
    ...state,
    fetchLeads,
    updateLead,
    addLead,
    deleteLead,
    refreshLeads,
    moveLeadToStage
  }), [state, fetchLeads, updateLead, addLead, deleteLead, refreshLeads, moveLeadToStage]);

  return (
    <LeadContext.Provider value={value}>
      {children}
    </LeadContext.Provider>
  );
};

// Custom hook to use the lead context
export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
};

export default LeadContext;
