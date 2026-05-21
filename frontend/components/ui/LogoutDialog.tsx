"use client";

import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogTrigger,
} from "@fluentui/react-components";
import { SignOutRegular } from "@fluentui/react-icons";
import { useState } from "react";

interface LogoutDialogProps {
  onConfirm: () => void;
  showLabel?: boolean;
}

export function LogoutDialog({ onConfirm, showLabel = true }: LogoutDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(_e, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="subtle" size="small" icon={<SignOutRegular />}>
          {showLabel ? "Logout" : undefined}
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogContent>
            Are you sure you want to log out? You will need to sign in again to access the panel.
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              Logout
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
