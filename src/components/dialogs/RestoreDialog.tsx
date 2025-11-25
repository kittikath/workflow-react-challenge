import React from 'react';
import { AlertDialog, Button, Flex } from '@radix-ui/themes';

interface RestoreDialogProps {
  open: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  savedAt: string | null;
}

export const RestoreDialog: React.FC<RestoreDialogProps> = ({
  open,
  onRestore,
  onDiscard,
  savedAt,
}) => {
  const formattedDate = savedAt ? new Date(savedAt).toLocaleString() : 'Unknown date';

  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>Restore Unsaved Workflow</AlertDialog.Title>
        <AlertDialog.Description size="2">
          We found a saved version of your workflow from <strong>{formattedDate}</strong>.
          <br />
          <br />
          Would you like to restore this session or start with a new workflow?
        </AlertDialog.Description>

        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" color="gray" onClick={onDiscard}>
            Discard
          </Button>
          <Button variant="solid" onClick={onRestore}>
            Restore
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};
