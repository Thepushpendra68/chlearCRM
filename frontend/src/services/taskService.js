import api from './api';

class TaskService {
  /**
   * Get tasks with filters
   */
  async getTasks(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/tasks?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId) {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch task');
    }
  }

  /**
   * Create new task
   */
  async createTask(taskData) {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create task');
    }
  }

  /**
   * Update task
   */
  async updateTask(taskId, updateData) {
    try {
      const response = await api.put(`/tasks/${taskId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update task');
    }
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId) {
    try {
      const response = await api.put(`/tasks/${taskId}/complete`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to complete task');
    }
  }

  /**
   * Delete task
   */
  async deleteTask(taskId) {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete task');
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId = null) {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await api.get(`/tasks/overdue${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch overdue tasks');
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(userId = null) {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await api.get(`/tasks/stats${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch task statistics');
    }
  }

  /**
   * Get tasks by lead ID
   */
  async getTasksByLeadId(leadId) {
    try {
      const response = await api.get(`/tasks/lead/${leadId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch lead tasks');
    }
  }
}

export default new TaskService();
