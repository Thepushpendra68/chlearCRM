import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import emailService from '../services/emailService';
import userService from '../services/userService';
import pipelineService from '../services/pipelineService';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PlusIcon,
  CheckIcon,
  EnvelopeIcon,
  ClockIcon,
  CodeBracketSquareIcon,
  PlayIcon,
  CheckCircleIcon,
  UserIcon,
  DocumentTextIcon,
  TagIcon,
  StopCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

// Custom Node Components
const EmailNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-primary-500 min-w-[200px] relative">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-primary-500 !border-2 !border-white" />
    <div className="flex items-center space-x-2 mb-2">
      <EnvelopeIcon className="h-5 w-5 text-primary-600" />
      <div className="font-semibold text-sm">Send Email</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.template_name || 'Select template'}
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-primary-500 !border-2 !border-white" />
  </div>
);

const WaitNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-orange-500 min-w-[200px] relative">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-orange-500 !border-2 !border-white" />
    <div className="flex items-center space-x-2 mb-2">
      <ClockIcon className="h-5 w-5 text-orange-600" />
      <div className="font-semibold text-sm">Wait</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.wait_days || 0} day(s) {data.wait_hours || 0} hour(s)
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-orange-500 !border-2 !border-white" />
  </div>
);

const ConditionNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-purple-500 min-w-[200px] relative">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-purple-500 !border-2 !border-white" />
    <div className="flex items-center space-x-2 mb-2">
      <CodeBracketSquareIcon className="h-5 w-5 text-purple-600" />
      <div className="font-semibold text-sm">Condition</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.condition_field || 'Set condition'}
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-purple-500 !border-2 !border-white" />
  </div>
);

const TriggerNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-green-500 min-w-[200px] relative">
    <div className="flex items-center space-x-2 mb-2">
      <PlayIcon className="h-5 w-5 text-green-600" />
      <div className="font-semibold text-sm">Trigger</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.trigger_event || 'Lead enrolled'}
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-green-500 !border-2 !border-white" />
  </div>
);

const TaskNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-blue-500 min-w-[200px] relative">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500 !border-2 !border-white" />
    <div className="flex items-center space-x-2 mb-2">
      <CheckCircleIcon className="h-5 w-5 text-blue-600" />
      <div className="font-semibold text-sm">Create Task</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.task_description || 'Set task description'}
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500 !border-2 !border-white" />
  </div>
);

const UpdateFieldNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-teal-500 min-w-[200px] relative">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-teal-500 !border-2 !border-white" />
    <div className="flex items-center space-x-2 mb-2">
      <ArrowPathIcon className="h-5 w-5 text-teal-600" />
      <div className="font-semibold text-sm">Update Field</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.update_field ? `${data.update_field} = ${data.update_value}` : 'Select field'}
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-teal-500 !border-2 !border-white" />
  </div>
);

const AssignNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-indigo-500 min-w-[200px] relative">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-indigo-500 !border-2 !border-white" />
    <div className="flex items-center space-x-2 mb-2">
      <UserIcon className="h-5 w-5 text-indigo-600" />
      <div className="font-semibold text-sm">Assign to User</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.user_name || 'Select user'}
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-indigo-500 !border-2 !border-white" />
  </div>
);

const ActivityNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-amber-500 min-w-[200px] relative">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-amber-500 !border-2 !border-white" />
    <div className="flex items-center space-x-2 mb-2">
      <DocumentTextIcon className="h-5 w-5 text-amber-600" />
      <div className="font-semibold text-sm">Log Activity</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.activity_type || 'Select type'}
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-amber-500 !border-2 !border-white" />
  </div>
);

const MoveStageNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-pink-500 min-w-[200px] relative">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-pink-500 !border-2 !border-white" />
    <div className="flex items-center space-x-2 mb-2">
      <TagIcon className="h-5 w-5 text-pink-600" />
      <div className="font-semibold text-sm">Move to Stage</div>
    </div>
    <div className="text-xs text-gray-600">
      {data.stage_name || 'Select stage'}
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-pink-500 !border-2 !border-white" />
  </div>
);

const StopNode = ({ data }) => (
  <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-red-500 min-w-[200px] relative">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-red-500 !border-2 !border-white" />
    <div className="flex items-center space-x-2 mb-2">
      <StopCircleIcon className="h-5 w-5 text-red-600" />
      <div className="font-semibold text-sm">Stop Sequence</div>
    </div>
    <div className="text-xs text-gray-600">
      End workflow
    </div>
  </div>
);

