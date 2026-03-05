export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'customer' | 'merchant' | 'courier';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'customer' | 'merchant' | 'courier';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
}
