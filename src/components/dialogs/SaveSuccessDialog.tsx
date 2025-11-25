import React from 'react';
import { AlertDialog, Button, Flex } from '@radix-ui/themes';

interface SaveSuccessDialogProps {
  showSaveDialog: boolean;
  setShowSaveDialog: (open: boolean) => void;
}

export const SaveSuccessDialog: React.FC<SaveSuccessDialogProps> = ({
  showSaveDialog,
  setShowSaveDialog,
}) => {
  return (
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
  );
};
