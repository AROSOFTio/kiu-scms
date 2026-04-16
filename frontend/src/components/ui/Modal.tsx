import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all animate-in fade-in duration-500">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_64px_-28px_rgba(41,41,41,0.28)] animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button 
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 custom-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
