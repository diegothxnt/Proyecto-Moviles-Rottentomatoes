import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, personOutline,
  checkmarkCircle, closeCircle, eyeOutline, eyeOffOutline, timeOutline,
} from 'ionicons/icons';

const ONLY_LETTERS_AND_SPACES = /^[a-zA-Z\s]+$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const POPULAR_DOMAINS = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 
  'icloud.com', 'live.com', 'protonmail.com', 'aol.com'
];

// ⚡ Solo la primera parte del dominio (sin el .com)
const POPULAR_BASES = ['gmail', 'hotmail', 'outlook', 'yahoo', 'icloud', 'live', 'protonmail', 'aol'];

function levenshtein(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function safeNameValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v = (ctrl.value || '').trim();
  if (!v) return null;
  if (!ONLY_LETTERS_AND_SPACES.test(v)) return { pattern: true };
  return null;
}

function emailValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v = (ctrl.value || '').trim().toLowerCase();
  if (!v) return null;
  
  if (!EMAIL_REGEX.test(v)) return { pattern: true };
  if (v.includes('..')) return { pattern: true };
  if (v.endsWith('@example.com') || v.endsWith('.test')) return { testDomain: true };
  
  const domain = v.split('@')[1];
  
  // Si es un dominio popular exacto, está bien
  if (POPULAR_DOMAINS.includes(domain)) return null;

  // ⚡ Extraemos la primera parte del dominio (ej: 'hotm' de 'hotm.com')
  const domainBase = domain.split('.')[0];

  for (const base of POPULAR_BASES) {
    const distance = levenshtein(domainBase, base);
    
    // ⚡ Si la distancia es entre 1 y 3 letras, es un typo (ej. hotm vs hotmail, gamali vs gmail)
    if (distance > 0 && distance <= 3) {
      return { fakeDomain: true };
    }
  }

  return null;
}

