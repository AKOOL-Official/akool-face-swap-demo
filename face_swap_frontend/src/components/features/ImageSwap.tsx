import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { ApiVersion } from '../../types';

interface ImageSwapProps {
  onSwap: (config: {
    sourceImage: string;
    targetImage: string;
    apiVersion: ApiVersion;
    faceEnhance: boolean;
    singleFace: boolean;
  }) => void;
  webhookUrl: string;
  onWebhookChange: (url: string) => void;
  isLoading?: boolean;
}

export const ImageSwap: React.FC<ImageSwapProps> = ({
  onSwap,
  webhookUrl,
  onWebhookChange,
  isLoading,
}) => {
  const [apiVersion, setApiVersion] = useState<ApiVersion>('v4');
  const [sourceImage, setSourceImage] = useState('https://d3fulx9g4ogwhk.cloudfront.net/canva_backend/d53e6f0c-3889-46e4-b8be-dd93d9dfe596.png');
  const [targetImage, setTargetImage] = useState('https://d3fulx9g4ogwhk.cloudfront.net/canva_backend/6be5eefe-ff18-4165-aa52-6dbcdf81ef75.jpeg');
  const [faceEnhance, setFaceEnhance] = useState(false);
  const [singleFace, setSingleFace] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSwap({ sourceImage, targetImage, apiVersion, faceEnhance, singleFace });
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card className="p-4">
        <p className="text-sm text-gray-300 text-center">
          <span className="font-semibold">Images only (no video)</span> • 
          v3: multi-face support • v4: single-face only
        </p>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* API Version Selector */}
        <Card className="p-4 sm:p-6" gradient>
          <label className="block text-sm font-medium text-gray-200 mb-3">
            API Version
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setApiVersion('v3')}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                apiVersion === 'v3'
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="text-white font-semibold mb-1 text-sm sm:text-base">v3 High-Quality</div>
              <div className="text-xs text-gray-400">Face detection • Multi-face</div>
            </button>
            <button
              type="button"
              onClick={() => setApiVersion('v4')}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                apiVersion === 'v4'
                  ? 'border-cyan-500 bg-cyan-500/20'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="text-white font-semibold mb-1 text-sm sm:text-base">v4 Simplified</div>
              <div className="text-xs text-gray-400">No detection • Single-face</div>
            </button>
          </div>
        </Card>

        {/* Webhook URL */}
        <Input
          label="Webhook URL"
          type="url"
          value={webhookUrl}
          onChange={(e) => onWebhookChange(e.target.value)}
          placeholder="https://your-webhook-url.com/webhook"
          icon={
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        />

        {/* Image Inputs with Previews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Input
                label="Target Image URL"
                type="url"
                value={targetImage}
                onChange={(e) => setTargetImage(e.target.value)}
                placeholder="https://example.com/target.jpg"
                required
              />
            </div>
            {targetImage && (
              <div className="flex-shrink-0 w-20 h-20 mt-7">
                <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-800 border border-gray-700">
                  <img
                    src={targetImage}
                    alt="Target preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).style.display = 'block';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.add('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center text-gray-500">
                    <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Input
                label="Source Image URL"
                type="url"
                value={sourceImage}
                onChange={(e) => setSourceImage(e.target.value)}
                placeholder="https://example.com/source.jpg"
                required
              />
            </div>
            {sourceImage && (
              <div className="flex-shrink-0 w-20 h-20 mt-7">
                <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-800 border border-gray-700">
                  <img
                    src={sourceImage}
                    alt="Source preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).style.display = 'block';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.add('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center text-gray-500">
                    <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        <Card className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {apiVersion === 'v3' && (
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={singleFace}
                  onChange={(e) => setSingleFace(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <span className="text-gray-200 group-hover:text-white transition-colors">
                  Single Face Detection
                </span>
              </label>
            )}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={faceEnhance}
                onChange={(e) => setFaceEnhance(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
              />
              <span className="text-gray-200 group-hover:text-white transition-colors">
                Face Enhancement
              </span>
            </label>
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
          disabled={!sourceImage || !targetImage}
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Swap Faces
        </Button>
      </form>
    </div>
  );
};

