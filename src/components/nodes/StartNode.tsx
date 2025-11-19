import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, X } from 'lucide-react';
import { Box, Text, Flex, IconButton } from '@radix-ui/themes';

/**
 * Data structure for the Start node
 */
export interface StartNodeData {
  label: string;
  onDelete?: () => void;
}

/**
 * Props for the StartNode component
 */
export interface StartNodeProps {
  data: StartNodeData;
  id: string;
}

/**
 * StartNode - Represents the starting point of a workflow
 * This node is the entry point and has only an output connection
 */
export const StartNode: React.FC<StartNodeProps> = ({ data, id }) => {
  return (
    <Box
      px="4"
      py="3"
      position="relative"
      style={{
        backgroundColor: 'var(--green-9)',
        color: 'white',
        borderRadius: 'var(--radius-3)',
        boxShadow: 'var(--shadow-2)',
        minWidth: '120px',
      }}
    >
      {/* Delete button */}
      {data.onDelete && (
        <Box
          position="absolute"
          style={{
            top: '-8px',
            right: '-8px',
          }}
        >
          <IconButton
            size="1"
            color="red"
            variant="solid"
            radius="full"
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete?.();
            }}
            title="Delete node"
            style={{
              width: '20px',
              height: '20px',
              padding: 0,
              border: '2px solid white',
            }}
          >
            <X size={12} />
          </IconButton>
        </Box>
      )}

      <Flex align="center" gap="2" justify="center">
        <Play size={16} fill="white" />
        <Text size="2" weight="bold">
          {data.label}
        </Text>
      </Flex>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'var(--green-10)',
          border: '2px solid white',
        }}
      />
    </Box>
  );
};
