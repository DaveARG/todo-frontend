import { User } from './user.model'

export interface LoginRequest {
  email: string
  password: string
}

export interface CreateUserRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  success: boolean
  data: {
    accessToken: string
    refreshToken: string
    user: User
  }
}

export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponse {
  success: boolean
  data: {
    accessToken: string
    refreshToken: string
  }
}

export interface LogoutRequest {
  refreshToken: string
}

export interface LogoutAllResponse {
  success: boolean
  data: {
    deletedSessions: number
  }
}
