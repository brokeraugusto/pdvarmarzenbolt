# Documentação da API

## Visão Geral

Documentação das APIs e serviços externos utilizados pela aplicação.

## Status Atual

⚠️ **Não implementado** - Integração com APIs ainda não foi desenvolvida.

## Arquitetura de API

### Cliente HTTP Base
```typescript
// services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

class ApiClient {
  private client: AxiosInstance

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or logout
          this.handleUnauthorized()
        }
        return Promise.reject(error)
      }
    )
  }

  private handleUnauthorized() {
    localStorage.removeItem('auth_token')
    window.location.href = '/login'
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config)
    return response.data
  }
}

export const apiClient = new ApiClient(
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'
)
```

## Serviços por Módulo

### Autenticação
```typescript
// services/authService.ts
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post('/auth/login', credentials)
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return apiClient.post('/auth/register', credentials)
  }

  async logout(): Promise<void> {
    return apiClient.post('/auth/logout')
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post('/auth/refresh', { refreshToken })
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password', { email })
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiClient.post('/auth/reset-password', { token, password })
  }
}

export const authService = new AuthService()
```

### Usuários
```typescript
// services/userService.ts
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateUserRequest {
  name?: string
  avatar?: string
}

class UserService {
  async getProfile(): Promise<User> {
    return apiClient.get('/users/profile')
  }

  async updateProfile(data: UpdateUserRequest): Promise<User> {
    return apiClient.put('/users/profile', data)
  }

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('avatar', file)
    
    return apiClient.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  async deleteAccount(): Promise<void> {
    return apiClient.delete('/users/profile')
  }
}

export const userService = new UserService()
```

## Hooks de API

### Hook genérico para requisições
```typescript
// hooks/useApi.ts
import { useState, useEffect } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let isCancelled = false

    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const data = await apiCall()
        if (!isCancelled) {
          setState({ data, loading: false, error: null })
        }
      } catch (error) {
        if (!isCancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, dependencies)

  return state
}
```

### Hook para mutações
```typescript
// hooks/useMutation.ts
import { useState } from 'react'

interface MutationState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useMutation<T, P>(
  mutationFn: (params: P) => Promise<T>
): [
  (params: P) => Promise<void>,
  MutationState<T>
] {
  const [state, setState] = useState<MutationState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const mutate = async (params: P) => {
    setState({ data: null, loading: true, error: null })

    try {
      const data = await mutationFn(params)
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  return [mutate, state]
}
```

## Tratamento de Erros

### Error Handler Global
```typescript
// utils/errorHandler.ts
import { toast } from 'react-hot-toast'

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

class ErrorHandler {
  handle(error: any): ApiError {
    if (error.response) {
      // API error response
      const apiError: ApiError = {
        message: error.response.data?.message || 'Server error',
        code: error.response.data?.code,
        status: error.response.status,
        details: error.response.data?.details,
      }

      this.showUserFriendlyMessage(apiError)
      return apiError
    }

    if (error.request) {
      // Network error
      const networkError: ApiError = {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      }

      toast.error(networkError.message)
      return networkError
    }

    // Generic error
    const genericError: ApiError = {
      message: error.message || 'An unexpected error occurred',
      code: 'GENERIC_ERROR',
    }

    toast.error(genericError.message)
    return genericError
  }

  private showUserFriendlyMessage(error: ApiError) {
    const userMessages: Record<string, string> = {
      'VALIDATION_ERROR': 'Please check your input and try again',
      'UNAUTHORIZED': 'Please log in to continue',
      'FORBIDDEN': 'You don\'t have permission to perform this action',
      'NOT_FOUND': 'The requested resource was not found',
      'RATE_LIMITED': 'Too many requests. Please try again later',
    }

    const message = userMessages[error.code || ''] || error.message
    toast.error(message)
  }
}

export const errorHandler = new ErrorHandler()
```

## Cache e Estado

### React Query Integration (Recomendado)
```typescript
// hooks/queries/useUser.ts
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { userService } from '../services/userService'

export const useUserProfile = () => {
  return useQuery(
    ['user', 'profile'],
    () => userService.getProfile(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  )
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation(
    (data: UpdateUserRequest) => userService.updateProfile(data),
    {
      onSuccess: (user) => {
        queryClient.setQueryData(['user', 'profile'], user)
        toast.success('Profile updated successfully')
      },
      onError: (error) => {
        errorHandler.handle(error)
      },
    }
  )
}
```

## Validação de Dados

### Schema Validation com Zod
```typescript
// schemas/userSchema.ts
import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(2).max(50),
  avatar: z.string().url().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const updateUserSchema = userSchema.pick({
  name: true,
  avatar: true,
}).partial()

export type User = z.infer<typeof userSchema>
export type UpdateUserRequest = z.infer<typeof updateUserSchema>
```

## Configuração de Ambiente

```env
# .env
REACT_APP_API_BASE_URL=https://api.yourapp.com
REACT_APP_API_TIMEOUT=10000
REACT_APP_MAX_RETRIES=3
```

## Mock Service (Desenvolvimento)

```typescript
// services/mockService.ts
import { User } from '../types/user'

class MockService {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.delay(1000)
    
    if (credentials.email === 'test@test.com' && credentials.password === 'password') {
      return {
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test User',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
      }
    }

    throw new Error('Invalid credentials')
  }

  async getProfile(): Promise<User> {
    await this.delay(500)
    
    return {
      id: '1',
      email: 'test@test.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

export const mockService = new MockService()
```

## Testes

### API Service Tests
```typescript
// __tests__/authService.test.ts
import { authService } from '../services/authService'
import { apiClient } from '../services/api'

jest.mock('../services/api')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should login successfully', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@test.com', name: 'Test' },
      accessToken: 'token',
      refreshToken: 'refresh',
    }

    mockedApiClient.post.mockResolvedValue(mockResponse)

    const result = await authService.login({
      email: 'test@test.com',
      password: 'password',
    })

    expect(result).toEqual(mockResponse)
    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@test.com',
      password: 'password',
    })
  })
})
```

## Próximos Passos

1. [ ] Implementar cliente HTTP base
2. [ ] Criar serviços de API por módulo
3. [ ] Implementar tratamento de erros
4. [ ] Configurar React Query para cache
5. [ ] Adicionar validação de schemas
6. [ ] Implementar mock services
7. [ ] Criar testes unitários
8. [ ] Documentar endpoints da API
9. [ ] Implementar rate limiting no cliente
10. [ ] Adicionar monitoramento de performance

## Recursos Externos

- [Axios Documentation](https://axios-http.com/docs/intro)
- [React Query Guide](https://react-query.tanstack.com/)
- [Zod Schema Validation](https://zod.dev/)
- [API Error Handling Best Practices](https://blog.postman.com/rest-api-error-handling-best-practices/)