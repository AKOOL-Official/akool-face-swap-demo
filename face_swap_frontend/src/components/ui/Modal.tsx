import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative w-full ${sizes[size]} transform transition-all max-h-[95vh] sm:max-h-[90vh] overflow-y-auto`}>
          <div className="relative rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 shadow-2xl">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            {title && (
              <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 pr-12 sm:pr-14">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{title}</h2>
              </div>
            )}

            {/* Content */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

