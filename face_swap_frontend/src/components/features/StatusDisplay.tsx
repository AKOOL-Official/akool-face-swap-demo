import React from 'react';
import { Card } from '../ui/Card';

interface StatusDisplayProps {
  status: string;
  isLoading: boolean;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, isLoading }) => {
  if (!status && !isLoading) return null;

  return (
    <Card className="p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-3 sm:gap-4">
        {isLoading && (
          <div className="flex-shrink-0">
            <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm text-gray-400 mb-1">Processing Status</div>
          <div className="text-white font-medium text-sm sm:text-base break-words">{status}</div>
        </div>
      </div>
    </Card>
  );
};

