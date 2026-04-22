import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  email: string;
  isPro: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'dm_token';
const USER_KEY = 'dm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _user = signal<AuthUser | null>(
    JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  );

  isLoggedIn = computed(() => !!this._token());
  currentUser = computed(() => this._user());
  token = computed(() => this._token());

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
    );
    this.setSession(res);
  }

  /** Paso 1 del registro: solicitar código de verificación */
  async sendVerificationCode(email: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.post<{ message: string }>(`${this.apiUrl}/send-code`, { email })
    );
  }

  /** Paso 2 del registro: registrarse con el código verificado */
  async register(email: string, password: string, code: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/register`, { email, password, code })
    );
    this.setSession(res);
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private setSession(res: AuthResponse): void {
    this._token.set(res.access_token);
    this._user.set(res.user);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }
}
