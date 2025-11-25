import { useState, useEffect, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { ValidationError, NodeError } from '@/utils/validation';

export type AutoSaveState = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveProps {
  nodes: Node[];
  edges: Edge[];
  workflowErrors: ValidationError[];
  nodeErrors: NodeError[];
  storageKey: string;
  debounceMs?: number;
}

export const useAutoSave = ({
  nodes,
  edges,
  workflowErrors,
  nodeErrors,
  storageKey,
  debounceMs = 2000,
}: UseAutoSaveProps) => {
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isFirstRender = useRef(true);

  const MIN_SAVING_MS = 500;
  const SAVED_DISPLAY_MS = 2000;

  useEffect(() => {
    // Skip the first render to avoid saving initial empty state
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let savedTimer: number | undefined;
    let minSavingTimer: number | undefined;

    const timeout = setTimeout(() => {
      try {
        const hasWorkflowErrors = workflowErrors.length > 0;
        const hasNodeErrors = nodeErrors.length > 0;

        if (hasWorkflowErrors || hasNodeErrors) {
          setAutoSaveState('error');
          return;
        }

        setAutoSaveState('saving');

        const now = new Date();
        const payload = {
          nodes,
          edges,
          savedAt: now.toISOString(),
        };

        localStorage.setItem(storageKey, JSON.stringify(payload));

        if (minSavingTimer) clearTimeout(minSavingTimer);
        minSavingTimer = window.setTimeout(() => {
          // Ensures 'saving' state is shown for at least MIN_SAVING_MS
          setAutoSaveState('saved');
          setLastSaved(now);

          if (savedTimer) window.clearTimeout(savedTimer);
          savedTimer = window.setTimeout(
            () => setAutoSaveState('idle'),
            SAVED_DISPLAY_MS
          ) as unknown as number;
          minSavingTimer = undefined;
        }, MIN_SAVING_MS);

        savedTimer = window.setTimeout(() => setAutoSaveState('idle'), 2000);
      } catch (err) {
        setAutoSaveState('error');
      }
    }, debounceMs);

    return () => {
      clearTimeout(timeout);
      if (minSavingTimer) clearTimeout(minSavingTimer);
      if (savedTimer) {
        clearTimeout(savedTimer);
      }
    };
  }, [nodes, edges, workflowErrors, nodeErrors, storageKey, debounceMs]);

  return { autoSaveState, setAutoSaveState, lastSaved };
}
