import axios, { AxiosRequestConfig } from 'axios';
import { AuthType } from '../types';

const API_BASE = 'http://localhost:3008/api/proxy';

class ApiService {
  private getAuthHeaders(token: string, authType: AuthType): Record<string, string> {
    return authType === 'bearer'
      ? { 'Authorization': `Bearer ${token}` }
      : { 'x-api-key': token };
  }

  private async request<T>(
    url: string,
    token: string,
    authType: AuthType,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const headers = {
      ...this.getAuthHeaders(token, authType),
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    const response = await axios({ url, headers, ...config });
    return response.data;
  }

  async getToken(clientId: string, clientSecret: string) {
    return axios.post(`${API_BASE}/getToken`, { clientId, clientSecret });
  }

  async getQuotaInfo(token: string, authType: AuthType) {
    return this.request(`${API_BASE}/quota/info`, token, authType, { method: 'GET' });
  }

  async detectFace(data: Record<string, unknown>, token: string, authType: AuthType) {
    return this.request(`${API_BASE}/detect`, token, authType, {
      method: 'POST',
      data,
    });
  }

  async faceSwapV3Image(data: unknown, token: string, authType: AuthType) {
    return this.request(`${API_BASE}/faceswap/v3/image`, token, authType, {
      method: 'POST',
      data,
    });
  }

  async faceSwapV4Image(data: unknown, token: string, authType: AuthType) {
    return this.request(`${API_BASE}/faceswap/v4/image`, token, authType, {
      method: 'POST',
      data,
    });
  }

  async faceSwapV3Video(data: unknown, token: string, authType: AuthType) {
    return this.request(`${API_BASE}/faceswap/v3/video`, token, authType, {
      method: 'POST',
      data,
    });
  }
}

export const apiService = new ApiService();


