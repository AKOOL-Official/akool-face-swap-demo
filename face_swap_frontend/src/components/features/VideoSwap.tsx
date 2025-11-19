import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface VideoSwapProps {
  onSwap: (config: {
    sourceImage: string;
    targetImage: string;
    targetVideo: string;
    faceEnhance: boolean;
  }) => void;
  webhookUrl: string;
  onWebhookChange: (url: string) => void;
  isLoading?: boolean;
}

export const VideoSwap: React.FC<VideoSwapProps> = ({
  onSwap,
  webhookUrl,
  onWebhookChange,
  isLoading,
}) => {
  const [sourceImage, setSourceImage] = useState('https://d21ksh0k4smeql.cloudfront.net/crop_1705475757658-3362-0-1705475757797-3713.png');
  const [targetImage, setTargetImage] = useState('https://d21ksh0k4smeql.cloudfront.net/crop_1705479323786-0321-0-1705479323896-7695.png');
  const [targetVideo, setTargetVideo] = useState('https://d21ksh0k4smeql.cloudfront.net/avatar_01-1705479314627-0092.mp4');
  const [faceEnhance, setFaceEnhance] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSwap({ sourceImage, targetImage, targetVideo, faceEnhance });
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

        {/* Image Inputs with Previews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Source Image</span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <Input
                  type="url"
                  value={sourceImage}
                  onChange={(e) => setSourceImage(e.target.value)}
                  placeholder="Face to swap in"
                  required
                />
              </div>
              {sourceImage && (
                <div className="flex-shrink-0 w-20 h-20">
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

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Target Image</span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <Input
                  type="url"
                  value={targetImage}
                  onChange={(e) => setTargetImage(e.target.value)}
                  placeholder="Frame from video"
                  required
                />
              </div>
              {targetImage && (
                <div className="flex-shrink-0 w-20 h-20">
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
          </div>
        </div>

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
          isLoading={isLoading}
          disabled={!sourceImage || !targetImage || !targetVideo}
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

