import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { AuthMethod } from '../../types';

interface AuthFormProps {
  onAuth: (token: string, method: AuthMethod, clientId?: string, clientSecret?: string) => void;
  isLoading?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuth, isLoading }) => {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('token');
  const [token, setToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === 'token') {
      onAuth(token, authMethod);
    } else {
      onAuth(token, authMethod, clientId, clientSecret);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Card className="w-full max-w-md p-8" gradient>
        <div className="text-center mb-8">
          <img
            src="/images/4p6vr8j7vbom4axo7k0 2.png"
            alt="Face Swap AI"
            className="w-24 h-24 mx-auto mb-4 drop-shadow-2xl"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Face Swap AI
          </h1>
          <p className="text-gray-400">Welcome to next-gen face swapping</p>
        </div>

        {/* Auth Method Toggle */}
        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-lg">
          <button
            onClick={() => setAuthMethod('token')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              authMethod === 'token'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            X-API Key
          </button>
          <button
            onClick={() => setAuthMethod('credentials')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              authMethod === 'credentials'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Credentials
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMethod === 'token' ? (
            <Input
              type="text"
              placeholder="Enter your API key"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              }
            />
          ) : (
            <>
              <Input
                type="text"
                placeholder="Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                icon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <Input
                type="password"
                placeholder="Client Secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                required
                icon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
            </>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Get Started
          </Button>
        </form>
      </Card>
    </div>
  );
};


