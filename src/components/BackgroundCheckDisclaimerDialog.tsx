import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function BackgroundCheckDisclaimerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Important Safety Notice</DialogTitle>
          <DialogDescription>
            Momscellaneous is a marketplace. We do <b>not</b> perform background checks on providers.
            You are strongly advised to conduct your own screening, interviews, reference checks,
            and background checks before booking.
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            By continuing, you acknowledge that Momscellaneous is not responsible for the acts,
            omissions, or services of providers or users, and you agree to use your best judgment
            and appropriate safety measures.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>I Understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
