import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { apiService } from '../../services/api';

interface DetectedFace {
  path: string;
  opts: string;
}

interface VideoSwapProps {
  onSwap: (config: {
    sourceImages: string[];
    targetVideo: string;
    detectedTargetFaces: DetectedFace[];
    faceEnhance: boolean;
  }) => void;
  webhookUrl: string;
  onWebhookChange: (url: string) => void;
  isLoading?: boolean;
  token?: string;
  authType?: 'apikey' | 'bearer';
}

export const VideoSwap: React.FC<VideoSwapProps> = ({
  onSwap,
  webhookUrl,
  onWebhookChange,
  isLoading,
  token = '',
  authType = 'apikey',
}) => {
  // Source images - dynamic array based on detected faces
  const [sourceImages, setSourceImages] = useState<string[]>([
    'https://d21ksh0k4smeql.cloudfront.net/crop_1705475757658-3362-0-1705475757797-3713.png'
  ]);
  
  // Target video and reference image
  const [targetVideo, setTargetVideo] = useState('https://d21ksh0k4smeql.cloudfront.net/avatar_01-1705479314627-0092.mp4');
  const [targetReferenceImage, setTargetReferenceImage] = useState('https://d21ksh0k4smeql.cloudfront.net/crop_1705479323786-0321-0-1705479323896-7695.png');
  
  const [faceEnhance, setFaceEnhance] = useState(true);
  
  // Face detection state for video
  const [detectedTargetFaces, setDetectedTargetFaces] = useState<DetectedFace[]>([]);
  const [detectedFaceCount, setDetectedFaceCount] = useState<number>(1);
  const [isDetectingVideo, setIsDetectingVideo] = useState(false);
  const [videoDetectionError, setVideoDetectionError] = useState<string>('');

  // Detect faces in target reference image (represents video faces)
  const detectVideoFaces = useCallback(async (imageUrl: string) => {
    if (!imageUrl || !token) return;
    
    setIsDetectingVideo(true);
    setVideoDetectionError('');
    
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
        setVideoDetectionError('No faces detected in reference image. Please try another frame from the video.');
        setDetectedFaceCount(1);
        setDetectedTargetFaces([]);
        setSourceImages(['']);
      } else if (faceCount > 8) {
        setVideoDetectionError(`Detected ${faceCount} faces. API supports max 8. Using first 8.`);
        const limitedLandmarks = landmarksArray.slice(0, 8);
        setDetectedFaceCount(8);
        setDetectedTargetFaces(limitedLandmarks.map(opts => ({ 
          path: imageUrl, 
          opts: opts.split(':').slice(0, 4).join(':') // First 4 points only
        })));
        setSourceImages(Array(8).fill(''));
      } else {
        setDetectedFaceCount(faceCount);
        setDetectedTargetFaces(landmarksArray.map(opts => ({ 
          path: imageUrl, 
          opts: opts.split(':').slice(0, 4).join(':') // First 4 points only
        })));
        // Preserve existing source URLs if available
        setSourceImages(prev => {
          const newSources = Array(faceCount).fill('');
          for (let i = 0; i < Math.min(prev.length, faceCount); i++) {
            newSources[i] = prev[i] || '';
          }
          return newSources;
        });
      }
    } catch (error) {
      console.error('Video face detection failed:', error);
      setVideoDetectionError('Face detection failed. Please check the reference image or try again.');
      setDetectedFaceCount(1);
      setDetectedTargetFaces([]);
      setSourceImages(['']);
    } finally {
      setIsDetectingVideo(false);
    }
  }, [token, authType]);

  // Trigger face detection when target reference image changes
  useEffect(() => {
    let timeoutId: number;
    
    if (targetReferenceImage && token) {
      // Debounce by 800ms
      timeoutId = window.setTimeout(() => {
        detectVideoFaces(targetReferenceImage);
      }, 800);
    }
    
    return () => window.clearTimeout(timeoutId);
  }, [targetReferenceImage, token, detectVideoFaces]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all source images are filled
    if (sourceImages.some(s => !s.trim())) {
      alert(`Please provide all ${detectedFaceCount} source face images`);
      return;
    }
    
    // Validate we have detected faces
    if (detectedTargetFaces.length === 0) {
      alert('Please wait for face detection to complete or provide a valid reference image');
      return;
    }
    
    onSwap({ 
      sourceImages, 
      targetVideo, 
      detectedTargetFaces,
      faceEnhance 
    });
  };

  const updateSourceImage = (index: number, value: string) => {
    setSourceImages(prev => {
      const newSources = [...prev];
      newSources[index] = value;
      return newSources;
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
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

        {/* Target Reference Image for Face Detection */}
        <Card className="p-4 sm:p-6">
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Input
                label="Target Reference Image (Frame from video)"
                type="url"
                value={targetReferenceImage}
                onChange={(e) => setTargetReferenceImage(e.target.value)}
                placeholder="https://example.com/video-frame.jpg"
                required
              />
              <div className="mt-2">
                {isDetectingVideo && (
                  <p className="text-xs text-blue-400 flex items-center gap-2">
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Detecting faces in video frame...
                  </p>
                )}
                {!isDetectingVideo && detectedFaceCount > 0 && !videoDetectionError && (
                  <p className="text-xs text-green-400 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Detected {detectedFaceCount} face{detectedFaceCount > 1 ? 's' : ''} in video - provide {detectedFaceCount} source image{detectedFaceCount > 1 ? 's' : ''} below
                  </p>
                )}
                {videoDetectionError && (
                  <p className="text-xs text-yellow-400 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {videoDetectionError}
                  </p>
                )}
              </div>
            </div>
            {targetReferenceImage && (
              <div className="flex-shrink-0 w-20 h-20 mt-7">
                <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-800 border border-gray-700">
                  <img
                    src={targetReferenceImage}
                    alt="Reference preview"
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

        {/* Source Images - Dynamic based on detected faces */}
        <Card className="p-4 sm:p-6">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Source {detectedFaceCount > 1 ? 'Faces' : 'Face'} ({detectedFaceCount} required)
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Provide pre-cropped single-face images for each detected face in the video
            </p>
          </div>

          <div className="space-y-4">
            {sourceImages.map((source, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    label={`Source Face ${index + 1}${detectedFaceCount > 1 ? ` → Video Face ${index + 1}` : ''}`}
                    type="url"
                    value={source}
                    onChange={(e) => updateSourceImage(index, e.target.value)}
                    placeholder={`https://example.com/source-${index + 1}.jpg (pre-cropped face)`}
                    required
                  />
                </div>
                {source && (
                  <div className="flex-shrink-0 w-20 h-20 mt-7">
                    <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-800 border border-purple-500/50">
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
            ))}
          </div>
        </Card>

        {/* Video Input with Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Target Video</span>
          </div>
          <Input
            type="url"
            value={targetVideo}
            onChange={(e) => setTargetVideo(e.target.value)}
            placeholder="https://example.com/video.mp4"
            required
          />
          {targetVideo && (
            <Card className="p-4">
              <div className="text-xs text-gray-400 mb-3">Preview:</div>
              <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-lg bg-gray-800">
                <div className="aspect-video">
                  <video
                    src={targetVideo}
                    controls
                    className="w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLVideoElement).style.display = 'none';
                      (e.target as HTMLVideoElement).nextElementSibling?.classList.remove('hidden');
                    }}
                    onLoadedData={(e) => {
                      (e.target as HTMLVideoElement).style.display = 'block';
                      (e.target as HTMLVideoElement).nextElementSibling?.classList.add('hidden');
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="hidden absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Failed to load video
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Face Enhancement Toggle */}
        <Card className="p-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={faceEnhance}
              onChange={(e) => setFaceEnhance(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <div>
              <div className="text-gray-200 group-hover:text-white transition-colors font-medium">
                Face Enhancement
              </div>
              <div className="text-xs text-gray-400">Improve face quality in output</div>
            </div>
          </label>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          variant="secondary"
          isLoading={isLoading || isDetectingVideo}
          disabled={
            !targetVideo || 
            !targetReferenceImage || 
            sourceImages.some(s => !s.trim()) || 
            isDetectingVideo ||
            detectedTargetFaces.length === 0
          }
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Swap Video Faces
        </Button>
      </form>
    </div>
  );
};

