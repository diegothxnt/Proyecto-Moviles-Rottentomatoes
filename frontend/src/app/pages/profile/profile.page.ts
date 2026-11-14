import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton,
  IonIcon, IonSpinner, AlertController, ToastController,
} from '@ionic/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/core/models/user.model';
import { addIcons } from 'ionicons';
import {
  eyeOutline, eyeOffOutline, keyOutline,
  personOutline, logOutOutline, trashOutline,
  checkmarkCircle, closeCircle, calendarOutline, globeOutline,
  heart, heartDislikeOutline
} from 'ionicons/icons';

// ⚡ VALIDADOR ESTRICTO DE URL
function urlValidator(ctrl: any) {
  const v = (ctrl.value || '').trim();
  if (!v) return null;
  // Acepta http://, https:// o simplemente www.ejemplo.com
  const urlPattern = /^(https?:\/\/)?([\w\-]+\.)+[a-z]{2,6}(\/[\w\-./?%&=]*)?$/i;
  return urlPattern.test(v) ? null : { invalidUrl: true };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonIcon, IonSpinner,
  ],
  template: `
    <ion-header><ion-toolbar><ion-title>Perfil</ion-title></ion-toolbar></ion-header>
    <ion-content>
      <div class="profile-head" *ngIf="user">
        <div class="avatar">{{ user.name[0] | uppercase }}</div>
        <h2 class="name">{{ user.name }}</h2>
        <span class="role-chip" [class.critic]="user.role === 'critic'">{{ user.role | uppercase }}</span>
        
        <p class="member-since">
          <ion-icon name="calendar-outline"></ion-icon>
          Miembro desde {{ user.createdAt | date:'dd/MM/yyyy' }}
        </p>
        <p class="email text-secondary">{{ user.email }}</p>
      </div>

      <!-- ⚡ LISTAS DE PELÍCULAS -->
      <div class="movie-lists" *ngIf="user">
        <div class="movie-list-section" *ngIf="likedMovies.length > 0">
          <h3 class="list-title"><ion-icon name="heart" color="danger"></ion-icon> Películas que me gustan</h3>
          <div class="movies-scroll">
            <a *ngFor="let m of likedMovies" [routerLink]="['/movie', m._id]" class="mini-card">
              <img [src]="m.posterPath || getFallbackImage(m.title)" alt="">
              <p>{{ m.title }}</p>
            </a>
          </div>
        </div>

        <div class="movie-list-section" *ngIf="likedSeries.length > 0">
          <h3 class="list-title"><ion-icon name="heart" color="danger"></ion-icon> Series que me gustan</h3>
          <div class="movies-scroll">
            <a *ngFor="let m of likedSeries" [routerLink]="['/movie', m._id]" class="mini-card">
              <img [src]="m.posterPath || getFallbackImage(m.title)" alt="">
              <p>{{ m.title }}</p>
            </a>
          </div>
        </div>

        <div class="movie-list-section" *ngIf="dislikedMovies.length > 0">
          <h3 class="list-title"><ion-icon name="heart-dislike-outline" color="medium"></ion-icon> Películas que no me gustan</h3>
          <div class="movies-scroll">
            <a *ngFor="let m of dislikedMovies" [routerLink]="['/movie', m._id]" class="mini-card">
              <img [src]="m.posterPath || getFallbackImage(m.title)" alt="">
              <p>{{ m.title }}</p>
            </a>
          </div>
        </div>

        <div class="movie-list-section" *ngIf="dislikedSeries.length > 0">
          <h3 class="list-title"><ion-icon name="heart-dislike-outline" color="medium"></ion-icon> Series que no me gustan</h3>
          <div class="movies-scroll">
            <a *ngFor="let m of dislikedSeries" [routerLink]="['/movie', m._id]" class="mini-card">
              <img [src]="m.posterPath || getFallbackImage(m.title)" alt="">
              <p>{{ m.title }}</p>
            </a>
          </div>
        </div>
      </div>

      <form [formGroup]="form" class="form">
        <h3 class="form-title"><ion-icon name="person-outline"></ion-icon> Datos personales</h3>
        <ion-input formControlName="name" label="Nombre" labelPlacement="stacked" fill="outline" maxlength="50"></ion-input>
        <ion-input formControlName="bio" label="Biografía" labelPlacement="stacked" fill="outline" maxlength="300" class="mt-12" placeholder="Escribe algo sobre ti..."></ion-input>
        <div class="counter" *ngIf="form.get('bio')?.value">{{ form.get('bio')?.value?.length || 0 }}/300</div>
        
        <div class="row-inputs mt-12">
          <ion-input formControlName="country" label="País" labelPlacement="stacked" fill="outline" maxlength="50" placeholder="Ej: Venezuela"></ion-input>
          <ion-input formControlName="favoriteGenre" label="Género favorito" labelPlacement="stacked" fill="outline" maxlength="50" placeholder="Ej: Acción"></ion-input>
        </div>

        <!-- ⚡ INPUT CON VALIDACIÓN DE URL -->
        <ion-input formControlName="website" label="Sitio Web" labelPlacement="stacked" fill="outline" maxlength="100" class="mt-12" placeholder="Ej: https://mi-portfolio.com"></ion-input>
        <div class="field-footer" *ngIf="form.get('website')?.touched && form.get('website')?.invalid">
          <span class="error">Debe ser un enlace válido (ej: https://misitio.com)</span>
        </div>
        
        <ion-button expand="block" type="button" class="btn-primary mt-12" [disabled]="form.invalid || saving" (click)="save()">
          <ion-spinner *ngIf="saving" name="dots"></ion-spinner>
          <span *ngIf="!saving">Guardar cambios</span>
        </ion-button>
      </form>

      <div class="form">
        <h3 class="form-title"><ion-icon name="key-outline"></ion-icon> Cambiar contraseña</h3>
        <ion-button expand="block" fill="outline" class="toggle-pw-btn" (click)="togglePasswordForm()">
          {{ showPasswordForm ? 'Cancelar' : 'Cambiar contraseña' }}
        </ion-button>

        <form *ngIf="showPasswordForm" [formGroup]="passwordForm" class="password-form">
          <div class="pw-input-wrap">
            <ion-input formControlName="currentPassword" [type]="showCurrent ? 'text' : 'password'" label="Contraseña actual" labelPlacement="stacked" fill="outline" maxlength="64" class="pw-input"></ion-input>
            <button type="button" class="toggle-eye-btn" (click)="showCurrent = !showCurrent" tabindex="-1"><ion-icon [name]="showCurrent ? 'eye-off-outline' : 'eye-outline'"></ion-icon></button>
          </div>

          <div class="pw-input-wrap mt-12">
            <ion-input formControlName="newPassword" [type]="showNew ? 'text' : 'password'" label="Nueva contraseña" labelPlacement="stacked" fill="outline" maxlength="64" class="pw-input"></ion-input>
            <button type="button" class="toggle-eye-btn" (click)="showNew = !showNew" tabindex="-1"><ion-icon [name]="showNew ? 'eye-off-outline' : 'eye-outline'"></ion-icon></button>
          </div>

          <div class="password-checklist" *ngIf="newPasswordCtrl.value">
            <div class="req" [class.ok]="hasMinLength"><ion-icon [name]="hasMinLength ? 'checkmark-circle' : 'close-circle'"></ion-icon> 8-64 caracteres</div>
            <div class="req" [class.ok]="hasUpper"><ion-icon [name]="hasUpper ? 'checkmark-circle' : 'close-circle'"></ion-icon> Al menos 1 mayúscula</div>
            <div class="req" [class.ok]="hasLower"><ion-icon [name]="hasLower ? 'checkmark-circle' : 'close-circle'"></ion-icon> Al menos 1 minúscula</div>
            <div class="req" [class.ok]="hasNumber"><ion-icon [name]="hasNumber ? 'checkmark-circle' : 'close-circle'"></ion-icon> Al menos 1 número</div>
          </div>

          <div class="pw-input-wrap mt-12">
            <ion-input formControlName="confirmPassword" [type]="showConfirm ? 'text' : 'password'" label="Confirmar nueva contraseña" labelPlacement="stacked" fill="outline" maxlength="64" class="pw-input"></ion-input>
            <button type="button" class="toggle-eye-btn" (click)="showConfirm = !showConfirm" tabindex="-1"><ion-icon [name]="showConfirm ? 'eye-off-outline' : 'eye-outline'"></ion-icon></button>
          </div>

          <p class="pw-error" *ngIf="passwordForm.hasError('mismatch') && passwordForm.get('confirmPassword')?.touched">Las contraseñas no coinciden</p>

          <ion-button expand="block" type="button" class="btn-primary mt-12" [disabled]="passwordForm.invalid || changingPassword" (click)="changePassword()">
            <ion-spinner *ngIf="changingPassword" name="dots"></ion-spinner>
            <span *ngIf="!changingPassword">Actualizar contraseña</span>
          </ion-button>
        </form>
      </div>

      <div class="danger-zone">
        <ion-button expand="block" fill="outline" color="danger" (click)="logout()">
          <ion-icon slot="start" name="log-out-outline"></ion-icon> Cerrar sesión
        </ion-button>
        <ion-button expand="block" fill="clear" color="danger" (click)="deleteAccount()">
          <ion-icon slot="start" name="trash-outline"></ion-icon> Eliminar mi cuenta
        </ion-button>
      </div>
      <div style="height: 64px;"></div>
    </ion-content>
  `,
  styles: [`
    .profile-head { text-align: center; padding: 32px 16px 16px; }
    .avatar { width: 80px; height: 80px; border-radius: 50%; background: #e50914; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; margin: 0 auto 12px; }
    .name { font-size: 22px; font-weight: 700; color: #fff; margin: 0 0 6px; }
    .role-chip { background: #232323; color: #b3b3b3; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; }
    .role-chip.critic { background: #e50914; color: #fff; }
    .member-since { font-size: 12px; color: #b3b3b3; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .member-since ion-icon { color: #e50914; }
    .email { font-size: 13px; margin-top: 4px; }

    .movie-lists { padding: 0 16px; margin-bottom: 8px; }
    .movie-list-section { margin-bottom: 20px; }
    .list-title { color: #fff; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 6px; margin: 0 0 10px 0; }
    .movies-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; }
    .movies-scroll::-webkit-scrollbar { display: none; }
    .mini-card { width: 90px; flex-shrink: 0; text-decoration: none; }
    .mini-card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 6px; display: block; background: #1a1a1a; }
    .mini-card p { color: #b3b3b3; font-size: 11px; margin: 4px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .form { padding: 0 16px 16px; }
    .form-title { display: flex; align-items: center; gap: 8px; color: #fff; font-size: 16px; font-weight: 700; margin: 24px 0 12px; }
    .form-title ion-icon { color: #e50914; font-size: 20px; }
    .row-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .pw-input-wrap { position: relative; }
    .pw-input { --background: #1a1a1a; --color: #fff; --border-radius: 8px; --padding-end: 44px; }
    .toggle-eye-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #808080; font-size: 18px; cursor: pointer; z-index: 5; padding: 6px; display: flex; align-items: center; justify-content: center; }
    .toggle-eye-btn:active { color: #e50914; }
    .counter { text-align: right; color: #5a5a5a; font-size: 11px; padding: 4px 4px 0; }
    .mt-12 { margin-top: 12px; }
    .btn-primary { --background: #e50914; --color: #fff; --border-radius: 8px; --padding-top: 12px; --padding-bottom: 12px; font-weight: 700; text-transform: none; font-size: 15px; display: flex; justify-content: center; align-items: center; min-height: 46px; }
    .btn-primary[disabled] { opacity: 0.5; }
    .toggle-pw-btn { --border-color: #3a3a3a; --color: #fff; --border-radius: 8px; text-transform: none; font-weight: 600; margin-bottom: 12px; }
    .password-form { margin-top: 8px; }
    .password-checklist { background: rgba(0,0,0,0.4); border-radius: 8px; padding: 12px 14px; margin-top: 12px; }
    .req { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #808080; padding: 3px 0; transition: color 0.2s; }
    .req ion-icon { font-size: 14px; color: #5a5a5a; }
    .req.ok { color: #46d369; }
    .req.ok ion-icon { color: #46d369; }
    .pw-error { color: #e50914; font-size: 12px; padding: 4px; margin: 0; }
    .danger-zone { padding: 24px 16px; }
    
    .field-footer { padding: 4px 6px 0; text-align: left; }
    .field-footer .error { color: #e50914; font-size: 12px; }
  `],
})
export class ProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastController);
  private alert = inject(AlertController);
  private cd = inject(ChangeDetectorRef);

  user: User | null = null;
  saving = false;
  changingPassword = false;
  showPasswordForm = false;
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  likedMovies: any[] = [];
  likedSeries: any[] = [];
  dislikedMovies: any[] = [];
  dislikedSeries: any[] = [];

  // ⚡ Formulario con Validación de URL
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    bio: ['', [Validators.maxLength(300)]],
    country: ['', [Validators.maxLength(50)]],
    favoriteGenre: ['', [Validators.maxLength(50)]],
    website: ['', [Validators.maxLength(100), urlValidator]],
  });

  passwordForm = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64), Validators.pattern(/[A-Z]/), Validators.pattern(/[a-z]/), Validators.pattern(/\d/)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordsMatch }
  );

  constructor() {
    addIcons({
      eyeOutline, eyeOffOutline, keyOutline, personOutline, logOutOutline, trashOutline,
      checkmarkCircle, closeCircle, calendarOutline, globeOutline, 
      heart, heartDislikeOutline
    });
  }

  getFallbackImage(title: string): string {
    const cleanTitle = encodeURIComponent(title || 'Sin Título');
    return `https://placehold.co/150x220/1a1a1a/ffffff?text=${cleanTitle}`;
  }

  ngOnInit() {
    this.auth.user$.subscribe((u) => {
      this.user = u;
      if (u && !this.form.dirty) {
        this.form.patchValue({
          name: u.name,
          bio: u.bio || '',
          country: u.country || '',
          favoriteGenre: u.favoriteGenre || '',
          website: u.website || ''
        });
      }

      if (u) {
        this.likedMovies = (u.likedMovies || []).filter((m: any) => m.type === 'movie');
        this.likedSeries = (u.likedMovies || []).filter((m: any) => m.type === 'tv');
        this.dislikedMovies = (u.dislikedMovies || []).filter((m: any) => m.type === 'movie');
        this.dislikedSeries = (u.dislikedMovies || []).filter((m: any) => m.type === 'tv');
      }

      this.cd.detectChanges();
    });
    if (!this.user) this.auth.me().subscribe({ error: () => {} });

    this.form.get('name')?.valueChanges.subscribe((val: string | null) => {
      if (!val) return;
      let cleaned = val.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
      if (cleaned !== val) this.form.get('name')?.setValue(cleaned, { emitEvent: false });
    });

    const noSpacesAtAll = (controlName: string, form: any) => {
      form.get(controlName)?.valueChanges.subscribe((val: string | null) => {
        if (val && /\s/.test(val)) form.get(controlName)?.setValue(val.replace(/\s/g, ''), { emitEvent: false });
      });
    };
    noSpacesAtAll('currentPassword', this.passwordForm);
    noSpacesAtAll('newPassword', this.passwordForm);
    noSpacesAtAll('confirmPassword', this.passwordForm);
  }

  get newPasswordCtrl() { return this.passwordForm.get('newPassword')!; }
  get hasMinLength() { return (this.newPasswordCtrl.value?.length || 0) >= 8; }
  get hasUpper() { return /[A-Z]/.test(this.newPasswordCtrl.value || ''); }
  get hasLower() { return /[a-z]/.test(this.newPasswordCtrl.value || ''); }
  get hasNumber() { return /\d/.test(this.newPasswordCtrl.value || ''); }

  private passwordsMatch(group: any) {
    const np = group.get('newPassword')?.value;
    const cp = group.get('confirmPassword')?.value;
    if (!np || !cp) return null;
    return np === cp ? null : { mismatch: true };
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) this.passwordForm.reset();
  }

  async save() {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    const formValue = this.form.getRawValue();
    
    // ⚡ Si el campo está vacío, lo dejamos en '' o nulo para que no rompa.
    const payload = {
      name: formValue.name?.trim() || 'Usuario',
      bio: formValue.bio?.trim() || '',
      country: formValue.country?.trim() || '',
      favoriteGenre: formValue.favoriteGenre?.trim() || '',
      website: formValue.website?.trim() || '',
    };

    this.auth.updateProfile(payload as any).subscribe({
      next: () => {
        this.saving = false;
        this.form.markAsPristine();
        this.cd.detectChanges();
        this.toastMsg('Perfil actualizado', 'success');
      },
      error: (err: any) => {
        this.saving = false;
        this.toastMsg(err?.error?.message || 'Error', 'danger');
      },
    });
  }

  async changePassword() {
    if (this.passwordForm.invalid || this.changingPassword) return;
    this.changingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.auth.changePassword(currentPassword!, newPassword!).subscribe({
      next: async () => {
        this.changingPassword = false;
        this.showPasswordForm = false;
        this.passwordForm.reset();
        const alert = await this.alert.create({
          header: 'Contraseña actualizada',
          message: 'Por seguridad, debes iniciar sesión de nuevo con tu nueva contraseña.',
          buttons: [{ text: 'OK', handler: () => this.auth.logout() }],
        });
        await alert.present();
      },
      error: (err: any) => {
        this.changingPassword = false;
        this.toastMsg(err?.error?.message || 'Error', 'danger');
      },
    });
  }

  logout() { this.auth.logout(); }

  async deleteAccount() {
    const a = await this.alert.create({
      header: 'Eliminar cuenta', message: 'Esta acción es irreversible. ¿Continuar?',
      inputs: [{ name: 'password', type: 'password', placeholder: 'Contraseña' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: (data: any) => {
            if (!data.password) return false;
            this.auth.deleteAccount(data.password).subscribe({
              next: () => this.auth.logout(),
              error: (err: any) => this.toastMsg(err?.error?.message || 'Error', 'danger'),
            });
            return true;
          }},
      ],
    });
    await a.present();
  }

  private async toastMsg(message: string, color: 'success' | 'danger') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'top' });
    t.present();
  }
}