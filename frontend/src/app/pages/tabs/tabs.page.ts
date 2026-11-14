import { Component, OnInit, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { film, tv, person, shieldCheckmark } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, CommonModule],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="movies">
          <ion-icon name="film"></ion-icon>
          <ion-label>Películas</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="tv">
          <ion-icon name="tv"></ion-icon>
          <ion-label>Series</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile">
          <ion-icon name="person"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
        
        <!-- ⚡ Solo visible para Admin -->
        <ion-tab-button tab="admin" *ngIf="isAdmin">
          <ion-icon name="shield-checkmark" color="danger"></ion-icon>
          <ion-label color="danger">Admin</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage implements OnInit {
  private auth = inject(AuthService);
  isAdmin = false;

  constructor() {
    addIcons({ film, tv, person, shieldCheckmark });
  }

  ngOnInit() {
    this.auth.user$.subscribe(u => {
      this.isAdmin = u?.role === 'admin';
    });
  }
}