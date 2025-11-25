import type { Node, Edge } from '@xyflow/react';
import { capitalize } from './helpers';
import { ConditionalNodeData } from '@/components/nodes/ConditionalNode';
import { FormNodeData } from '@/components/nodes/FormNode';
import { ApiNodeData } from '@/components/nodes/ApiNode';

type ErrorType = 'warning' | 'info' | 'error';

export interface ValidationError {
  id: string;
  type: ErrorType;
  message: string;
  nodeId?: string;
}

export interface NodeError {
  id: string;
  nodeId: string;
  nodeType: string;
  error: NodeErrorType;
  message: string; // displays the latest error message for the node
}

export interface NodeErrorType {
  customName: string;
  url: string;
  fieldToEvaluate: string;
  operator: string;
  value: string;
  method: string;
  fieldName: string;
  fieldLabel: string;
}

export const DEFAULT_NODE_ERRORS: NodeErrorType = {
  customName: '',
  url: '',
  fieldToEvaluate: '',
  operator: '',
  value: '',
  method: '',
  fieldName: '',
  fieldLabel: '',
};

let _errorCounter = 0;
const generateErrorId = (prefix = 'err'): string => {
  _errorCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${_errorCounter}`;
};

export const buildError = (message: string, nodeId?: string, id?: string): ValidationError => ({
  id: id || generateErrorId('validation'),
  type: 'error',
  message,
  nodeId,
});

// Minimum connections required per node
export const minConnections: Record<string, number> = {
  start: 1,
  form: 2,
  conditional: 3,
  api: 2,
  end: 1,
};

export const buildUndirectedAdjacencyMap = (
  nodes: Node[],
  edges: Edge[]
): Record<string, Set<string>> => {
  const adjacency: Record<string, Set<string>> = {};
  nodes.forEach((n) => (adjacency[n.id] = new Set()));
  edges.forEach((e) => {
    if (!adjacency[e.source] || !adjacency[e.target]) return;
    adjacency[e.source].add(e.target);
    adjacency[e.target].add(e.source);
  });
  return adjacency;
};

export const validateNodeConnectionRequirements = (
  nodes: Node[],
  adjacency: Record<string, Set<string>>,
  requirements: Record<string, number>
): ValidationError[] => {
  const errors: ValidationError[] = [];

  nodes.forEach((n) => {
    const degree = adjacency[n.id]?.size ?? 0;
    const required = requirements[n.type] ?? 1;
    if (degree === 0) {
      errors.push(buildError(`${capitalize(n.type)} Node is not connected`, n.id));
      return;
    }
    if (degree < required) {
      const missing = required - degree;
      errors.push(
        buildError(
          `${capitalize(n.type)} Node is missing ${missing} ${missing === 1 ? 'connection' : 'connections'}`,
          n.id
        )
      );
    }
  });

  return errors;
};

export const validateWorkflow = (nodes: Node[], edges: Edge[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  const startNodes = nodes.filter((n) => n.type === 'start');
  if (startNodes.length === 0) {
    errors.push(buildError('Workflow must have one Start block'));
  } else if (startNodes.length !== 1) {
    errors.push(buildError('Workflow must have exactly one Start block', startNodes[0]?.id));
  }

  const endNodes = nodes.filter((n) => n.type === 'end');
  if (endNodes.length === 0) {
    errors.push(buildError('Workflow must have one End block'));
  } else if (endNodes.length !== 1) {
    errors.push(buildError('Workflow must have exactly one End block', endNodes[0]?.id));
  }

  const adjacency = buildUndirectedAdjacencyMap(nodes, edges);
  const connectionErrors = validateNodeConnectionRequirements(nodes, adjacency, minConnections);
  errors.push(...connectionErrors);

  return errors;
};

export const validateNodes = (nodes: Node[]): NodeError[] => {
  const errors: NodeError[] = [];

  for (const node of nodes) {
    const nodeError: NodeErrorType = {
      ...DEFAULT_NODE_ERRORS,
    };

    const appendMessage = (key: keyof NodeErrorType, msg: string) => {
      if (!msg) return;
      nodeError[key] = nodeError[key] ? `${nodeError[key]} | ${msg}` : msg;
    };

    let nodeHasError = false;

    if (!node.data || Object.keys(node.data).length === 0) {
      continue;
    }

    if (node.type === 'form' || node.type === 'conditional' || node.type === 'api') {
      const data = node.data as unknown as ConditionalNodeData | FormNodeData | ApiNodeData;

      const error = validateField('customName', data.customName ?? '', { nodeType: node.type });
      if (error) {
        appendMessage('customName', error);
        nodeHasError = true;
      }
    }

    if (node.type === 'form') {
      const data = node.data as unknown as FormNodeData;
      if (!data.fields || data.fields.length === 0) {
        appendMessage('fieldName', 'At least one field is required');
        nodeHasError = true;
      } else {
        for (let i = 0; i < data.fields.length; i++) {
          const field = data.fields[i];
          const fieldNameError = validateField('fieldName', field.name || '', {
            nodeType: node.type,
          });
          if (fieldNameError) {
            appendMessage('fieldName', `Field ${i + 1} name: ${fieldNameError}`);
            nodeHasError = true;
          }

          const fieldLabelError = validateField('fieldLabel', field.label || '', {
            nodeType: node.type,
          });
          if (fieldLabelError) {
            appendMessage('fieldLabel', `Field ${i + 1} label: ${fieldLabelError}`);
            nodeHasError = true;
          }
        }
      }
    } else if (node.type === 'conditional') {
      const data = node.data as unknown as ConditionalNodeData;
      const fieldToEvaluateError = validateField('fieldToEvaluate', data.fieldToEvaluate || '', {
        nodeType: node.type,
      });
      if (fieldToEvaluateError) {
        appendMessage('fieldToEvaluate', fieldToEvaluateError);
        nodeHasError = true;
      }

      const operatorError = validateField('operator', data.operator || '', { nodeType: node.type });
      if (operatorError) {
        appendMessage('operator', operatorError);
        nodeHasError = true;
      }

      const valueError = validateField('value', data.value || '', {
        nodeType: node.type,
        operator: data.operator,
      });
      if (valueError) {
        appendMessage('value', valueError);
        nodeHasError = true;
      }
    } else if (node.type === 'api') {
      const data = node.data as unknown as ApiNodeData;
      const urlError = validateField('url', data.url || '', { nodeType: node.type });
      if (urlError) {
        appendMessage('url', urlError);
        nodeHasError = true;
      }

      const methodError = validateField('method', data.method || '', { nodeType: node.type });
      if (methodError) {
        appendMessage('method', methodError);
        nodeHasError = true;
      }
    }

    if (nodeHasError) {
      const msgs = Object.values(nodeError).filter(Boolean);
      const primaryMessage = msgs.length > 0 ? (msgs[0] as string) : 'Node Configuration Error';

      errors.push({
        id: generateErrorId(`node-error-${node.id}`),
        nodeId: node.id,
        nodeType: node.type,
        error: nodeError,
        message: primaryMessage,
      });
    }
  }

  return errors;
};

export const validateOnBlur = (
  field: string,
  value: string,
  extra?: { nodeType?: string; operator?: string }
): string | null => {
  return validateField(field, value, extra);
};

export const validateField = (
  field: string,
  value: string,
  extra?: { nodeType?: string; operator?: string }
): string | null => {
  const trimmedValue = value.trim();

  switch (field) {
    // Form Node & Conditional Node: Custom Name
    case 'customName':
      if (!trimmedValue) {
        return extra?.nodeType === 'conditional'
          ? 'Condition Name is required'
          : 'Form Name is required';
      }
      if (trimmedValue.length < 3) {
        return extra?.nodeType === 'conditional'
          ? 'Condition Name must have a minimum of 3 characters'
          : 'Form Name must have a minimum of 3 characters';
      }
      return null;

    // Form Node
    case 'fieldName':
      if (!trimmedValue) return 'Field Name is required';
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedValue))
        return 'Field Name must be alphanumeric only (no spaces)';
      if (trimmedValue.length < 2) return 'Field Name must have a minimum of 2 characters';
      return null;
    case 'fieldLabel':
      if (!trimmedValue) return 'Field Label is required';
      if (trimmedValue.length < 2) return 'Field Label must have a minimum of 2 characters';
      return null;

    // Conditional Node
    case 'fieldToEvaluate':
      if (extra?.nodeType === 'conditional' && !trimmedValue)
        return 'Field to Evaluate is required';
      return null;
    case 'operator':
      if (extra?.nodeType === 'conditional' && !trimmedValue) return 'Operator is required';
      return null;
    case 'value':
      if (extra?.nodeType === 'conditional' && extra?.operator !== 'is_empty' && !trimmedValue) {
        return 'Value is required';
      }
      return null;

    // API Node
    case 'url':
      if (extra?.nodeType === 'api') {
        if (!trimmedValue) return 'URL is required';
        if (!/^https?:\/\/.+/.test(trimmedValue)) return 'URL must start with http:// or https://';
      }
      return null;
    case 'method':
      if (extra?.nodeType === 'api') {
        if (!trimmedValue) return 'Method is required';
        if (!['GET', 'POST', 'PUT', 'DELETE'].includes(trimmedValue.toUpperCase())) {
          return 'Method must be GET, POST, PUT, or DELETE';
        }
      }
      return null;

    default:
      return null;
  }
};
