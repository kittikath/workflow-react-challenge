import React from 'react';
import { AlertCircle, Check, Loader, RefreshCw } from 'lucide-react';
import { Callout } from '@radix-ui/themes';
import { AutoSaveState } from './hooks/useAutoSave';

interface Props {
  state: AutoSaveState;
  lastSaved?: Date | null;
  error?: string;
}

const colorForState: Record<AutoSaveState, 'gray' | 'blue' | 'green' | 'red'> = {
  idle: 'gray',
  saving: 'blue',
  saved: 'green',
  error: 'red',
};

const labelForState: Record<AutoSaveState, string> = {
  idle: 'Idle',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Save failed',
};

export const SaveStatusIndicator: React.FC<Props> = ({ state, lastSaved, error }) => {
  const color = colorForState[state] ?? 'gray';
  const label = labelForState[state] ?? state;

  const Icon = (() => {
    switch (state) {
      case 'saving':
        return <Loader className="animate-spin" />;
      case 'saved':
        return <Check />;
      case 'error':
        return <AlertCircle />;
      default:
        return <AlertCircle />;
    }
  })();

  return (
    <Callout.Root color={color} size="1" mb="2" style={{ display: 'flex', alignItems: 'center' }}>
      <Callout.Icon>{Icon}</Callout.Icon>
      <Callout.Text>
        <strong>Status:</strong> {label}
        {state === 'saved' && lastSaved
          ? ` · ${lastSaved.toLocaleTimeString()} on ${lastSaved.toLocaleDateString()}`
          : state === 'error' && error
            ? ` · ${error}`
            : ''}
      </Callout.Text>
    </Callout.Root>
  );
};
