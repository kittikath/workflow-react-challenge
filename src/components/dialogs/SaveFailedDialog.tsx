import React from 'react';
import { AlertDialog, Button, Flex } from '@radix-ui/themes';

interface SaveFailedDialogProps {
  showErrorDialog: boolean;
  setShowErrorDialog: (open: boolean) => void;
}

export const SaveFailedDialog: React.FC<SaveFailedDialogProps> = ({
  showErrorDialog,
  setShowErrorDialog,
}) => {
  return (
    <AlertDialog.Root open={showErrorDialog} onOpenChange={setShowErrorDialog}>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title color="red">Error Saving Workflow</AlertDialog.Title>
        <AlertDialog.Description size="2">
          There was a problem saving your workflow configuration. Check the Errors Sidebar for
          details and try again.
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="red">
              Close
            </Button>
          </AlertDialog.Cancel>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};
