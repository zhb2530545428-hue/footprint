"use client";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmButtonClass =
    confirmVariant === "danger"
      ? "rounded-button bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
      : "rounded-button bg-accent px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent/85";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-panel bg-white p-8 shadow-xl">
        <h3 className="text-[18px] font-semibold text-foreground">{title}</h3>
        <p className="mt-3 text-[15px] text-muted leading-relaxed">{message}</p>
        <div className="mt-7 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-button border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            Cancel
          </button>
          <button onClick={onConfirm} className={confirmButtonClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