const nodeTypes = {
  email: EmailNode,
  wait: WaitNode,
  condition: ConditionNode,
  trigger: TriggerNode,
  task: TaskNode,
  updateField: UpdateFieldNode,
  assign: AssignNode,
  activity: ActivityNode,
  moveStage: MoveStageNode,
  stop: StopNode
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
  const [users, setUsers] = useState([]);
  const [stages, setStages] = useState([]);

  // AI Features
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [aiLeadType, setAiLeadType] = useState('prospect');
  const [aiSequenceLength, setAiSequenceLength] = useState(5);

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
    fetchUsers();
    fetchStages();
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

  const fetchUsers = async () => {
    try {
      const response = await userService.getActiveUsers();
      setUsers(response.data || response || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStages = async () => {
    try {
      const response = await pipelineService.getStages();
      setStages(response.data || response || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
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
      } else if (step.action_type === 'create_task') {
        nodeType = 'task';
        nodeData = {
          task_description: step.task_description || '',
          task_priority: step.task_priority || 'medium',
          task_due_days: step.task_due_days || 0
        };
      } else if (step.action_type === 'update_field') {
        nodeType = 'updateField';
        nodeData = {
          update_field: step.update_field || '',
          update_value: step.update_value || ''
        };
      } else if (step.action_type === 'assign_user') {
        nodeType = 'assign';
        nodeData = {
          user_id: step.user_id || '',
          user_name: step.user_name || ''
        };
      } else if (step.action_type === 'log_activity') {
        nodeType = 'activity';
        nodeData = {
          activity_type: step.activity_type || 'note',
          activity_description: step.activity_description || ''
        };
      } else if (step.action_type === 'move_stage') {
        nodeType = 'moveStage';
        nodeData = {
          stage_id: step.stage_id || '',
          stage_name: step.stage_name || ''
        };
      } else if (step.action_type === 'stop') {
        nodeType = 'stop';
        nodeData = {};
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
      } else if (node.type === 'task') {
        step.action_type = 'create_task';
        step.task_description = node.data.task_description;
        step.task_priority = node.data.task_priority || 'medium';
        step.task_due_days = node.data.task_due_days || 0;
      } else if (node.type === 'updateField') {
        step.action_type = 'update_field';
        step.update_field = node.data.update_field;
        step.update_value = node.data.update_value;
      } else if (node.type === 'assign') {
        step.action_type = 'assign_user';
        step.user_id = node.data.user_id;
        step.user_name = node.data.user_name;
      } else if (node.type === 'activity') {
        step.action_type = 'log_activity';
        step.activity_type = node.data.activity_type;
        step.activity_description = node.data.activity_description;
      } else if (node.type === 'moveStage') {
        step.action_type = 'move_stage';
        step.stage_id = node.data.stage_id;
        step.stage_name = node.data.stage_name;
      } else if (node.type === 'stop') {
        step.action_type = 'stop';
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

    const getDefaultData = (nodeType) => {
      switch (nodeType) {
        case 'email':
          return { template_id: null, template_name: null };
        case 'wait':
          return { wait_days: 1, wait_hours: 0 };
        case 'condition':
          return { condition_field: '', condition_operator: 'equals', condition_value: '' };
        case 'task':
          return { task_description: '', task_priority: 'medium', task_due_days: 0 };
        case 'updateField':
          return { update_field: '', update_value: '' };
        case 'assign':
          return { user_id: '', user_name: '' };
        case 'activity':
          return { activity_type: 'note', activity_description: '' };
        case 'moveStage':
          return { stage_id: '', stage_name: '' };
        case 'stop':
          return {};
        default:
          return {};
      }
    };

    const newNode = {
      id: newNodeId,
      type,
      position: { x: 250, y: yPos },
      data: getDefaultData(type)
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
    // Keep the sidebar editor state in sync so inputs remain editable
    setSelectedNode((prev) => {
      if (!prev || prev.id !== nodeId) return prev;
      return { ...prev, data: { ...prev.data, ...newData } };
    });
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  const handleAiGenerateSequence = async () => {
    if (!aiGoal.trim()) {
      toast.error('Please describe your sequence goal');
      return;
    }

    try {
      setAiGenerating(true);
      const response = await emailService.aiGenerateSequence(
        aiGoal,
        aiLeadType,
        aiSequenceLength
      );

      const aiSequence = response.data;
      
      // Update sequence info
      setSequenceData(prev => ({
        ...prev,
        name: aiSequence.sequence_name || prev.name,
        description: aiSequence.description || prev.description
      }));

      // Generate nodes from AI suggestions
      const newNodes = [];
      const newEdges = [];
      let yPosition = 150;
      let lastNodeId = 'trigger-1';

      // Keep the trigger node
      newNodes.push({
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: { trigger_event: sequenceData.trigger_event }
      });

      aiSequence.steps.forEach((step, index) => {
        const nodeId = `ai-node-${index + 1}`;
        
        // Add wait node if needed
        if (step.wait_days > 0 || step.wait_hours > 0) {
          const waitNodeId = `wait-${nodeId}`;
          newNodes.push({
            id: waitNodeId,
            type: 'wait',
            position: { x: 250, y: yPosition },
            data: {
              wait_days: step.wait_days || 0,
              wait_hours: step.wait_hours || 0
            }
          });
          newEdges.push({
            id: `edge-${lastNodeId}-${waitNodeId}`,
            source: lastNodeId,
            target: waitNodeId,
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed }
          });
          lastNodeId = waitNodeId;
          yPosition += 100;
        }

        // Add email node
        newNodes.push({
          id: nodeId,
          type: 'email',
          position: { x: 250, y: yPosition },
          data: {
            template_id: null,
            template_name: step.email_purpose || step.subject_suggestion,
            ai_suggestion: step.key_points ? step.key_points.join(', ') : ''
          }
        });
        
        newEdges.push({
          id: `edge-${lastNodeId}-${nodeId}`,
          source: lastNodeId,
          target: nodeId,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        lastNodeId = nodeId;
        yPosition += 100;
      });

      setNodes(newNodes);
      setEdges(newEdges);
      
      toast.success(`✨ AI generated ${aiSequence.steps.length}-step sequence!`, { duration: 4000 });
      setShowAiModal(false);
      setAiGoal('');
    } catch (error) {
      console.error('Error generating AI sequence:', error);
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to generate sequence';
      toast.error(msg);
    } finally {
      setAiGenerating(false);
    }
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

  const handleSaveAsTemplate = async () => {
    if (!sequenceData.name) {
      toast.error('Sequence name is required');
      return;
    }

    const steps = convertFlowToSteps();

    if (steps.length === 0) {
      toast.error('Add at least one step to the sequence');
      return;
    }

    const templateName = prompt('Enter a name for this template:', sequenceData.name);
    if (!templateName) return;

    const category = prompt('Enter category (welcome, nurture, demo, recovery, onboarding, re-engagement) or leave empty:', '');
    const industry = prompt('Enter industry (general, real_estate, education, healthcare, saas) or leave empty:', 'general');

    try {
      toast.loading('Saving template...', { id: 'save-template' });

      const templateData = {
        name: templateName,
        description: sequenceData.description || '',
        json_definition: { steps },
        category: category || null,
        industry: industry || 'general',
        tags: [],
        entry_conditions: null,
        exit_on_reply: true,
        exit_on_goal: null,
        send_time_window: null,
        max_emails_per_day: 3,
        is_public: false,
        is_active: true
      };

      await emailService.createWorkflowTemplate(templateData);
      toast.success('Template saved successfully!', { id: 'save-template' });
      navigate('/app/email/workflow-library');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(error.response?.data?.message || 'Failed to save template', { id: 'save-template' });
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
              onClick={() => setShowAiModal(true)}
              className="btn-secondary flex items-center space-x-2"
              title="Generate sequence with AI"
            >
              <SparklesIcon className="h-5 w-5 text-purple-600" />
              <span>AI Generate</span>
            </button>

            <button
              onClick={handleSaveAsTemplate}
              disabled={saving}
              className="btn-secondary flex items-center space-x-2"
              title="Save as reusable template"
            >
              <BookOpenIcon className="h-5 w-5" />
              <span>Save as Template</span>
            </button>

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
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-1">💡 Connect Nodes</p>
            <p className="text-xs text-blue-700">
              Drag from the bottom handle of any node to the top handle of another node to create connections
            </p>
          </div>
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
            <button
              onClick={() => addNode('task')}
              className="w-full btn-secondary justify-start"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Create Task
            </button>
            <button
              onClick={() => addNode('updateField')}
              className="w-full btn-secondary justify-start"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Update Field
            </button>
            <button
              onClick={() => addNode('assign')}
              className="w-full btn-secondary justify-start"
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Assign to User
            </button>
            <button
              onClick={() => addNode('activity')}
              className="w-full btn-secondary justify-start"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Log Activity
            </button>
            <button
              onClick={() => addNode('moveStage')}
              className="w-full btn-secondary justify-start"
            >
              <TagIcon className="h-5 w-5 mr-2" />
              Move to Stage
            </button>
            <button
              onClick={() => addNode('stop')}
              className="w-full btn-secondary justify-start"
            >
              <StopCircleIcon className="h-5 w-5 mr-2" />
              Stop Sequence
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

              {selectedNode.type === 'task' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Description
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.task_description || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { task_description: e.target.value })}
                      className="input"
                      placeholder="e.g., Follow up with lead"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={selectedNode.data.task_priority || 'medium'}
                      onChange={(e) => updateNodeData(selectedNode.id, { task_priority: e.target.value })}
                      className="input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due in (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={selectedNode.data.task_due_days || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { task_due_days: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'updateField' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field to Update
                    </label>
                    <select
                      value={selectedNode.data.update_field || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { update_field: e.target.value })}
                      className="input"
                    >
                      <option value="">Select field</option>
                      <option value="status">Status</option>
                      <option value="priority">Priority</option>
                      <option value="source">Source</option>
                      <option value="deal_value">Deal Value</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Value
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.update_value || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { update_value: e.target.value })}
                      className="input"
                      placeholder="Enter new value"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'assign' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to User
                  </label>
                  <select
                    value={selectedNode.data.user_id || ''}
                    onChange={(e) => {
                      const user = users.find(u => u.id === e.target.value);
                      updateNodeData(selectedNode.id, {
                        user_id: e.target.value,
                        user_name: user ? `${user.first_name} ${user.last_name}`.trim() || user.email : ''
                      });
                    }}
                    className="input"
                  >
                    <option value="">Select user</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`.trim()
                          : user.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedNode.type === 'activity' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Type
                    </label>
                    <select
                      value={selectedNode.data.activity_type || 'note'}
                      onChange={(e) => updateNodeData(selectedNode.id, { activity_type: e.target.value })}
                      className="input"
                    >
                      <option value="note">Note</option>
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Meeting</option>
                      <option value="task">Task</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={selectedNode.data.activity_description || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { activity_description: e.target.value })}
                      className="input"
                      placeholder="Enter activity description"
                      rows="3"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'moveStage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Move to Stage
                  </label>
                  <select
                    value={selectedNode.data.stage_id || ''}
                    onChange={(e) => {
                      const stage = stages.find(s => s.id === e.target.value);
                      updateNodeData(selectedNode.id, {
                        stage_id: e.target.value,
                        stage_name: stage?.name || ''
                      });
                    }}
                    className="input"
                  >
                    <option value="">Select stage</option>
                    {stages.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedNode.type === 'stop' && (
                <div className="text-sm text-gray-600">
                  This step will stop the sequence execution. No configuration needed.
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

      {/* AI Generation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <RocketLaunchIcon className="h-6 w-6 mr-2 text-purple-600" />
                AI Sequence Generator
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Describe your goal and let AI create an effective email sequence
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your sequence goal? *
                </label>
                <textarea
                  placeholder="Example: Nurture new leads from webinar, introduce product features, and encourage demo booking"
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  className="input w-full h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Type
                </label>
                <select
                  value={aiLeadType}
                  onChange={(e) => setAiLeadType(e.target.value)}
                  className="input"
                >
                  <option value="prospect">Prospect</option>
                  <option value="lead">Lead</option>
                  <option value="customer">Customer</option>
                  <option value="partner">Partner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Steps: {aiSequenceLength}
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={aiSequenceLength}
                  onChange={(e) => setAiSequenceLength(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>3 steps</span>
                  <span>10 steps</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowAiModal(false);
                  setAiGoal('');
                }}
                className="btn-secondary"
                disabled={aiGenerating}
              >
                Cancel
              </button>
              <button
                onClick={handleAiGenerateSequence}
                disabled={aiGenerating || !aiGoal.trim()}
                className="btn-primary flex items-center space-x-2"
              >
                <SparklesIcon className="h-5 w-5" />
                <span>{aiGenerating ? 'Generating...' : 'Generate Sequence'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSequenceBuilder;
