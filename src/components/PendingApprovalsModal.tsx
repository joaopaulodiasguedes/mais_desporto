import React from 'react';
import { PendingApprovalsManagement } from './PendingApprovalsManagement';

interface PendingApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PendingApprovalsModal: React.FC<PendingApprovalsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-4 sm:p-6 overflow-y-auto">
          <PendingApprovalsManagement onClose={onClose} />
        </div>
      </div>
    </div>
  );
};
