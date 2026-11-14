import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList, 
  IonItem, IonIcon, IonLabel, IonBadge, IonSelect, IonSelectOption, 
  IonButton, IonSpinner, ToastController, AlertController, IonSegment, IonSegmentButton
} from '@ionic/angular';
import { AdminService } from 'src/app/core/services/admin.service';
import { User } from 'src/app/core/models/user.model';
import { addIcons } from 'ionicons';
import { person, checkmarkCircle, closeCircle, trash } from 'ionicons/icons';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList, 
    IonItem, IonIcon, IonLabel, IonBadge, IonSelect, IonSelectOption, 
    IonButton, IonSpinner, IonSegment, IonSegmentButton
  ],
  template: `
    <ion-header>
      <ion-toolbar class="dark-toolbar">
        <ion-title>Admin Dashboard</ion-title>
      </ion-toolbar>
      <ion-toolbar class="dark-toolbar">
        <ion-searchbar 
          [(ngModel)]="searchTerm" 
          (ionInput)="filterUsers()"
          placeholder="Buscar por nombre o correo..."
          class="custom-search">
        </ion-searchbar>
      </ion-toolbar>
      <!-- ⚡ Filtro de Activos / Suspendidos -->
      <ion-toolbar class="dark-toolbar">
        <ion-segment [(ngModel)]="statusFilter" (ionChange)="filterUsers()">
          <ion-segment-button value="all"><ion-label>Todos</ion-label></ion-segment-button>
          <ion-segment-button value="active"><ion-label>Activos</ion-label></ion-segment-button>
          <ion-segment-button value="suspended"><ion-label>Suspendidos</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dark-content">
      <div *ngIf="loading" style="text-align: center; margin-top: 50px;">
        <ion-spinner name="crescent" color="danger"></ion-spinner>
      </div>

      <div *ngIf="!loading" class="ion-padding">
        <h3 style="color: white; margin-bottom: 16px;">Usuarios ({{ filteredUsers.length }})</h3>
        
        <div *ngIf="filteredUsers.length === 0" style="text-align: center; color: #b3b3b3; margin-top: 40px;">
          <ion-icon name="person" style="font-size: 48px;"></ion-icon>
          <p>No se encontraron usuarios</p>
        </div>

        <div *ngFor="let u of filteredUsers" class="user-card">
          <div class="card-header">
            <div class="user-info">
              <div class="avatar" [style.opacity]="u.isActive ? '1' : '0.5'">{{ u.name[0] | uppercase }}</div>
              <div>
                <h2 class="user-name">{{ u.name }}</h2>
                <p class="user-email">{{ u.email }}</p>
                <!-- ⚡ BADGES DE ESTADO CLAROS -->
                <div style="margin-top: 6px;">
                  <ion-badge *ngIf="u.isActive" color="success" style="margin-right: 4px;">ACTIVO</ion-badge>
                  <ion-badge *ngIf="!u.isActive" color="danger" style="margin-right: 4px;">SUSPENDIDO</ion-badge>
                  <ion-badge [color]="u.role === 'admin' ? 'dark' : (u.role === 'critic' ? 'warning' : 'primary')">
                    {{ u.role | uppercase }}
                  </ion-badge>
                </div>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <ion-select [value]="u.role" (ionChange)="changeRole(u, $event.detail.value)" interface="popover" class="role-select">
              <ion-select-option value="user">User</ion-select-option>
              <ion-select-option value="critic">Critic</ion-select-option>
              <ion-select-option value="admin">Admin</ion-select-option>
            </ion-select>

            <!-- ⚡ Botón de Suspender / Activar -->
            <ion-button 
              fill="solid" 
              size="small"
              [color]="u.isActive ? 'danger' : 'success'" 
              (click)="toggleStatus(u)">
              <ion-icon slot="start" [name]="u.isActive ? 'close-circle' : 'checkmark-circle'"></ion-icon>
              {{ u.isActive ? 'Suspender' : 'Activar' }}
            </ion-button>

            <ion-button fill="clear" color="medium" size="small" (click)="deleteUser(u)">
              <ion-icon slot="icon-only" name="trash"></ion-icon>
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .dark-toolbar { --background: #000000; --color: #ffffff; border-bottom: 1px solid #232323; }
    .dark-content { --background: #0a0a0a; }
    .custom-search { --background: #1a1a1a; --color: #fff; --placeholder-color: #808080; --icon-color: #e50914; --border-radius: 10px; padding: 4px 8px; }
    ion-segment { --background: #0a0a0a; padding: 0 12px; }
    ion-segment-button { --color: #808080; --color-checked: #fff; --indicator-color: #e50914; }
    
    .user-card { background: #1a1a1a; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #2d2d2d; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .user-info { display: flex; gap: 12px; align-items: center; }
    .avatar { width: 48px; height: 48px; border-radius: 50%; background: #e50914; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; transition: opacity 0.3s; }
    .user-name { color: #fff; font-size: 16px; font-weight: 700; margin: 0 0 4px 0; }
    .user-email { color: #b3b3b3; font-size: 13px; margin: 0; }
    
    .card-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #2d2d2d; padding-top: 16px; gap: 8px; }
    .role-select { font-size: 12px; color: #fff; --background: #232323; --border-radius: 6px; max-width: 130px; }
  `]
})
export class AdminPage implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastController);
  private alert = inject(AlertController);
  private cd = inject(ChangeDetectorRef);
  
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'suspended' = 'all';
  loading = false;

  constructor() {
    addIcons({ person, checkmarkCircle, closeCircle, trash });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.users = res.data;
        this.filterUsers();
        this.loading = false;
        this.cd.detectChanges();
      },
      error: async (err) => {
        this.loading = false;
        this.cd.detectChanges();
        const t = await this.toast.create({ message: 'Error al cargar', duration: 3000, color: 'danger', position: 'top' });
        t.present();
      }
    });
  }

  filterUsers() {
    let temp = this.users;
    
    // Filtrar por búsqueda
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      temp = temp.filter(u => 
        u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
      );
    }

    // Filtrar por estado (Activos/Suspendidos)
    if (this.statusFilter === 'active') {
      temp = temp.filter(u => u.isActive);
    } else if (this.statusFilter === 'suspended') {
      temp = temp.filter(u => !u.isActive);
    }

    this.filteredUsers = temp;
  }

  changeRole(user: User, newRole: string) {
    this.adminService.updateRole(user._id, newRole).subscribe({
      next: (res) => {
        user.role = res.data.role as any;
        this.cd.detectChanges();
        this.showToast(`Rol actualizado a ${newRole}`);
      }
    });
  }

  async toggleStatus(user: User) {
    const action = user.isActive ? 'suspender' : 'activar';
    const a = await this.alert.create({
      header: `${action.toUpperCase()} cuenta`,
      message: `¿Seguro que quieres ${action} a ${user.name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, ' + action,
          handler: () => {
            this.adminService.toggleStatus(user._id).subscribe({
              next: (res) => {
                user.isActive = res.data.isActive;
                this.filterUsers(); // Refrescar filtro
                this.cd.detectChanges();
                this.showToast(res.message);
              },
              error: (err) => this.showToast(err.error.message, 'danger')
            });
          }
        }
      ]
    });
    await a.present();
  }

  async deleteUser(user: User) {
    const a = await this.alert.create({
      header: 'Eliminar Usuario',
      message: ` ¿Estás seguro de eliminar permanentemente a ${user.name}? Sus reseñas también se borrarán.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.adminService.deleteUser(user._id).subscribe({
              next: (res) => {
                this.users = this.users.filter(u => u._id !== user._id);
                this.filterUsers();
                this.showToast('Usuario eliminado');
              },
              error: (err) => this.showToast(err.error.message, 'danger')
            });
          }
        }
      ]
    });
    await a.present();
  }

  async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'top' });
    t.present();
  }
}