import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { isVideoUrl } from '../../utils/file';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultUrl: string | null;
}

export const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, resultUrl }) => {
  if (!resultUrl) return null;

  const isVideo = isVideoUrl(resultUrl);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = isVideo ? 'face-swap-result.mp4' : 'face-swap-result.png';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Face Swap Result" size="xl">
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-black/30 rounded-xl p-2 sm:p-4 max-h-[60vh] sm:max-h-[70vh] overflow-auto">
          {isVideo ? (
            <video
              src={resultUrl}
              controls
              autoPlay
              loop
              className="w-full h-auto max-h-[55vh] sm:max-h-[65vh] object-contain rounded-lg"
            >
              Your browser does not support video playback.
            </video>
          ) : (
            <img
              src={resultUrl}
              alt="Face Swap Result"
              className="w-full h-auto max-h-[55vh] sm:max-h-[65vh] object-contain rounded-lg"
            />
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button onClick={handleDownload} className="flex-1">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download {isVideo ? 'Video' : 'Image'}
          </Button>
          <Button onClick={onClose} variant="ghost" className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

