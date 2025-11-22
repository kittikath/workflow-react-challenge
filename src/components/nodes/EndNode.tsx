import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square, X } from 'lucide-react';
import { Box, Text, Flex, IconButton } from '@radix-ui/themes';

/**
 * Data structure for the End node
 */
export interface EndNodeData {
  label: string;
  onDelete?: () => void;
}

/**
 * Props for the EndNode component
 */
export interface EndNodeProps {
  data: EndNodeData;
  id: string;
}

/**
 * EndNode - Represents the termination point of a workflow
 * This node marks the end of the workflow and has only an input connection
 */
export const EndNode: React.FC<EndNodeProps> = ({ data, id }) => {
  return (
    <Box
      px="4"
      py="3"
      position="relative"
      style={{
        backgroundColor: 'var(--red-9)',
        color: 'white',
        borderRadius: 'var(--radius-3)',
        boxShadow: 'var(--shadow-2)',
        border: '2px solid var(--red-10)',
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

      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'var(--red-10)',
          border: '2px solid white',
        }}
      />

      <Flex align="center" gap="2" justify="center">
        <Square size={16} fill="white" />
        <Text size="2" weight="bold">
          {data.label}
        </Text>
      </Flex>

      <Box 
        position="absolute"
        style={{
          bottom: '-20px',
          left: '0px',
        }}>
        <Text size="1" weight="light" style={{ opacity: 0.7, color: 'black'}}>{id}</Text>
      </Box>
    </Box>
  );
};
