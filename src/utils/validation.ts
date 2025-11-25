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

export interface NodeErrors {
  customName: string;
  url: string;
  fieldToEvaluate: string;
  operator: string;
  value: string;
  method: string;
  fieldName: string;
  fieldLabel: string;
}

export const DEFAULT_NODE_ERRORS: NodeErrors = {
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

export const validateNodes = (nodes: Node[]): Record<string, NodeErrors> | null => {
  for (const node of nodes) {
    const nodeError: NodeErrors = {
      customName: '',
      url: '',
      fieldToEvaluate: '',
      operator: '',
      value: '',
      method: '',
      fieldName: '',
      fieldLabel: '',
    };

    if (!node.data || Object.keys(node.data).length === 0) {
      continue;
    }

    if (node.type === 'form' || node.type === 'conditional' || node.type === 'api') {
      const data = node.data as unknown as ConditionalNodeData | FormNodeData | ApiNodeData;

      const error = validateField('customName', data.customName ?? '', { nodeType: node.type });
      if (error) {
        nodeError.customName = error;
        return { [node.id]: nodeError };
      }
    }

    if (node.type === 'form') {
      const data = node.data as unknown as FormNodeData;
      if (!data.fields || data.fields.length === 0) {
        nodeError.fieldName = 'At least one field is required';
        return { [node.id]: nodeError };
      }
      for (let i = 0; i < data.fields.length; i++) {
        const field = data.fields[i];
        const fieldNameError = validateField('fieldName', field.name || '', {
          nodeType: node.type,
        });
        if (fieldNameError) {
          nodeError[`fieldName_${i}`] = fieldNameError;
          return { [node.id]: nodeError };
        }

        const fieldLabelError = validateField('fieldLabel', field.label || '', {
          nodeType: node.type,
        });
        if (fieldLabelError) {
          nodeError[`fieldLabel_${i}`] = fieldLabelError;
          return { [node.id]: nodeError };
        }
      }
    } else if (node.type === 'conditional') {
      const fieldToEvaluateError = validateField('fieldToEvaluate', data.fieldToEvaluate || '', {
        nodeType: node.type,
      });
      if (fieldToEvaluateError) {
        nodeError.fieldToEvaluate = fieldToEvaluateError;
        return { [node.id]: nodeError };
      }

      const operatorError = validateField('operator', data.operator || '', { nodeType: node.type });
      if (operatorError) {
        nodeError.operator = operatorError;
        return { [node.id]: nodeError };
      }

      const valueError = validateField('value', data.value || '', {
        nodeType: node.type,
        operator: data.operator,
      });
      if (valueError) {
        nodeError.value = valueError;
        return { [node.id]: nodeError };
      }
    } else if (node.type === 'api') {
      const urlError = validateField('url', data.url || '', { nodeType: node.type });
      if (urlError) {
        nodeError.url = urlError;
        return { [node.id]: nodeError };
      }

      const methodError = validateField('method', data.method || '', { nodeType: node.type });
      if (methodError) {
        nodeError.method = methodError;
        return { [node.id]: nodeError };
      }
    }
  }

  return null; // no errors found in any node
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