function strongPassword(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value || '';
  if (!v) return null;
  const errs: ValidationErrors = {};
  if (v.length < 8) errs['minLength'] = true;
  if (!/[a-z]/.test(v)) errs['noLower'] = true;
  if (!/[A-Z]/.test(v)) errs['noUpper'] = true;
  if (!/\d/.test(v)) errs['noNumber'] = true;
  return Object.keys(errs).length ? errs : null;
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonIcon, IonSpinner],
  template: `
    <ion-content [fullscreen]="true" class="auth-content">
      <div class="poster-collage">
        <div class="poster p1"></div><div class="poster p2"></div>
        <div class="poster p3"></div><div class="poster p4"></div>
        <div class="poster p5"></div><div class="poster p6"></div>
      </div>
      <div class="vignette"></div>

      <div class="auth-wrapper">
        <div class="brand-block">
          <div class="brand">ROTTEN<span>TOMATOES</span></div>
        </div>

        <div class="flip-container">
          <div class="flip-inner" [class.flipped]="isSignup">
            <!-- LOGIN -->
            <div class="flip-side flip-front" [attr.inert]="isSignup ? '' : null">
              <div class="glass-card">
                <h2 class="card-title">Bienvenido de vuelta</h2>
                <p class="card-sub">Inicia sesión para continuar</p>

                <form [formGroup]="loginForm">
                  <div class="input-group">
                    <span class="input-icon"><ion-icon name="mail-outline"></ion-icon></span>
                    <input formControlName="email" type="email" inputmode="email" placeholder="Correo electrónico" class="input" maxlength="100" autocomplete="email" 
                           (keydown.space)="$event.preventDefault()" 
                           (input)="cleanEmail($event, loginForm, 'email')">
                  </div>
                  <div class="field-footer" *ngIf="loginEmail.touched || loginEmail.dirty">
                    <span class="error" *ngIf="loginEmail.invalid">{{ loginEmailError }}</span>
                    <span class="success" *ngIf="loginEmail.valid">✓ Correo válido</span>
                  </div>

                  <div class="input-group">
                    <span class="input-icon"><ion-icon name="lock-closed-outline"></ion-icon></span>
                    <input formControlName="password" [type]="showLoginPassword ? 'text' : 'password'" placeholder="Contraseña (mín. 8)" class="input" maxlength="64" autocomplete="current-password" (keydown.space)="$event.preventDefault()">
                    <button type="button" class="toggle-eye" (click)="showLoginPassword = !showLoginPassword" tabindex="-1">
                      <ion-icon [name]="showLoginPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                    </button>
                  </div>
                  <div class="field-footer" *ngIf="loginPassword.touched || loginPassword.dirty || loginPassword.value">
                    <span class="error" *ngIf="loginPassword.invalid">{{ loginPasswordError }}</span>
                    <span class="success" *ngIf="hasLoginMinLength">✓ Longitud correcta</span>
                  </div>

                  <div class="cooldown-notice" *ngIf="cooldownSeconds > 0">
                    <ion-icon name="time-outline"></ion-icon>
                    <span>Espera <strong>{{ cooldownSeconds }}s</strong> antes de reintentar</span>
                  </div>

                  <button type="button" class="btn-primary"
                    [disabled]="loginForm.invalid || loadingLogin || cooldownSeconds > 0"
                    (click)="login()">
                    <ion-spinner *ngIf="loadingLogin" name="dots"></ion-spinner>
                    <span *ngIf="!loadingLogin && cooldownSeconds === 0">Iniciar Sesión</span>
                    <span *ngIf="!loadingLogin && cooldownSeconds > 0">Bloqueado ({{ cooldownSeconds }}s)</span>
                  </button>

                  <p class="switch">
                    ¿No tienes cuenta? <a class="link-red" (click)="goToSignup()">Regístrate</a>
                  </p>
                </form>
              </div>
            </div>

            <!-- REGISTRO -->
            <div class="flip-side flip-back" [attr.inert]="!isSignup ? '' : null">
              <div class="glass-card">
                <h2 class="card-title">Crea tu cuenta</h2>
                <p class="card-sub">Únete a la comunidad de cinéfilos</p>

                <form [formGroup]="registerForm">
                  <div class="input-group">
                    <span class="input-icon"><ion-icon name="person-outline"></ion-icon></span>
                    <input formControlName="name" type="text" placeholder="Nombre completo" class="input" maxlength="50" autocomplete="name">
                  </div>
                  <div class="field-footer" *ngIf="regName.touched || regName.dirty">
                    <span class="error" *ngIf="regName.invalid">{{ regNameError }}</span>
                    <span class="success" *ngIf="regName.valid">✓ Nombre válido</span>
                  </div>

                  <div class="input-group">
                    <span class="input-icon"><ion-icon name="mail-outline"></ion-icon></span>
                    <input formControlName="email" type="email" inputmode="email" placeholder="Correo electrónico" class="input" maxlength="100" autocomplete="email" 
                           (keydown.space)="$event.preventDefault()" 
                           (input)="cleanEmail($event, registerForm, 'email')">
                  </div>
                  <div class="field-footer" *ngIf="regEmail.touched || regEmail.dirty">
                    <span class="error" *ngIf="regEmail.invalid">{{ regEmailError }}</span>
                    <span class="success" *ngIf="regEmail.valid">✓ Correo válido</span>
                  </div>

                  <div class="input-group">
                    <span class="input-icon"><ion-icon name="lock-closed-outline"></ion-icon></span>
                    <input formControlName="password" [type]="showRegPassword ? 'text' : 'password'" placeholder="Contraseña (mín. 8)" class="input" maxlength="64" autocomplete="new-password" (keydown.space)="$event.preventDefault()">
                    <button type="button" class="toggle-eye" (click)="showRegPassword = !showRegPassword" tabindex="-1">
                      <ion-icon [name]="showRegPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                    </button>
                  </div>

                  <div class="password-checklist" *ngIf="regPassword.value">
                    <div class="req" [class.ok]="hasRegMinLength"><ion-icon [name]="hasRegMinLength ? 'checkmark-circle' : 'close-circle'"></ion-icon> Mínimo 8 caracteres</div>
                    <div class="req" [class.ok]="hasRegUpper"><ion-icon [name]="hasRegUpper ? 'checkmark-circle' : 'close-circle'"></ion-icon> Al menos 1 mayúscula</div>
                    <div class="req" [class.ok]="hasRegLower"><ion-icon [name]="hasRegLower ? 'checkmark-circle' : 'close-circle'"></ion-icon> Al menos 1 minúscula</div>
                    <div class="req" [class.ok]="hasRegNumber"><ion-icon [name]="hasRegNumber ? 'checkmark-circle' : 'close-circle'"></ion-icon> Al menos 1 número</div>
                  </div>

                  <button type="button" class="btn-primary" [disabled]="registerForm.invalid || loadingRegister || cooldownSeconds > 0" (click)="register()">
                    <ion-spinner *ngIf="loadingRegister" name="dots"></ion-spinner>
                    <span *ngIf="!loadingRegister">Registrarme</span>
                  </button>

                  <p class="switch">
                    ¿Ya tienes cuenta? <a class="link-red" (click)="goToLogin()">Inicia sesión</a>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .auth-content { --background: #000; position: relative; overflow: hidden; }
    .poster-collage { position: fixed; inset: 0; opacity: 0.22; pointer-events: none; z-index: 0; }
    .poster { position: absolute; width: 140px; height: 210px; border-radius: 8px; filter: blur(1px) saturate(1.2); }
    .poster.p1 { top: 5%; left: 8%; transform: rotate(-8deg); background: linear-gradient(135deg, #192247, #461518); }
    .poster.p2 { top: 15%; right: 6%; transform: rotate(6deg); background: linear-gradient(135deg, #2d0a0a, #192247); }
    .poster.p3 { top: 45%; left: -4%; transform: rotate(-12deg); background: linear-gradient(135deg, #0f0f0f, #6f181d); }
    .poster.p4 { top: 55%; right: -2%; transform: rotate(10deg); background: linear-gradient(135deg, #1a0a0e, #192247); }
    .poster.p5 { bottom: 8%; left: 15%; transform: rotate(4deg); background: linear-gradient(135deg, #210e17, #461518); }
    .poster.p6 { bottom: 12%; right: 12%; transform: rotate(-6deg); background: linear-gradient(135deg, #0a0a1a, #2d0a0a); }
    .vignette { position: fixed; inset: 0; background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.85) 70%, #000 100%); pointer-events: none; z-index: 1; }
    .auth-wrapper { position: relative; z-index: 2; min-height: 100vh; padding: 40px 20px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; max-width: 460px; margin: 0 auto; }
    .brand-block { text-align: center; margin-bottom: 24px; }
    .brand { font-size: 32px; font-weight: 900; letter-spacing: -0.03em; color: #fff; line-height: 1; }
    .brand span { color: #e50914; }
    .flip-container { width: 100%; perspective: 2000px; }
    .flip-inner { display: grid; transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
    .flip-inner.flipped { transform: rotateY(180deg); }
    .flip-side { grid-area: 1 / 1; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .flip-back { transform: rotateY(180deg); }
    .glass-card { width: 100%; background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(20px) saturate(1.4); -webkit-backdrop-filter: blur(20px) saturate(1.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 32px 24px 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.7); text-align: center; }
    .card-title { font-size: 24px; font-weight: 800; color: #fff; margin: 0 0 6px; line-height: 1.2; text-align: center; }
    .card-sub { font-size: 13px; color: #b3b3b3; margin: 0 0 28px; text-align: center; }
    .input-group { position: relative; margin-bottom: 4px; }
    .input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #808080; font-size: 18px; pointer-events: none; z-index: 2; transition: color 0.2s ease; display: flex; align-items: center; }
    .toggle-eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #808080; font-size: 18px; cursor: pointer; z-index: 2; padding: 4px; display: flex; align-items: center; justify-content: center; }
    .toggle-eye:active { color: #e50914; }
    .input { width: 100%; min-height: 52px; color: #fff; padding: 0 48px; background: #1a1a1a; border-radius: 10px; border: 2px solid #1a1a1a; box-shadow: inset 3px 3px 10px rgba(0,0,0,0.9), inset -1px -1px 4px rgba(255,255,255,0.04); transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); font-size: 15px; outline: none; box-sizing: border-box; }
    .input::placeholder { color: #808080; opacity: 1; }
    .input:focus { border-color: #e50914; box-shadow: inset 3px 3px 10px rgba(0,0,0,0.9), inset -1px -1px 4px rgba(255,255,255,0.04), 0 0 0 3px rgba(229,9,20,0.15); }
    .input-group:focus-within .input-icon { color: #e50914; }
    .field-footer { display: flex; justify-content: space-between; align-items: center; padding: 4px 6px 12px; min-height: 20px; gap: 8px; text-align: left; }
    .field-footer .error { color: #e50914; font-size: 12px; flex: 1; }
    .field-footer .success { color: #46d369; font-size: 12px; flex: 1; }
    .password-checklist { background: rgba(0,0,0,0.4); border-radius: 8px; padding: 12px 14px; margin: 6px 0 12px; text-align: left; }
    .req { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #808080; padding: 3px 0; transition: color 0.2s; }
    .req ion-icon { font-size: 14px; color: #5a5a5a; }
    .req.ok { color: #46d369; }
    .req.ok ion-icon { color: #46d369; }
    .btn-primary { width: 100%; background: #e50914; color: #fff; border: none; border-radius: 10px; padding: 15px; font-weight: 700; font-size: 15px; letter-spacing: 0.02em; cursor: pointer; margin-top: 8px; box-shadow: 0 8px 24px rgba(229,9,20,0.35); transition: all 0.2s ease; text-transform: none; display: flex; justify-content: center; align-items: center; min-height: 50px; }
    .btn-primary:active { transform: scale(0.98); }
    .btn-primary[disabled] { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
    .switch { text-align: center; font-size: 13px; color: #b3b3b3; margin: 20px 0 0; }
    .link-red { color: #e50914; text-decoration: none; font-weight: 700; cursor: pointer; margin-left: 4px; }
    .link-red:hover { text-decoration: underline; }
    .cooldown-notice { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; background: #2d2d2d; border: 1px solid #e50914; border-left: 3px solid #e50914; border-radius: 8px; color: #fff; font-size: 13px; margin-bottom: 10px; animation: pulseBorder 1.5s ease-in-out infinite; }
    .cooldown-notice ion-icon { color: #e50914; font-size: 16px; flex-shrink: 0; }
    .cooldown-notice strong { color: #e50914; font-weight: 800; }
    @keyframes pulseBorder { 0%, 100% { border-color: #e50914; } 50% { border-color: #7a0a12; } }
  `],
})
export class AuthPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastController);
  private cd = inject(ChangeDetectorRef);

  isSignup = false;
  loadingLogin = false;
  loadingRegister = false;
  showLoginPassword = false;
  showRegPassword = false;

  failedAttempts = 0;
  cooldownSeconds = 0;
  cooldownInterval: ReturnType<typeof setInterval> | null = null;
  readonly maxAttempts = 10;
  private readonly COOLDOWN_TIME = 10;

  loginForm = this.fb.group({
    email: ['', [Validators.required, emailValidator, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
  });

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), safeNameValidator]],
    email: ['', [Validators.required, emailValidator, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64), strongPassword]],
  });

  constructor() {
    addIcons({ mailOutline, lockClosedOutline, personOutline, checkmarkCircle, closeCircle, eyeOutline, eyeOffOutline, timeOutline });

    this.registerForm.get('name')?.valueChanges.subscribe((val: string | null) => {
      if (!val) return;
      let cleaned = val.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
      if (cleaned !== val) this.registerForm.get('name')?.setValue(cleaned, { emitEvent: false });
    });
  }

  cleanEmail(event: any, form: any, controlName: string) {
    const input = event.target as HTMLInputElement;
    let val = input.value;
    const cleaned = val.replace(/[^a-zA-Z0-9@._%+-]/g, '');
    
    if (cleaned !== val) {
      input.value = cleaned;
      form.get(controlName)?.setValue(cleaned, { emitEvent: false });
    }
  }

  get loginEmail() { return this.loginForm.get('email')!; }
  get loginPassword() { return this.loginForm.get('password')!; }
  get hasLoginMinLength() { return (this.loginPassword.value || '').length >= 8; }
  
  get loginEmailError(): string {
    const e = this.loginEmail.errors; if (!e) return '';
    if (e['required']) return 'El correo es obligatorio';
    if (e['pattern']) return 'Formato inválido (revisa @ o símbolos)';
    if (e['fakeDomain']) return 'Dominio mal escrito (ej. hotmail.com)';
    return 'Correo inválido';
  }
  get loginPasswordError(): string {
    const e = this.loginPassword.errors; if (!e) return '';
    if (e['required']) return 'La contraseña es obligatoria';
    if (e['minlength']) return 'Mínimo 8 caracteres';
    return 'Contraseña inválida';
  }

  get regName() { return this.registerForm.get('name')!; }
  get regEmail() { return this.registerForm.get('email')!; }
  get regPassword() { return this.registerForm.get('password')!; }
  get hasRegMinLength() { return (this.regPassword.value || '').length >= 8; }
  get hasRegUpper() { return /[A-Z]/.test(this.regPassword.value || ''); }
  get hasRegLower() { return /[a-z]/.test(this.regPassword.value || ''); }
  get hasRegNumber() { return /\d/.test(this.regPassword.value || ''); }
  
  get regNameError(): string {
    const e = this.regName.errors; if (!e) return '';
    if (e['required']) return 'El nombre es obligatorio';
    if (e['minlength']) return 'Mínimo 2 caracteres';
    if (e['pattern']) return 'Solo letras y espacios';
    return 'Nombre inválido';
  }
  get regEmailError(): string {
    const e = this.regEmail.errors; if (!e) return '';
    if (e['required']) return 'El correo es obligatorio';
    if (e['pattern']) return 'Formato inválido (revisa @ o símbolos)';
    if (e['testDomain']) return 'Dominios de prueba no permitidos';
    if (e['fakeDomain']) return 'Dominio mal escrito (ej. hotmail.com)';
    return 'Correo inválido';
  }

  goToSignup() { this.isSignup = true; }
  goToLogin() { this.isSignup = false; }

  private startCooldown() {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownSeconds = this.COOLDOWN_TIME;
    this.cd.detectChanges();
    this.cooldownInterval = setInterval(() => {
      this.cooldownSeconds--;
      this.cd.detectChanges();
      if (this.cooldownSeconds <= 0) {
        if (this.cooldownInterval) clearInterval(this.cooldownInterval);
        this.cooldownSeconds = 0;
        this.failedAttempts = 0;
        this.cd.detectChanges();
      }
    }, 1000);
  }

  private registerFailedAttempt() {
    this.failedAttempts++;
    if (this.failedAttempts >= this.maxAttempts) this.startCooldown();
  }

  async login() {
    const emailValue = (this.loginEmail.value || '').trim();
    const passwordValue = (this.loginPassword.value || '').replace(/\s/g, '');
    this.loginEmail.setValue(emailValue);
    this.loginPassword.setValue(passwordValue);
    this.loginForm.updateValueAndValidity();

    if (this.loginForm.invalid || this.loadingLogin || this.cooldownSeconds > 0) return;
    this.loadingLogin = true;
    
    const payload = { email: emailValue.toLowerCase(), password: passwordValue };
    
    this.auth.login(payload).subscribe({
      next: () => {
        this.loadingLogin = false;
        this.failedAttempts = 0;
        this.router.navigateByUrl('/tabs/movies', { replaceUrl: true });
      },
      error: async (err: any) => {
        this.loadingLogin = false;
        this.cd.detectChanges();
        if (err?.status === 401 || err?.status === 400) {
          this.registerFailedAttempt();
          const message = this.cooldownSeconds > 0 ? `Demasiados intentos. Espera ${this.cooldownSeconds}s.` : err?.error?.message || 'Credenciales inválidas';
          const t = await this.toast.create({ message, duration: 2500, color: 'danger', position: 'top' });
          t.present();
        } else if (err?.status === 429) {
          const t = await this.toast.create({ message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.', duration: 3000, color: 'danger', position: 'top' });
          t.present();
        } else if (err?.status === 403) {
          const t = await this.toast.create({ message: err?.error?.message || 'Cuenta suspendida', duration: 3000, color: 'warning', position: 'top' });
          t.present();
        }
      },
    });
  }

  async register() {
    const nameValue = (this.regName.value || '').trim();
    const emailValue = (this.regEmail.value || '').trim();
    const passwordValue = (this.regPassword.value || '').replace(/\s/g, '');
    this.regName.setValue(nameValue);
    this.regEmail.setValue(emailValue);
    this.regPassword.setValue(passwordValue);
    this.registerForm.updateValueAndValidity();

    if (this.registerForm.invalid || this.loadingRegister || this.cooldownSeconds > 0) return;
    this.loadingRegister = true;
    
    const payload = { name: nameValue, email: emailValue.toLowerCase(), password: passwordValue };
    
    this.auth.register(payload).subscribe({
      next: () => {
        this.loadingRegister = false;
        this.router.navigateByUrl('/tabs/movies', { replaceUrl: true });
      },
      error: async (err: any) => {
        this.loadingRegister = false;
        this.cd.detectChanges();
        if (err?.status === 409 || err?.status === 400) {
          const t = await this.toast.create({ message: err?.error?.message || 'Error al registrarse', duration: 2500, color: 'danger', position: 'top' });
          t.present();
        }
      },
    });
  }
}