import React from 'react';
import { Button } from '../ui/Button';

interface HeaderProps {
  onCheckBalance: () => void;
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onCheckBalance, isLoading }) => {
  return (
    <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <img
          src="/images/4p6vr8j7vbom4axo7k0 2.png"
          alt="Face Swap AI"
          className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-2xl"
        />
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Face Swap AI
          </h1>
          <p className="text-gray-400 text-sm mt-1">Next-gen face swapping technology</p>
        </div>
      </div>
      
      <Button
        onClick={onCheckBalance}
        isLoading={isLoading}
        variant="ghost"
        className="border border-blue-500/50"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Check Balance
      </Button>
    </header>
  );
};


