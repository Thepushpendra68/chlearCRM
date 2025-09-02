import React, { useState, useEffect } from 'react';
import pipelineService from '../../services/pipelineService';

const StageManager = ({ isOpen, onClose, onStagesUpdated }) => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingStage, setEditingStage] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    order_position: 1
  });

  useEffect(() => {
    if (isOpen) {
      fetchStages();
    }
  }, [isOpen]);

  const fetchStages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pipelineService.getStages();
      if (response.success) {
        setStages(response.data);
      }
    } catch (err) {
      console.error('Error fetching stages:', err);
      setError('Failed to load pipeline stages');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order_position' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      let response;
      if (editingStage) {
        response = await pipelineService.updateStage(editingStage.id, formData);
      } else {
        response = await pipelineService.createStage(formData);
      }

      if (response.success) {
        await fetchStages();
        setEditingStage(null);
        setShowAddForm(false);
        setFormData({ name: '', color: '#3B82F6', order_position: 1 });
        if (onStagesUpdated) {
          onStagesUpdated();
        }
      } else {
        setError(response.error || 'Failed to save stage');
      }
    } catch (err) {
      console.error('Error saving stage:', err);
      setError('Failed to save stage');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stage) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      color: stage.color,
      order_position: stage.order_position
    });
    setShowAddForm(true);
  };

  const handleDelete = async (stage) => {
    if (!window.confirm(`Are you sure you want to delete the "${stage.name}" stage?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await pipelineService.deleteStage(stage.id);
      
      if (response.success) {
        await fetchStages();
        if (onStagesUpdated) {
          onStagesUpdated();
        }
      } else {
        setError(response.error || 'Failed to delete stage');
      }
    } catch (err) {
      console.error('Error deleting stage:', err);
      setError('Failed to delete stage');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (dragIndex, hoverIndex) => {
    const draggedStage = stages[dragIndex];
    const newStages = [...stages];
    newStages.splice(dragIndex, 1);
    newStages.splice(hoverIndex, 0, draggedStage);

    // Update order positions
    const stageOrders = newStages.map((stage, index) => ({
      id: stage.id,
      order_position: index + 1
    }));

    try {
      setLoading(true);
      setError(null);
      const response = await pipelineService.reorderStages(stageOrders);
      
      if (response.success) {
        setStages(response.data);
        if (onStagesUpdated) {
          onStagesUpdated();
        }
      } else {
        setError(response.error || 'Failed to reorder stages');
      }
    } catch (err) {
      console.error('Error reordering stages:', err);
      setError('Failed to reorder stages');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingStage(null);
    setShowAddForm(false);
    setFormData({ name: '', color: '#3B82F6', order_position: stages.length + 1 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Manage Pipeline Stages</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingStage ? 'Edit Stage' : 'Add New Stage'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stage Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Position
                    </label>
                    <input
                      type="number"
                      name="order_position"
                      value={formData.order_position}
                      onChange={handleInputChange}
                      min="1"
                      max={stages.length + 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingStage ? 'Update' : 'Create')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stages List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Pipeline Stages</h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Stage
              </button>
            </div>

            {loading && !showAddForm ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="text-sm font-medium text-gray-900">{stage.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>Position: {stage.order_position}</span>
                        {stage.is_won && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Won</span>}
                        {stage.is_lost && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Lost</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(stage)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(stage)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageManager;
