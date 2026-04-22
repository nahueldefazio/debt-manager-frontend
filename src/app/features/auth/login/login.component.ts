import {
  Component, ChangeDetectionStrategy, signal, inject, ElementRef, ViewChildren, QueryList, AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

type AuthMode = 'login' | 'register';
// Pasos del flujo de registro
type RegisterStep = 'email' | 'code' | 'password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private authService = inject(AuthService);

  mode = signal<AuthMode>('login');
  registerStep = signal<RegisterStep>('email');

  // Campos compartidos
  email = signal('');
  password = signal('');
  showPassword = signal(false);

  // Campos del código (6 dígitos separados)
  codeDigits = signal<string[]>(['', '', '', '', '', '']);

  // Estado UI
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // ── Helpers ─────────────────────────────────────────────────────────────
  setMode(m: AuthMode) {
    this.mode.set(m);
    this.resetForm();
  }

  resetForm() {
    this.registerStep.set('email');
    this.email.set('');
    this.password.set('');
    this.codeDigits.set(['', '', '', '', '', '']);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showPassword.set(false);
  }

  get codeValue(): string {
    return this.codeDigits().join('');
  }

  setEmail(v: string) { this.email.set(v); }
  setPassword(v: string) { this.password.set(v); }
  toggleShowPassword() { this.showPassword.set(!this.showPassword()); }

  // ── Input de código de 6 dígitos ─────────────────────────────────────────
  onDigitInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    const digits = [...this.codeDigits()];
    digits[index] = val;
    this.codeDigits.set(digits);

    if (val && index < 5) {
      const next = document.getElementById(`code-digit-${index + 1}`) as HTMLInputElement;
      next?.focus();
    }
  }

  onDigitKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const digits = [...this.codeDigits()];
      if (!digits[index] && index > 0) {
        digits[index - 1] = '';
        this.codeDigits.set(digits);
        const prev = document.getElementById(`code-digit-${index - 1}`) as HTMLInputElement;
        prev?.focus();
      } else {
        digits[index] = '';
        this.codeDigits.set(digits);
      }
    }
  }

  onDigitPaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const clean = text.replace(/\D/g, '').slice(0, 6);
    const digits = ['', '', '', '', '', ''];
    for (let i = 0; i < clean.length; i++) digits[i] = clean[i];
    this.codeDigits.set(digits);
    // Focus al último dígito rellenado
    const lastIdx = Math.min(clean.length, 5);
    const el = document.getElementById(`code-digit-${lastIdx}`) as HTMLInputElement;
    el?.focus();
  }

  // ── Acciones principales ─────────────────────────────────────────────────

  /** Paso 1 del registro: solicitar código */
  async submitEmail() {
    if (!this.email() || !this.email().includes('@')) {
      this.errorMessage.set('Ingresá un correo electrónico válido.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.authService.sendVerificationCode(this.email());
      this.successMessage.set(`Código enviado a ${this.email()}`);
      this.registerStep.set('code');
    } catch (err: any) {
      if (err.status === 409) {
        this.errorMessage.set('Ese correo ya está registrado. Iniciá sesión.');
      } else {
        this.errorMessage.set(err?.error?.message || 'Error al enviar el código. Intentá de nuevo.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Paso 2 del registro: verificar código */
  async submitCode() {
    if (this.codeValue.length !== 6) {
      this.errorMessage.set('Ingresá el código de 6 dígitos completo.');
      return;
    }
    // Solo avanzamos al paso de contraseña (la verificación real ocurre al registrar)
    this.errorMessage.set('');
    this.registerStep.set('password');
  }

  /** Paso 3 del registro: crear contraseña y finalizar */
  async submitPassword() {
    if (!this.password() || this.password().length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.authService.register(this.email(), this.password(), this.codeValue);
    } catch (err: any) {
      if (err.status === 400) {
        this.errorMessage.set('El código es inválido o ya expiró. Volvé al inicio.');
        this.registerStep.set('email');
        this.codeDigits.set(['', '', '', '', '', '']);
      } else if (err.status === 409) {
        this.errorMessage.set('Ese correo ya está registrado. Iniciá sesión.');
      } else {
        this.errorMessage.set(err?.error?.message || 'Error al crear la cuenta.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Login directo */
  async submitLogin() {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Completá todos los campos.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.authService.login(this.email(), this.password());
    } catch (err: any) {
      if (err.status === 401) {
        this.errorMessage.set('Email o contraseña incorrectos.');
      } else {
        this.errorMessage.set('Error al iniciar sesión. Intentá de nuevo.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Reenviar código */
  async resendCode() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.codeDigits.set(['', '', '', '', '', '']);
    try {
      await this.authService.sendVerificationCode(this.email());
      this.successMessage.set('Nuevo código enviado a tu correo.');
    } catch {
      this.errorMessage.set('Error al reenviar el código.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ── Password strength ────────────────────────────────────────────────────
  getPwStrengthClass(): string {
    const pw = this.password();
    if (!pw) return '';
    if (pw.length < 6) return 'weak';
    if (pw.length < 10 || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return 'medium';
    return 'strong';
  }

  getPwHint(): string {
    const cls = this.getPwStrengthClass();
    if (!cls) return '';
    if (cls === 'weak') return 'Contraseña débil';
    if (cls === 'medium') return 'Contraseña regular — agregá mayúsculas y números';
    return 'Contraseña fuerte ✓';
  }
}
