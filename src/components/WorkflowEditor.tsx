import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  AlertDialog,
  Text,
  TextField,
  Select,
  Checkbox,
  IconButton,
  Separator,
  Badge,
  Callout,
} from '@radix-ui/themes';
import { Save, X, Plus, Trash2, AlertCircle, Info } from 'lucide-react';

import { StartNode } from './nodes/StartNode';
import { FormNode, FormField } from './nodes/FormNode';
import { ConditionalNode, ConditionalRoute, ConditionalOperator } from './nodes/ConditionalNode';
import { ApiNode, HttpMethod } from './nodes/ApiNode';
import { EndNode } from './nodes/EndNode';
import { BlockPanel } from './BlockPanel';

import type { FormNodeData } from './nodes/FormNode';
import type { ApiNodeData } from './nodes/ApiNode';
import type { ConditionalNodeData } from './nodes/ConditionalNode';
import type { StartNodeData } from './nodes/StartNode';
import type { EndNodeData } from './nodes/EndNode';

const nodeTypes = {
  start: StartNode,
  form: FormNode,
  conditional: ConditionalNode,
  api: ApiNode,
  end: EndNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

const getBlockConfig = (blockType: string): WorkflowNodeData => {
  const configs: Record<string, WorkflowNodeData> = {
    start: {
      label: 'Start',
    },
    form: {
      label: 'Form',
      customName: 'Form',
      fields: [],
    },
    conditional: {
      label: 'Conditional',
      customName: 'Conditional',
      fieldToEvaluate: '',
      operator: 'equals' as ConditionalOperator,
      value: '',
      routes: [
        { id: 'true' as const, label: 'True', condition: '' },
        { id: 'false' as const, label: 'False', condition: '' },
      ] as ConditionalRoute[],
    },
    api: {
      label: 'API Call',
      url: '',
      method: 'GET',
    },
    end: {
      label: 'End',
    },
  };
  return configs[blockType] || { label: blockType };
};

/**
 * Union type representing all possible node data types
 */
export type WorkflowNodeData =
  | FormNodeData
  | ApiNodeData
  | ConditionalNodeData
  | StartNodeData
  | EndNodeData;

/**
 * Validation error structure
 */
export interface ValidationError {
  id: string;
  type: 'error';
  message: string;
  nodeId?: string;
}

/**
 * WorkflowEditor - Main component for building and editing workflows
 * Provides a visual canvas for creating workflows with nodes and connections
 */
export const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workflowErrors, setWorkflowErrors] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Static validation errors for demonstration
  const validationErrors: ValidationError[] = [
    {
      id: '1',
      type: 'error',
      message: 'Workflow must have exactly one Start block',
      nodeId: undefined,
    },
    {
      id: '2',
      type: 'error',
      message: 'Form block "User Info" has no fields configured',
      nodeId: 'node_1',
    },
    {
      id: '3',
      type: 'error',
      message: 'Conditional block has no connections',
      nodeId: 'node_2',
    },
  ];

  const onConnect = useCallback(
    (params: Connection) => {
      // Get the source node to check if it's a conditional node
      const sourceNode = nodes.find((n) => n.id === params.source);

      let label = '';
      if (sourceNode?.type === 'conditional' && params.sourceHandle) {
        const conditionalData = sourceNode.data as ConditionalNodeData;
        // Find the route label for this handle
        const route = conditionalData.routes?.find((r) => r.id === params.sourceHandle);
        label = route?.label || params.sourceHandle || '';
      }

      setEdges((eds) => addEdge({ ...params, label }, eds));
    },
    [setEdges, nodes]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // Don't open editor for start and end nodes
    if (node.type === 'start' || node.type === 'end') {
      return;
    }
    setSelectedNode(node);
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, newData: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
        )
      );
    },
    [setNodes]
  );

  const closeEditor = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  // Keyboard shortcuts for deleting selected node
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNode) {
        // Prevent default behavior (like navigating back) when deleting
        event.preventDefault();
        deleteNode(selectedNode.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, deleteNode]);

  const handleAddBlock = useCallback(
    (blockType: string) => {
      const config = getBlockConfig(blockType);

      // Get viewport center position
      let position = { x: 100, y: 100 }; // Default fallback

      if (reactFlowInstance.current) {
        const viewport = reactFlowInstance.current.getViewport();
        const zoom = viewport.zoom;
        const canvasCenter = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        };

        // Convert screen coordinates to flow coordinates
        position = reactFlowInstance.current.screenToFlowPosition({
          x: canvasCenter.x,
          y: canvasCenter.y,
        });
      }

      const nodeId = getId();
      const newNode: Node = {
        id: nodeId,
        type: blockType,
        position,
        data: {
          ...config,
          onDelete: () => deleteNode(nodeId),
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, deleteNode]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  const handleSave = () => {
    const workflowConfig = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
      })),
      metadata: {
        name: 'Sample Workflow',
        version: '1.0.0',
        created: new Date().toISOString(),
      },
    };

    console.log('Workflow Configuration:', JSON.stringify(workflowConfig, null, 2));

    setShowSaveDialog(true);
  };

  return (
    <Flex minHeight="100vh" direction="column" style={{ width: '100%' }}>
      <Card m="4" mb="0">
        <Flex flexGrow="1" justify="between" align="center">
          <Heading as="h2">Workflow Editor</Heading>

          <Button onClick={handleSave}>
            <Save size={16} />
            Save Workflow
          </Button>
        </Flex>
      </Card>

      {/* Main Content with Panel and Canvas */}
      <Flex flexGrow="1" m="4" mt="2" gap="4">
        {/* Left Panels */}
        <Flex direction="column" gap="4">
          <BlockPanel onAddBlock={handleAddBlock} />
          <ValidationPanel errors={validationErrors} />
        </Flex>

        {/* Workflow Canvas */}
        <Box flexGrow="1" style={{ minHeight: '600px' }}>
          <Card style={{ overflow: 'hidden', height: '100%' }}>
            {workflowErrors.length > 0 && (
              <Callout.Root color="red" size="1" mb="2">
                <Callout.Icon>
                  <AlertCircle />
                </Callout.Icon>
                <Callout.Text>Workflow Errors: {workflowErrors.join(', ')}</Callout.Text>
              </Callout.Root>
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onInit={onInit}
              nodeTypes={nodeTypes}
              fitView
              defaultEdgeOptions={{
                style: { strokeWidth: 2, stroke: '#94a3b8' },
                type: 'smoothstep',
                animated: false,
              }}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius)',
              }}
            >
              <Controls
                style={{ backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <MiniMap
                style={{ backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                nodeColor={(node) => {
                  switch (node.type) {
                    case 'start':
                      return '#10b981';
                    case 'form':
                      return '#3b82f6';
                    case 'conditional':
                      return '#f59e0b';
                    case 'api':
                      return '#a855f7';
                    case 'end':
                      return '#ef4444';
                    default:
                      return '#6b7280';
                  }
                }}
              />
              <Background color="#e2e8f0" gap={20} />
            </ReactFlow>
          </Card>
        </Box>

        {/* Right Panel - Node Editor */}
        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            onUpdate={updateNodeData}
            onClose={closeEditor}
            onDelete={deleteNode}
          />
        )}
      </Flex>

      <AlertDialog.Root open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Workflow Saved</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Your workflow configuration has been saved to the browser console. Check the developer
            console for the complete configuration details.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Close
              </Button>
            </AlertDialog.Cancel>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Flex>
  );
};

