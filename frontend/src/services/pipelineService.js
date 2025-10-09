import api from './api';

class PipelineService {
  // Get all pipeline stages
  async getStages() {
    try {
      const response = await api.get('/pipeline/stages');
      return response.data;
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
      throw error;
    }
  }

  // Create new pipeline stage
  async createStage(stageData) {
    try {
      const response = await api.post('/pipeline/stages', stageData);
      return response.data;
    } catch (error) {
      console.error('Error creating pipeline stage:', error);
      throw error;
    }
  }

  // Update pipeline stage
  async updateStage(stageId, updateData) {
    try {
      const response = await api.put(`/pipeline/stages/${stageId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      throw error;
    }
  }

  // Delete pipeline stage
  async deleteStage(stageId) {
    try {
      const response = await api.delete(`/pipeline/stages/${stageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting pipeline stage:', error);
      throw error;
    }
  }

  // Reorder pipeline stages
  async reorderStages(stageOrders) {
    try {
      const response = await api.put('/pipeline/stages/reorder', { stageOrders });
      return response.data;
    } catch (error) {
      console.error('Error reordering pipeline stages:', error);
      throw error;
    }
  }

  // Get pipeline overview with lead counts
  async getPipelineOverview() {
    try {
      const response = await api.get('/pipeline/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching pipeline overview:', error);
      throw error;
    }
  }

  // Move lead to different stage
  async moveLeadToStage(leadId, stageId) {
    try {
      const response = await api.put(`/leads/${leadId}/move-stage`, { stage_id: stageId });
      return response.data;
    } catch (error) {
      console.error('Error moving lead to stage:', error);
      throw error;
    }
  }

  // Get conversion rates
  async getConversionRates() {
    try {
      const response = await api.get('/pipeline/conversion-rates');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversion rates:', error);
      throw error;
    }
  }

  // Create default pipeline stages
  async createDefaultStages() {
    try {
      const response = await api.post('/pipeline/create-default-stages');
      return response.data;
    } catch (error) {
      console.error('Error creating default stages:', error);
      throw error;
    }
  }
}

export default new PipelineService();
