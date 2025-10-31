import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import emailService from '../services/emailService';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PlusIcon,
  CheckIcon,
  EnvelopeIcon,
  ClockIcon,
  CodeBracketSquareIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

// Custom Node Components
const EmailNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-primary-500 min-w-[200px]">
    <div className="flex items-center space-x-2 mb-2">
      <EnvelopeIcon className="h-5 w-5 text-primary-600" />
      <div className="font-semibold text-sm">Send Email</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.template_name || 'Select template'}
    </div>
  </div>
);

const WaitNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-orange-500 min-w-[200px]">
    <div className="flex items-center space-x-2 mb-2">
      <ClockIcon className="h-5 w-5 text-orange-600" />
      <div className="font-semibold text-sm">Wait</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.wait_days || 0} day(s) {data.wait_hours || 0} hour(s)
    </div>
  </div>
);

const ConditionNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-purple-500 min-w-[200px]">
    <div className="flex items-center space-x-2 mb-2">
      <CodeBracketSquareIcon className="h-5 w-5 text-purple-600" />
      <div className="font-semibold text-sm">Condition</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.condition_field || 'Set condition'}
    </div>
  </div>
);

const TriggerNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-green-500 min-w-[200px]">
    <div className="flex items-center space-x-2 mb-2">
      <PlayIcon className="h-5 w-5 text-green-600" />
      <div className="font-semibold text-sm">Trigger</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.trigger_event || 'Lead enrolled'}
    </div>
  </div>
);

const nodeTypes = {
  email: EmailNode,
  wait: WaitNode,
  condition: ConditionNode,
  trigger: TriggerNode
};

const EmailSequenceBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  const [sequenceData, setSequenceData] = useState({
    name: '',
    description: '',
    is_active: false,
    trigger_event: 'lead_created'
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (!isNew) {
      fetchSequence();
    } else {
      // Initialize with trigger node
      const triggerNode = {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: { trigger_event: 'lead_created' }
      };
      setNodes([triggerNode]);
    }

    fetchTemplates();
  }, [id]);

  const fetchSequence = async () => {
    try {
      setLoading(true);
      const response = await emailService.getSequence(id);
      const sequence = response.data;

      setSequenceData({
        name: sequence.name,
        description: sequence.description || '',
        is_active: sequence.is_active,
        trigger_event: sequence.trigger_event || 'lead_created'
      });

      // Convert stored json_definition.steps to nodes
      const steps = sequence.json_definition?.steps || [];
      if (steps.length > 0) {
        convertStepsToFlow(steps);
      }
    } catch (error) {
      console.error('Error fetching sequence:', error);
      toast.error('Failed to load sequence');
      navigate('/app/email/sequences');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await emailService.getTemplates({ is_active: true });
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const convertStepsToFlow = (steps) => {
    const newNodes = [];
    const newEdges = [];
    let yPosition = 50;

    // Add trigger node
    newNodes.push({
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 250, y: yPosition },
      data: { trigger_event: sequenceData.trigger_event }
    });

    let previousNodeId = 'trigger-1';
    yPosition += 120;

    steps.forEach((step, index) => {
      const nodeId = `step-${index + 1}`;
      let nodeType = 'email';
      let nodeData = {};

      if (step.action_type === 'send_email') {
        nodeType = 'email';
        nodeData = {
          template_id: step.template_id,
          template_name: step.template_name || 'Email'
        };
      } else if (step.action_type === 'wait') {
        nodeType = 'wait';
        nodeData = {
          wait_days: step.wait_days || 0,
          wait_hours: step.wait_hours || 0
        };
      } else if (step.condition_field) {
        nodeType = 'condition';
        nodeData = {
          condition_field: step.condition_field,
          condition_operator: step.condition_operator,
          condition_value: step.condition_value
        };
      }

      newNodes.push({
        id: nodeId,
        type: nodeType,
        position: { x: 250, y: yPosition },
        data: nodeData
      });

      newEdges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed }
      });

      previousNodeId = nodeId;
      yPosition += 120;
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const convertFlowToSteps = () => {
    // Sort nodes by position
    const sortedNodes = [...nodes]
      .filter(n => n.type !== 'trigger')
      .sort((a, b) => a.position.y - b.position.y);

    const steps = sortedNodes.map((node, index) => {
      const step = {
        step_order: index + 1
      };

      if (node.type === 'email') {
        step.action_type = 'send_email';
        step.template_id = node.data.template_id;
      } else if (node.type === 'wait') {
        step.action_type = 'wait';
        step.wait_days = node.data.wait_days || 0;
        step.wait_hours = node.data.wait_hours || 0;
      } else if (node.type === 'condition') {
        step.condition_field = node.data.condition_field;
        step.condition_operator = node.data.condition_operator;
        step.condition_value = node.data.condition_value;
      }

      return step;
    });

    return steps;
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed }
    }, eds)),
    [setEdges]
  );

  const addNode = (type) => {
    const newNodeId = `${type}-${Date.now()}`;
    const lastNode = nodes[nodes.length - 1];
    const yPos = lastNode ? lastNode.position.y + 120 : 170;

    const newNode = {
      id: newNodeId,
      type,
      position: { x: 250, y: yPos },
      data: type === 'email' ? { template_id: null, template_name: null }
        : type === 'wait' ? { wait_days: 1, wait_hours: 0 }
        : { condition_field: '', condition_operator: 'equals', condition_value: '' }
    };

    setNodes((nds) => [...nds, newNode]);

    // Auto-connect to previous node
    if (lastNode) {
      const newEdge = {
        id: `edge-${lastNode.id}-${newNodeId}`,
        source: lastNode.id,
        target: newNodeId,
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed }
      };
      setEdges((eds) => [...eds, newEdge]);
    }
  };

  const handleNodeClick = (event, node) => {
    if (node.type !== 'trigger') {
      setSelectedNode(node);
    }
  };

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  const handleSave = async () => {
    if (!sequenceData.name) {
      toast.error('Sequence name is required');
      return;
    }

    const steps = convertFlowToSteps();

    if (steps.length === 0) {
      toast.error('Add at least one step to the sequence');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...sequenceData,
        json_definition: { steps }
      };

      if (isNew) {
        await emailService.createSequence(payload);
        toast.success('Sequence created successfully!');
      } else {
        await emailService.updateSequence(id, payload);
        toast.success('Sequence updated successfully!');
      }

      navigate('/app/email/sequences');
    } catch (error) {
      console.error('Error saving sequence:', error);
      toast.error(error.response?.data?.message || 'Failed to save sequence');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/app/email/sequences');
                }
              }}
              className="btn-secondary"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isNew ? 'New Email Sequence' : 'Edit Email Sequence'}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              {saving ? 'Saving...' : 'Save Sequence'}
            </button>
          </div>
        </div>

        {/* Sequence Info */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Sequence Name *"
            value={sequenceData.name}
            onChange={(e) => setSequenceData({ ...sequenceData, name: e.target.value })}
            className="input"
          />
          <input
            type="text"
            placeholder="Description"
            value={sequenceData.description}
            onChange={(e) => setSequenceData({ ...sequenceData, description: e.target.value })}
            className="input"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Add Step</h3>
          <div className="space-y-2">
            <button
              onClick={() => addNode('email')}
              className="w-full btn-secondary justify-start"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Send Email
            </button>
            <button
              onClick={() => addNode('wait')}
              className="w-full btn-secondary justify-start"
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              Wait
            </button>
            <button
              onClick={() => addNode('condition')}
              className="w-full btn-secondary justify-start"
            >
              <CodeBracketSquareIcon className="h-5 w-5 mr-2" />
              Condition
            </button>
          </div>

          {/* Node Editor */}
          {selectedNode && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Edit Step</h3>
                <button
                  onClick={() => deleteNode(selectedNode.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>

              {selectedNode.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Template
                  </label>
                  <select
                    value={selectedNode.data.template_id || ''}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === e.target.value);
                      updateNodeData(selectedNode.id, {
                        template_id: e.target.value,
                        template_name: template?.name || 'Email'
                      });
                    }}
                    className="input"
                  >
                    <option value="">Select template</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedNode.type === 'wait' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Days
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={selectedNode.data.wait_days || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { wait_days: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={selectedNode.data.wait_hours || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { wait_hours: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'condition' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field
                    </label>
                    <select
                      value={selectedNode.data.condition_field || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { condition_field: e.target.value })}
                      className="input"
                    >
                      <option value="">Select field</option>
                      <option value="status">Lead Status</option>
                      <option value="priority">Priority</option>
                      <option value="deal_value">Deal Value</option>
                      <option value="source">Source</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operator
                    </label>
                    <select
                      value={selectedNode.data.condition_operator || 'equals'}
                      onChange={(e) => updateNodeData(selectedNode.id, { condition_operator: e.target.value })}
                      className="input"
                    >
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Value
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.condition_value || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { condition_value: e.target.value })}
                      className="input"
                      placeholder="Enter value"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default EmailSequenceBuilder;
