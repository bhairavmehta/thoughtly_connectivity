
import { useAuth } from '@/contexts/AuthContext';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

// Updated the API endpoint to the new URL
const API_BASE_URL = 'https://api.knoetik.ai';

export const useApi = () => {
  const { getApiToken } = useAuth();

  const fetchFromApi = async (endpoint: string, options: ApiOptions = {}) => {
    const token = getApiToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const { method = 'GET', body, headers = {} } = options;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      // Handle different error status codes
      let errorMessage = 'API request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  };

  return {
    fetchFromApi,
    
    // Convenience methods for common HTTP methods
    get: (endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) => 
      fetchFromApi(endpoint, { ...options, method: 'GET' }),
      
    post: (endpoint: string, data: any, options?: Omit<ApiOptions, 'method' | 'body'>) => 
      fetchFromApi(endpoint, { ...options, method: 'POST', body: data }),
      
    put: (endpoint: string, data: any, options?: Omit<ApiOptions, 'method' | 'body'>) => 
      fetchFromApi(endpoint, { ...options, method: 'PUT', body: data }),
      
    delete: (endpoint: string, options?: Omit<ApiOptions, 'method'>) => 
      fetchFromApi(endpoint, { ...options, method: 'DELETE' }),
  };
};
