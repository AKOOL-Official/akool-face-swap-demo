import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { ApiVersion } from '../../types';
import { apiService } from '../../services/api';

interface ImageSwapProps {
  apiVersion: ApiVersion;
  onSwap: (config: {
    sourceImage: string | string[];
    targetImage: string;
    apiVersion: ApiVersion;
    faceEnhance: boolean;
    singleFace: boolean;
  }) => void;
  webhookUrl: string;
  onWebhookChange: (url: string) => void;
  isLoading?: boolean;
  token?: string;
  authType?: 'apikey' | 'bearer';
}

export const ImageSwap: React.FC<ImageSwapProps> = ({
  apiVersion,
  onSwap,
  webhookUrl,
  onWebhookChange,
  isLoading,
  token = '',
  authType = 'apikey',
}) => {
  // V4: Single source image (original behavior)
  const [sourceImage, setSourceImage] = useState('https://d3fulx9g4ogwhk.cloudfront.net/canva_backend/d53e6f0c-3889-46e4-b8be-dd93d9dfe596.png');
  
  // V3: Multiple source images (dynamic based on detected faces)
  const [sourceImages, setSourceImages] = useState<string[]>([
    'https://d3fulx9g4ogwhk.cloudfront.net/canva_backend/d53e6f0c-3889-46e4-b8be-dd93d9dfe596.png'
  ]);
  
  const [targetImage, setTargetImage] = useState('https://d3fulx9g4ogwhk.cloudfront.net/canva_backend/6be5eefe-ff18-4165-aa52-6dbcdf81ef75.jpeg');
  const [faceEnhance, setFaceEnhance] = useState(false);
  const [singleFace, setSingleFace] = useState(false); // Default to multi-face for V3
  
  // Face detection state
  const [detectedFaces, setDetectedFaces] = useState<number>(1);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string>('');

  // Debounced face detection for V3 when target image changes
  const detectFacesInTarget = useCallback(async (imageUrl: string) => {
    if (apiVersion !== 'v3' || !imageUrl || !token) return;
    
    setIsDetecting(true);
    setDetectionError('');
    
    try {
      const response = await apiService.detectFace(
        { single_face: false, image_url: imageUrl },
        token,
        authType
      ) as { landmarks_str: string | string[] };
      
      const landmarksArray = Array.isArray(response.landmarks_str) 
        ? response.landmarks_str 
        : [response.landmarks_str];
      
      const faceCount = landmarksArray.filter(l => l && l.trim()).length;
      
      if (faceCount === 0) {
        setDetectionError('No faces detected in target image. Please try another image.');
        setDetectedFaces(1);
        setSourceImages(['']);
      } else if (faceCount > 8) {
        setDetectionError(`Detected ${faceCount} faces. API supports max 8. Using first 8.`);
        setDetectedFaces(8);
        setSourceImages(Array(8).fill(''));
      } else {
        setDetectedFaces(faceCount);
        // Preserve existing source URLs if available, fill rest with empty strings
        setSourceImages(prev => {
          const newSources = Array(faceCount).fill('');
          for (let i = 0; i < Math.min(prev.length, faceCount); i++) {
            newSources[i] = prev[i] || '';
          }
          return newSources;
        });
      }
    } catch (error) {
      console.error('Face detection failed:', error);
      setDetectionError('Face detection failed. Using single face mode.');
      setDetectedFaces(1);
      setSourceImages(['']);
    } finally {
      setIsDetecting(false);
    }
  }, [apiVersion, token, authType]);

  // Trigger face detection when target image changes (V3 only)
  useEffect(() => {
    let timeoutId: number;
    
    if (apiVersion === 'v3' && targetImage && token) {
      // Debounce by 800ms to avoid too many API calls while typing
      timeoutId = window.setTimeout(() => {
        detectFacesInTarget(targetImage);
      }, 800);
    }
    
    return () => window.clearTimeout(timeoutId);
  }, [targetImage, apiVersion, token, detectFacesInTarget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (apiVersion === 'v3') {
      // V3: Use array of source images
      onSwap({ 
        sourceImage: sourceImages, 
        targetImage, 
        apiVersion, 
        faceEnhance, 
        singleFace 
      });
    } else {
      // V4: Use single source image
      onSwap({ 
        sourceImage, 
        targetImage, 
        apiVersion, 
        faceEnhance, 
        singleFace 
      });
    }
  };

  const updateSourceImage = (index: number, value: string) => {
    setSourceImages(prev => {
      const newSources = [...prev];
      newSources[index] = value;
      return newSources;
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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

        {/* Target Image Input */}
        <Card className="p-4 sm:p-6">
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Input
                label="Target Image URL (Image to modify)"
                type="url"
                value={targetImage}
                onChange={(e) => setTargetImage(e.target.value)}
                placeholder="https://example.com/target.jpg"
                required
              />
              {apiVersion === 'v3' && (
                <div className="mt-2">
                  {isDetecting && (
                    <p className="text-xs text-blue-400 flex items-center gap-2">
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Detecting faces...
                    </p>
                  )}
                  {!isDetecting && detectedFaces > 0 && !detectionError && (
                    <p className="text-xs text-green-400 flex items-center gap-2">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Detected {detectedFaces} face{detectedFaces > 1 ? 's' : ''} - provide {detectedFaces} source image{detectedFaces > 1 ? 's' : ''} below
                    </p>
                  )}
                  {detectionError && (
                    <p className="text-xs text-yellow-400 flex items-center gap-2">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {detectionError}
                    </p>
                  )}
                </div>
              )}
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
        </Card>

        {/* Source Images - Dynamic for V3, Single for V4 */}
        <Card className="p-4 sm:p-6">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Source {apiVersion === 'v3' && detectedFaces > 1 ? 'Faces' : 'Face'} 
              {apiVersion === 'v3' && ` (${detectedFaces} required)`}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {apiVersion === 'v3' 
                ? 'Provide pre-cropped single-face images for each detected target face'
                : 'Single face that will be swapped into the target'}
            </p>
          </div>

          <div className="space-y-4">
            {apiVersion === 'v3' ? (
              // V3: Multiple source inputs based on detected faces
              sourceImages.map((source, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      label={`Source Face ${index + 1}${detectedFaces > 1 ? ` → Target Face ${index + 1}` : ''}`}
                      type="url"
                      value={source}
                      onChange={(e) => updateSourceImage(index, e.target.value)}
                      placeholder={`https://example.com/source-${index + 1}.jpg (pre-cropped face)`}
                      required
                    />
                  </div>
                  {source && (
                    <div className="flex-shrink-0 w-20 h-20 mt-7">
                      <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-800 border border-cyan-500/50">
                        <img
                          src={source}
                          alt={`Source ${index + 1} preview`}
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
              ))
            ) : (
              // V4: Single source input
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
            )}
          </div>
        </Card>

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
          isLoading={isLoading || isDetecting}
          disabled={
            apiVersion === 'v3'
              ? !targetImage || sourceImages.some(s => !s.trim()) || isDetecting
              : !sourceImage || !targetImage
          }
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

