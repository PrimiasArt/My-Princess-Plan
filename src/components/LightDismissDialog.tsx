import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface LightDismissDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export const LightDismissDialog: React.FC<LightDismissDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = 'max-w-lg',
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      onClose();
    };

    dialog.addEventListener('close', handleNativeClose);

    // Fallback for browsers without closedby support (e.g. Safari)
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (isDialogContent) return;
      dialog.close();
    };

    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={titleId}
      className={`princess-dialog m-auto w-[92vw] ${maxWidthClass} rounded-3xl border-4 border-[#ffb6d5] bg-[#fff9fb] p-0 text-[#4a2b3b] shadow-2xl`}
    >
      <div className="flex items-center justify-between border-b-2 border-[#ffe0ed] bg-gradient-to-r from-[#ffe6f1] via-[#fff0f6] to-[#f3e8ff] px-5 py-4">
        <div>
          <h2 id={titleId} className="font-display text-lg font-bold text-[#d63384]">
            {title}
          </h2>
          {subtitle && <p className="text-xs font-medium text-[#8c5872]">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#d63384] shadow-sm transition hover:scale-105 hover:bg-[#ffe0ed]"
          aria-label="Đóng hộp thoại"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-[78vh] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
};
