import { Button } from "@/components/ui/button";

export default function BackgroundCheckDisclaimerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 shadow-card">
        <h2 className="text-xl font-semibold text-foreground">
          Important Safety Notice
        </h2>

        <p className="text-muted-foreground mt-3 leading-relaxed">
          Momscellaneous is a marketplace that connects families with independent
          providers. <b>We do not perform background checks</b>, identity checks,
          reference checks, or screening unless explicitly stated.
        </p>

        <p className="text-muted-foreground mt-3 leading-relaxed">
          We strongly recommend that you conduct your own screening and due
          diligence before booking, including interviews, references, and
          background checks where appropriate.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            I Understand
          </Button>
          <Button onClick={onClose}>Continue</Button>
        </div>
      </div>
    </div>
  );
}
