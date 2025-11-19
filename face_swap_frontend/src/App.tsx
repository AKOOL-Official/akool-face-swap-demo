import { useState, useEffect } from 'react';
import { Container } from './components/layout/Container';
import { Header } from './components/layout/Header';
import { Tabs } from './components/ui/Tabs';
import { Modal } from './components/ui/Modal';
import { AuthForm } from './components/features/AuthForm';
import { ImageSwap } from './components/features/ImageSwap';
import { VideoSwap } from './components/features/VideoSwap';
import { ResultModal } from './components/features/ResultModal';
import { StatusDisplay } from './components/features/StatusDisplay';
import { apiService } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import { AuthMethod, AuthType, TabType } from './types';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [authType, setAuthType] = useState<AuthType>('apikey');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('image-v3');
  const [webhookUrl, setWebhookUrl] = useState('https://restaurant-site-highlights-clinic.trycloudflare.com/api/webhook');
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [credit, setCredit] = useState<number | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // WebSocket
  const { status: wsStatus } = useWebSocket('http://localhost:3008');

  // Handle WebSocket status updates
  useEffect(() => {
    if (!wsStatus) return;

    setIsProcessing(wsStatus.status !== 3 && wsStatus.status !== 4);
    setStatusMessage(wsStatus.message);

    if (wsStatus.type === 'error') {
      alert(wsStatus.message);
      setIsProcessing(false);
    }

    if (wsStatus.status === 3 && wsStatus.data?.url) {
      setResultUrl(wsStatus.data.url);
      setShowResultModal(true);
      setIsProcessing(false);
    }
  }, [wsStatus]);

  // Authentication Handler
  const handleAuth = async (
    tokenValue: string,
    method: AuthMethod,
    clientId?: string,
    clientSecret?: string
  ) => {
    setIsAuthLoading(true);
    try {
      if (method === 'credentials' && clientId && clientSecret) {
        const response = await apiService.getToken(clientId, clientSecret);
        setToken(response.data.token);
        setAuthType('bearer');
      } else {
        setToken(tokenValue);
        setAuthType('apikey');
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Authentication failed. Please check your credentials.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Check Balance Handler
  const handleCheckBalance = async () => {
    setIsBalanceLoading(true);
    try {
      const response = await apiService.getQuotaInfo(token, authType) as { data: { credit: number } };
      setCredit(response.data.credit);
      setShowCreditModal(true);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      alert('Failed to fetch balance');
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Image Swap Handler
  const handleImageSwap = async (config: {
    sourceImage: string | string[];
    targetImage: string;
    apiVersion: 'v3' | 'v4';
    faceEnhance: boolean;
    singleFace: boolean;
  }) => {
    setIsProcessing(true);
    setStatusMessage('Starting face swap process...');
    setResultUrl(null);

    try {
      if (config.apiVersion === 'v4') {
        // V4 Simplified - No face detection
        const sourceImagePath = Array.isArray(config.sourceImage) ? config.sourceImage[0] : config.sourceImage;
        const swapData = {
          targetImage: [{ path: config.targetImage }],
          sourceImage: [{ path: sourceImagePath }],
          model_name: 'akool_faceswap_image_hq',
          webhookUrl,
          face_enhance: config.faceEnhance,
        };

        await apiService.faceSwapV4Image(swapData, token, authType);
        setStatusMessage('Request sent, waiting for processing...');
      } else {
        // V3 - With face detection for multi-face support
        setStatusMessage('Detecting faces in images...');
        
        const sourceImages = Array.isArray(config.sourceImage) ? config.sourceImage : [config.sourceImage];
        
        // Detect faces in all source images and target image
        const detectionPromises = [
          ...sourceImages.map(img => 
            apiService.detectFace(
              { single_face: false, image_url: img },
              token,
              authType
            )
          ),
          apiService.detectFace(
            { single_face: false, image_url: config.targetImage },
            token,
            authType
          ),
        ];

        const detectionResults = await Promise.all(detectionPromises);
        
        // Extract landmarks for sources and target
        const sourceLandmarks = detectionResults.slice(0, -1).map(result => {
          const data = result as { landmarks_str: string | string[] };
          return Array.isArray(data.landmarks_str) ? data.landmarks_str[0] : data.landmarks_str;
        });
        
        const targetData = detectionResults[detectionResults.length - 1] as { landmarks_str: string | string[] };
        const targetLandmarks = Array.isArray(targetData.landmarks_str) 
          ? targetData.landmarks_str 
          : [targetData.landmarks_str];

        // Validate we have matching counts
        if (sourceLandmarks.length !== targetLandmarks.length) {
          throw new Error(
            `Mismatch: ${sourceLandmarks.length} source face(s) but ${targetLandmarks.length} target face(s). ` +
            `Please provide ${targetLandmarks.length} source image(s).`
          );
        }

        setStatusMessage('Faces detected, starting swap...');

        // Build arrays with one-to-one mapping
        const swapData = {
          sourceImage: sourceImages.map((path, i) => ({ 
            path, 
            opts: sourceLandmarks[i] 
          })),
          targetImage: targetLandmarks.map((opts, i) => ({ 
            path: config.targetImage, 
            opts 
          })),
          face_enhance: config.faceEnhance ? 1 : 0,
          modifyImage: config.targetImage,
          webhookUrl,
        };

        await apiService.faceSwapV3Image(swapData, token, authType);
        setStatusMessage('Request sent, waiting for processing...');
      }
    } catch (error) {
      console.error('Face swap failed:', error);
      setStatusMessage(error instanceof Error ? error.message : 'Face swap failed');
      setIsProcessing(false);
    }
  };

  // Video Swap Handler
  const handleVideoSwap = async (config: {
    sourceImage: string;
    targetImage: string;
    targetVideo: string;
    faceEnhance: boolean;
  }) => {
    setIsProcessing(true);
    setStatusMessage('Starting video face swap...');
    setResultUrl(null);

    try {
      setStatusMessage('Detecting faces...');

      const [sourceDetection, targetDetection] = await Promise.all([
        apiService.detectFace(
          { single_face: false, image_url: config.sourceImage },
          token,
          authType
        ),
        apiService.detectFace(
          { single_face: false, image_url: config.targetImage },
          token,
          authType
        ),
      ]);

      const sourceData = sourceDetection as { landmarks_str: string | string[] };
      const targetData = targetDetection as { landmarks_str: string | string[] };

      const sourceOpts = Array.isArray(sourceData.landmarks_str)
        ? sourceData.landmarks_str[0]
        : sourceData.landmarks_str;
      const targetOpts = Array.isArray(targetData.landmarks_str)
        ? targetData.landmarks_str[0]
        : targetData.landmarks_str;

      setStatusMessage('Faces detected, processing video...');

      const swapData = {
        sourceImage: [{ path: config.sourceImage, opts: sourceOpts }],
        targetImage: [{ path: config.targetImage, opts: targetOpts }],
        face_enhance: config.faceEnhance ? 1 : 0,
        modifyVideo: config.targetVideo,
        webhookUrl,
      };

      await apiService.faceSwapV3Video(swapData, token, authType);
      setStatusMessage('Video processing started, this may take a while...');
    } catch (error) {
      console.error('Video swap failed:', error);
      setStatusMessage(error instanceof Error ? error.message : 'Video swap failed');
      setIsProcessing(false);
    }
  };

  // Tabs configuration
  const tabs = [
    {
      id: 'image-v3' as TabType,
      label: 'Image v3 High Quality',
      description: 'face detection • multi-face',
    },
    {
      id: 'image-v4' as TabType,
      label: 'Image v4 Simplified',
      description: 'no detection • single-face',
    },
    {
      id: 'video-v3' as TabType,
      label: 'Video v3',
      description: 'face detection • multi-face',
    },
  ];

  if (!isAuthenticated) {
    return <AuthForm onAuth={handleAuth} isLoading={isAuthLoading} />;
  }

  return (
    <Container>
      <Header onCheckBalance={handleCheckBalance} isLoading={isBalanceLoading} />

      <div className="space-y-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabType)} />

        {activeTab === 'image-v3' ? (
          <ImageSwap
            apiVersion="v3"
            onSwap={handleImageSwap}
            webhookUrl={webhookUrl}
            onWebhookChange={setWebhookUrl}
            isLoading={isProcessing}
            token={token}
            authType={authType}
          />
        ) : activeTab === 'image-v4' ? (
          <ImageSwap
            apiVersion="v4"
            onSwap={handleImageSwap}
            webhookUrl={webhookUrl}
            onWebhookChange={setWebhookUrl}
            isLoading={isProcessing}
            token={token}
            authType={authType}
          />
        ) : (
          <VideoSwap
            onSwap={handleVideoSwap}
            webhookUrl={webhookUrl}
            onWebhookChange={setWebhookUrl}
            isLoading={isProcessing}
          />
        )}

        <StatusDisplay status={statusMessage} isLoading={isProcessing} />
      </div>

      {/* Credit Balance Modal */}
      <Modal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        title="Credit Balance"
      >
        <div className="text-center py-6">
          <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            {credit?.toFixed(2)}
          </div>
          <div className="text-gray-400">Available Credits</div>
        </div>
      </Modal>

      {/* Result Modal */}
      <ResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        resultUrl={resultUrl}
      />
    </Container>
  );
}

export default App;


