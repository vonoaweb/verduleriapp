// ─── API Client ──────────────────────────────────
// Centraliza todas las llamadas HTTP al backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// URL base del API para construir enlaces directos (ej. imagen QR de un pedido)
export const apiBaseUrl = API_URL;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  setToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  setRefreshToken(token: string) {
    localStorage.setItem('refreshToken', token);
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers: customHeaders, ...rest } = options;

    // Build URL with query params
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    // Build headers
    const headers: Record<string, string> = {
      ...(customHeaders as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type for non-FormData requests
    if (!(rest.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...rest, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error de red' }));

      // Si el token expiró, intentar refresh
      if (response.status === 401 && this.getToken()) {
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          // Reintentar la petición original
          headers['Authorization'] = `Bearer ${this.getToken()}`;
          const retryResponse = await fetch(url, { ...rest, headers });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
        // Si no se pudo refrescar, limpiar tokens
        this.clearTokens();
        window.dispatchEvent(new Event('auth:logout'));
      }

      throw new ApiError(response.status, error.error || 'Error desconocido', error.details);
    }

    return response.json();
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.accessToken);
        this.setRefreshToken(data.refreshToken);
        return true;
      }
    } catch {
      // Refresh falló
    }

    return false;
  }

  // ─── HTTP Methods ───────────────────────────────
  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ─── Warmup ─────────────────────────────────────
  // Despierta el backend (Render free se duerme). Se llama al cargar la app
  // para que el servidor se vaya calentando mientras el usuario navega.
  warmup(): void {
    fetch(`${this.baseUrl}/health`, { method: 'GET' }).catch(() => {
      /* silencioso: solo es para despertar el backend */
    });
  }

  // ─── Upload ─────────────────────────────────────
  upload<T>(endpoint: string, file: File, fieldName = 'image') {
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

// ─── Error class ──────────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Singleton instance ───────────────────────────
export const api = new ApiClient(API_URL);
export default api;
