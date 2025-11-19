export type AuthMethod = 'token' | 'credentials';
export type AuthType = 'apikey' | 'bearer';
export type ApiVersion = 'v3' | 'v4';
export type TabType = 'image' | 'video';

export interface FaceSwapStatus {
  type: 'error' | 'status_update';
  status?: number;
  message: string;
  data?: {
    url?: string;
    _id?: string;
  };
}

export interface AuthState {
  token: string;
  authType: AuthType;
  isAuthenticated: boolean;
}

export interface FaceSwapConfig {
  sourceImage: string;
  targetImage: string;
  targetVideo?: string;
  apiVersion: ApiVersion;
  webhookUrl: string;
  faceEnhance: boolean;
  singleFace: boolean;
}


