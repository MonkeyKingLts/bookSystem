import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, children, footer, wide }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-surface rounded-2xl shadow-2xl ${wide ? 'w-full max-w-2xl' : 'w-full max-w-lg'} mx-4 max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral transition-colors">
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
