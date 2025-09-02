const assignmentService = require('../services/assignmentService');
const routingService = require('../services/routingService');
const ApiError = require('../utils/ApiError');

class AssignmentController {
  // Get all assignment rules
  async getRules(req, res, next) {
    try {
      const result = await assignmentService.getAllRules();
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Get active assignment rules
  async getActiveRules(req, res, next) {
    try {
      const result = await assignmentService.getActiveRules();
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Get assignment rule by ID
  async getRuleById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await assignmentService.getRuleById(id);
      
      if (!result.success) {
        throw new ApiError(404, result.error);
      }
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new assignment rule
  async createRule(req, res, next) {
    try {
      const ruleData = req.body;
      const result = await assignmentService.createRule(ruleData);
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Assignment rule created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update assignment rule
  async updateRule(req, res, next) {
    try {
      const { id } = req.params;
      const ruleData = req.body;
      const result = await assignmentService.updateRule(id, ruleData);
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        data: result.data,
        message: 'Assignment rule updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete assignment rule
  async deleteRule(req, res, next) {
    try {
      const { id } = req.params;
      const result = await assignmentService.deleteRule(id);
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  // Assign lead manually
  async assignLead(req, res, next) {
    try {
      const { leadId } = req.params;
      const { assignedTo, reason } = req.body;
      const assignedBy = req.user.id; // From auth middleware
      
      if (!assignedTo) {
        throw new ApiError(400, 'assignedTo is required');
      }
      
      const result = await assignmentService.assignLead(leadId, assignedTo, assignedBy, reason);
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk assign leads
  async bulkAssignLeads(req, res, next) {
    try {
      const { leadIds, assignedTo, reason } = req.body;
      const assignedBy = req.user.id; // From auth middleware
      
      if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        throw new ApiError(400, 'leadIds array is required');
      }
      
      if (!assignedTo) {
        throw new ApiError(400, 'assignedTo is required');
      }
      
      const result = await assignmentService.bulkAssignLeads(leadIds, assignedTo, assignedBy, reason);
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        message: result.message,
        results: result.results
      });
    } catch (error) {
      next(error);
    }
  }

  // Get assignment history for a lead
  async getLeadAssignmentHistory(req, res, next) {
    try {
      const { leadId } = req.params;
      const result = await assignmentService.getLeadAssignmentHistory(leadId);
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Get team workload distribution
  async getTeamWorkload(req, res, next) {
    try {
      const result = await assignmentService.getTeamWorkload();
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Redistribute leads based on workload
  async redistributeLeads(req, res, next) {
    try {
      const assignedBy = req.user.id; // From auth middleware
      const result = await assignmentService.redistributeLeads(assignedBy);
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        message: result.message,
        results: result.results
      });
    } catch (error) {
      next(error);
    }
  }

  // Get assignment statistics
  async getAssignmentStats(req, res, next) {
    try {
      const result = await assignmentService.getAssignmentStats();
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Auto-assign lead
  async autoAssignLead(req, res, next) {
    try {
      const { leadId } = req.params;
      const assignedBy = req.user.id; // From auth middleware
      
      const result = await routingService.autoAssignLead(leadId, assignedBy);
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        message: result.message,
        assignedTo: result.assignedTo,
        rule: result.rule
      });
    } catch (error) {
      next(error);
    }
  }

  // Process bulk auto-assignment
  async processBulkAutoAssignment(req, res, next) {
    try {
      const { leadIds } = req.body;
      const assignedBy = req.user.id; // From auth middleware
      
      if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        throw new ApiError(400, 'leadIds array is required');
      }
      
      const result = await routingService.processBulkAutoAssignment(leadIds, assignedBy);
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        message: result.message,
        results: result.results
      });
    } catch (error) {
      next(error);
    }
  }

  // Get assignment recommendations for a lead
  async getAssignmentRecommendations(req, res, next) {
    try {
      const { leadId } = req.params;
      const result = await routingService.getAssignmentRecommendations(leadId);
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Get routing statistics
  async getRoutingStats(req, res, next) {
    try {
      const result = await routingService.getRoutingStats();
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  // Reassign lead
  async reassignLead(req, res, next) {
    try {
      const { leadId } = req.params;
      const { newAssignedTo, reason } = req.body;
      const assignedBy = req.user.id; // From auth middleware
      
      if (!newAssignedTo) {
        throw new ApiError(400, 'newAssignedTo is required');
      }
      
      const result = await routingService.reassignLead(leadId, newAssignedTo, assignedBy, reason);
      
      if (!result.success) {
        throw new ApiError(400, result.error);
      }
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssignmentController();
