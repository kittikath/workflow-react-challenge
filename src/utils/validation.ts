import { generateId } from "./helpers";

/**
 * Validation error structure
 */
export interface ValidationError {
  id: string;
  type: 'error';
  message: string;
  nodeId?: string;
}

export const buildError = (message: string, nodeId?: string): ValidationError => ({
  id: generateId(),
  type: 'error',
  message,
  nodeId,
});

export const minConnections: Record<string, number> = {
  start: 1,
  form: 2,
  conditional: 3,
  api: 2,
  end: 1,
};