/**
 * Props for the NodeEditor component
 */
export interface NodeEditorProps {
  node: Node;
  onUpdate: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
}

/**
 * NodeEditor - Configuration panel for editing node properties
 * Displays different fields based on the node type
 */
export const NodeEditor: React.FC<NodeEditorProps> = ({ node, onUpdate, onClose, onDelete }) => {
  const [formData, setFormData] = useState<WorkflowNodeData>(node.data as WorkflowNodeData);

  const handleChange = (field: string, value: string | FormField[] | ConditionalRoute[]) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(node.id, newData);
  };

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      name: '',
      label: '',
      type: 'string' as const,
      required: false,
    };
    const newFields = [...(formData.fields || []), newField];
    handleChange('fields', newFields);
  };

  const removeField = (fieldId: string) => {
    const formNodeData = formData as FormNodeData;
    const newFields = (formNodeData.fields || []).filter((f) => f.id !== fieldId);
    handleChange('fields', newFields);
  };

  const updateField = (
    fieldId: string,
    fieldProp: keyof FormField,
    value: string | boolean | string[]
  ) => {
    const formNodeData = formData as FormNodeData;
    const newFields = (formNodeData.fields || []).map((f) =>
      f.id === fieldId ? { ...f, [fieldProp]: value } : f
    );
    handleChange('fields', newFields);
  };

  const addDropdownOption = (fieldId: string) => {
    const formNodeData = formData as FormNodeData;
    const newFields = (formNodeData.fields || []).map((f) =>
      f.id === fieldId ? { ...f, options: [...(f.options || []), ''] } : f
    );
    handleChange('fields', newFields);
  };

  const updateDropdownOption = (fieldId: string, optionIndex: number, value: string) => {
    const formNodeData = formData as FormNodeData;
    const newFields = (formNodeData.fields || []).map((f) => {
      if (f.id === fieldId) {
        const newOptions = [...(f.options || [])];
        newOptions[optionIndex] = value;
        return { ...f, options: newOptions };
      }
      return f;
    });
    handleChange('fields', newFields);
  };

  const removeDropdownOption = (fieldId: string, optionIndex: number) => {
    const formNodeData = formData as FormNodeData;
    const newFields = (formNodeData.fields || []).map((f) => {
      if (f.id === fieldId) {
        const newOptions = [...(f.options || [])];
        newOptions.splice(optionIndex, 1);
        return { ...f, options: newOptions };
      }
      return f;
    });
    handleChange('fields', newFields);
  };

  return (
    <Card style={{ width: '350px', height: '100%', position: 'relative', overflowY: 'auto' }}>
      <Flex direction="column" gap="4" p="4">
        <Flex justify="between" align="center">
          <Heading size="4">Edit {node.type}</Heading>
          <Flex gap="2">
            <IconButton
              variant="ghost"
              size="1"
              color="red"
              onClick={() => onDelete(node.id)}
              title="Delete node (Delete/Backspace)"
            >
              <Trash2 size={16} />
            </IconButton>
            <IconButton variant="ghost" size="1" onClick={onClose} title="Close editor">
              <X size={16} />
            </IconButton>
          </Flex>
        </Flex>

        {node.type === 'form' && (
          <Flex direction="column" gap="4">
            <Box>
              <Text size="2" weight="medium" mb="2">
                Form Name
              </Text>
              <TextField.Root
                value={(formData as FormNodeData).customName || ''}
                onChange={(e) => handleChange('customName', e.target.value)}
                placeholder="Enter form name"
              />
            </Box>

            <Separator size="4" />

            <Flex justify="between" align="center">
              <Text size="2" weight="bold">
                Fields
              </Text>
              <Button size="1" onClick={addField} style={{ gap: '4px' }}>
                <Plus size={14} />
                Add Field
              </Button>
            </Flex>

            {((formData as FormNodeData).fields || []).map((field, index) => (
              <Card
                key={field.id}
                variant="surface"
                style={{ padding: '12px', backgroundColor: 'var(--gray-3)' }}
              >
                <Flex direction="column" gap="3">
                  <Flex justify="between" align="center">
                    <Text size="1" weight="bold" color="gray">
                      Field {index + 1}
                    </Text>
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="red"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </Flex>

                  <Box>
                    <Text size="1" mb="2">
                      Field Name
                    </Text>
                    <TextField.Root
                      size="1"
                      value={field.name || ''}
                      onChange={(e) => updateField(field.id, 'name', e.target.value)}
                      placeholder="field_name"
                    />
                  </Box>

                  <Box>
                    <Text size="1" mb="2">
                      Label
                    </Text>
                    <TextField.Root
                      size="1"
                      value={field.label || ''}
                      onChange={(e) => updateField(field.id, 'label', e.target.value)}
                      placeholder="Display Label"
                    />
                  </Box>

                  <Box>
                    <Text size="1" mb="2">
                      Type
                    </Text>
                    <Select.Root
                      value={field.type || 'string'}
                      onValueChange={(val) => updateField(field.id, 'type', val)}
                      size="1"
                    >
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="string">String</Select.Item>
                        <Select.Item value="number">Number</Select.Item>
                        <Select.Item value="dropdown">Dropdown</Select.Item>
                        <Select.Item value="checkbox">Checkbox</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  {field.type === 'dropdown' && (
                    <Box>
                      <Flex justify="between" align="center" mb="2">
                        <Text size="1">Options</Text>
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => addDropdownOption(field.id)}
                          style={{ gap: '2px' }}
                        >
                          <Plus size={12} />
                        </Button>
                      </Flex>
                      <Flex direction="column" gap="2">
                        {(field.options || []).map((option, optIndex) => (
                          <Flex key={optIndex} gap="2" align="center">
                            <TextField.Root
                              size="1"
                              value={option}
                              onChange={(e) =>
                                updateDropdownOption(field.id, optIndex, e.target.value)
                              }
                              placeholder={`Option ${optIndex + 1}`}
                              style={{ flex: 1 }}
                            />
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="red"
                              onClick={() => removeDropdownOption(field.id, optIndex)}
                            >
                              <X size={12} />
                            </IconButton>
                          </Flex>
                        ))}
                      </Flex>
                    </Box>
                  )}

                  <Flex gap="2" align="center" style={{ marginTop: '4px' }}>
                    <Checkbox
                      checked={field.required || false}
                      onCheckedChange={(checked) => updateField(field.id, 'required', checked)}
                      size="1"
                    />
                    <Text size="1">Required</Text>
                  </Flex>
                </Flex>
              </Card>
            ))}

            {(!(formData as FormNodeData).fields ||
              (formData as FormNodeData).fields?.length === 0) && (
              <Box p="3">
                <Text size="2" align="center" color="gray">
                  No fields added yet
                </Text>
              </Box>
            )}
          </Flex>
        )}

        {node.type === 'api' && (
          <Flex direction="column" gap="4">
            <Box>
              <Text size="2" weight="medium" mb="2">
                API URL
              </Text>
              <TextField.Root
                value={(formData as ApiNodeData).url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://api.example.com"
              />
            </Box>
            <Box>
              <Text size="2" weight="medium" mb="2">
                Method
              </Text>
              <Select.Root
                value={(formData as ApiNodeData).method || 'GET'}
                onValueChange={(val) => handleChange('method', val)}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="GET">GET</Select.Item>
                  <Select.Item value="POST">POST</Select.Item>
                  <Select.Item value="PUT">PUT</Select.Item>
                  <Select.Item value="DELETE">DELETE</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>
        )}

        {node.type === 'conditional' && (
          <Flex direction="column" gap="4">
            <Box>
              <Text size="2" weight="medium" mb="2">
                Condition Name
              </Text>
              <TextField.Root
                value={(formData as ConditionalNodeData).customName || ''}
                onChange={(e) => handleChange('customName', e.target.value)}
                placeholder="Enter condition name"
              />
            </Box>
            <Box>
              <Text size="2" weight="medium" mb="2">
                Field to Evaluate
              </Text>
              <TextField.Root
                value={(formData as ConditionalNodeData).fieldToEvaluate || ''}
                onChange={(e) => handleChange('fieldToEvaluate', e.target.value)}
                placeholder="field_name"
              />
            </Box>
            <Box>
              <Text size="2" weight="medium" mb="2">
                Operator
              </Text>
              <Select.Root
                value={(formData as ConditionalNodeData).operator || 'equals'}
                onValueChange={(val) => handleChange('operator', val)}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="equals">Equals</Select.Item>
                  <Select.Item value="not_equals">Not Equals</Select.Item>
                  <Select.Item value="is_empty">Is Empty</Select.Item>
                  <Select.Item value="greater_than">Greater Than</Select.Item>
                  <Select.Item value="less_than">Less Than</Select.Item>
                  <Select.Item value="contains">Contains</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>
            <Box>
              <Text size="2" weight="medium" mb="2">
                Value
              </Text>
              <TextField.Root
                value={(formData as ConditionalNodeData).value || ''}
                onChange={(e) => handleChange('value', e.target.value)}
                placeholder="comparison value"
              />
            </Box>

            <Separator size="4" />

            <Text size="2" weight="bold">
              Routes
            </Text>

            {((formData as ConditionalNodeData).routes || []).map((route) => (
              <Card
                key={route.id}
                variant="surface"
                style={{
                  padding: '12px',
                  backgroundColor: route.id === 'true' ? 'var(--green-3)' : 'var(--red-3)',
                }}
              >
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="center">
                    <Text size="2" weight="bold" color={route.id === 'true' ? 'green' : 'red'}>
                      {route.id.toUpperCase()} Path
                    </Text>
                  </Flex>

                  <Box>
                    <Text size="1" mb="2">
                      Route Label
                    </Text>
                    <TextField.Root
                      size="1"
                      value={route.label || ''}
                      onChange={(e) => {
                        const conditionalData = formData as ConditionalNodeData;
                        const newRoutes = (conditionalData.routes || []).map((r) =>
                          r.id === route.id ? { ...r, label: e.target.value } : r
                        );
                        handleChange('routes', newRoutes);
                      }}
                      placeholder={route.id === 'true' ? 'e.g., Yes, Success' : 'e.g., No, Failed'}
                    />
                  </Box>

                  <Box>
                    <Text size="1" mb="2">
                      Description (optional)
                    </Text>
                    <TextField.Root
                      size="1"
                      value={route.condition || ''}
                      onChange={(e) => {
                        const conditionalData = formData as ConditionalNodeData;
                        const newRoutes = (conditionalData.routes || []).map((r) =>
                          r.id === route.id ? { ...r, condition: e.target.value } : r
                        );
                        handleChange('routes', newRoutes);
                      }}
                      placeholder="Describe this path"
                    />
                  </Box>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Flex>
    </Card>
  );
};

/**
 * Props for the ValidationPanel component
 */
export interface ValidationPanelProps {
  errors: ValidationError[];
}

/**
 * ValidationPanel - Displays workflow validation errors
 * Shows a list of errors that need to be fixed in the workflow
 */
export const ValidationPanel: React.FC<ValidationPanelProps> = ({ errors }) => {
  const errorCount = errors.length;

  return (
    <Card style={{ width: '256px', height: '100%' }}>
      <Flex direction="column" gap="3" p="4">
        <Flex justify="between" align="center">
          <Heading size="3">Errors</Heading>
          {errorCount > 0 && (
            <Badge color="red" size="1">
              {errorCount}
            </Badge>
          )}
        </Flex>

        <Flex direction="column" gap="2">
          {errors.length === 0 ? (
            <Callout.Root color="green" size="1">
              <Callout.Icon>
                <Info />
              </Callout.Icon>
              <Callout.Text>No errors found</Callout.Text>
            </Callout.Root>
          ) : (
            errors.map((error) => (
              <Callout.Root key={error.id} color="red" size="1">
                <Callout.Icon>
                  <AlertCircle />
                </Callout.Icon>
                <Callout.Text>
                  {error.message}
                  {error.nodeId && (
                    <>
                      <br />
                      <Text size="1" color="gray">
                        Node: {error.nodeId}
                      </Text>
                    </>
                  )}
                </Callout.Text>
              </Callout.Root>
            ))
          )}
        </Flex>
      </Flex>
    </Card>
  );
};
