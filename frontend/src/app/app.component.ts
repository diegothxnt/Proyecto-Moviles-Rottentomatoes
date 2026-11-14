import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { App } from '@capacitor/app';
import { TokenStorageService } from './core/services/token-storage.service';

@Component({
  selector: 'app-root',
  template: `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`,
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private tokenStorage = inject(TokenStorageService);

  ngOnInit() {
    App.addListener('pause', () => {
      this.tokenStorage.setAppPaused(true);
    });

    App.addListener('resume', () => {
      this.tokenStorage.setAppPaused(false);
    });
  }
}