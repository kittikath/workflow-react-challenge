import React from 'react';
import { Card, Heading, Text, Box, Flex, Button } from '@radix-ui/themes';
import { Play, FileText, GitBranch, Square, Globe, Plus, LucideIcon } from 'lucide-react';

/**
 * Represents a workflow block type configuration
 */
export interface WorkflowBlockConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  color: string;
  darkColor: string;
}

/**
 * Props for the BlockPanel component
 */
export interface BlockPanelProps {
  onAddBlock: (blockType: string) => void;
}

/**
 * Available workflow block configurations
 */
type RadixColor = 'green' | 'blue' | 'amber' | 'purple' | 'red';

interface BlockConfigWithColor extends Omit<WorkflowBlockConfig, 'color' | 'darkColor'> {
  color: RadixColor;
}

const WORKFLOW_BLOCKS: readonly BlockConfigWithColor[] = [
  {
    id: 'start',
    name: 'Start Block',
    icon: Play,
    description: 'Starting point of the workflow',
    color: 'green',
  },
  {
    id: 'form',
    name: 'Form Block',
    icon: FileText,
    description: 'User input form',
    color: 'blue',
  },
  {
    id: 'conditional',
    name: 'Conditional Block',
    icon: GitBranch,
    description: 'Decision point with conditions',
    color: 'amber',
  },
  {
    id: 'api',
    name: 'API Block',
    icon: Globe,
    description: 'Make HTTP API calls',
    color: 'purple',
  },
  {
    id: 'end',
    name: 'End Block',
    icon: Square,
    description: 'End point of the workflow',
    color: 'red',
  },
] as const;

/**
 * BlockPanel - Displays available workflow blocks that can be added to the canvas
 * Provides a palette of block types for building workflows
 */
export const BlockPanel: React.FC<BlockPanelProps> = ({ onAddBlock }) => {
  return (
    <Card style={{ width: '256px', height: '100%' }}>
      <Box p="4" pb="3">
        <Heading size="3">Blocks</Heading>
      </Box>
      <Flex p="4" pt="0" direction="column" gap="3">
        {WORKFLOW_BLOCKS.map((block) => {
          const IconComponent = block.icon;
          return (
            <Flex key={block.id} direction="column" gap="1">
              <Text size="1" color="gray">
                {block.description}
              </Text>
              <Button
                variant="solid"
                color={block.color}
                onClick={() => onAddBlock(block.id)}
                style={{
                  cursor: 'pointer',
                }}
              >
                <Flex align="center" gap="3" width="100%" justify="between">
                  <Flex align="center" gap="2">
                    <IconComponent size={16} />
                    <Text size="2" weight="medium">
                      {block.name}
                    </Text>
                  </Flex>
                  <Plus size={16} />
                </Flex>
              </Button>
            </Flex>
          );
        })}
      </Flex>
    </Card>
  );
};
