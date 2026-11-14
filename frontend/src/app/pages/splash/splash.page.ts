import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular';
import { Router } from '@angular/router';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule, IonContent],
  template: `
    <ion-content [fullscreen]="true" class="splash-content">
      <div class="splash-container">
        <div class="glow"></div>
        <div class="brand">
          <span class="brand-main">ROTTEN</span><span class="brand-accent">TOMATOES</span>
        </div>
        <div class="tagline">
          <span class="word w1">Las</span>
          <span class="word w2">mejores</span>
          <span class="word w3">reseñas</span>
          <span class="word w4">del cine</span>
        </div>
        <div class="progress">
          <div class="progress-bar"></div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .splash-content { --background: #000000; }
    .splash-container {
      position: fixed; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: #000;
      animation: containerFadeOut 0.5s ease-in 4.0s forwards;
    }
    @keyframes containerFadeOut {
      to { opacity: 0; transform: scale(1.05); }
    }

    .glow {
      position: absolute;
      width: 380px; height: 380px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(229,9,20,0.4) 0%, transparent 70%);
      animation: glowPulse 3s ease-in-out infinite;
      opacity: 0;
      animation-delay: 0.3s;
      animation-fill-mode: forwards;
    }
    @keyframes glowPulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.75; transform: scale(1.15); }
    }

    .brand {
      font-size: 44px; font-weight: 900;
      letter-spacing: -0.04em; line-height: 1;
      opacity: 0; transform: scale(0.4);
      animation: brandIn 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
      z-index: 1;
    }
    @keyframes brandIn {
      to { opacity: 1; transform: scale(1); }
    }
    .brand-main { color: #fff; }
    .brand-accent { color: #e50914; }

    .tagline {
      margin-top: 24px;
      display: flex; gap: 10px;
      font-size: 16px; color: #b3b3b3; font-weight: 400;
      z-index: 1;
    }
    .word {
      opacity: 0; transform: translateY(20px);
      animation: wordIn 0.6s ease-out forwards;
    }
    .w1 { animation-delay: 1.6s; }
    .w2 { animation-delay: 1.9s; }
    .w3 { animation-delay: 2.2s; }
    .w4 { animation-delay: 2.5s; }
    @keyframes wordIn {
      to { opacity: 1; transform: translateY(0); }
    }

    .progress {
      position: absolute; bottom: 60px;
      width: 200px; height: 2px;
      background: rgba(255,255,255,0.08);
      border-radius: 2px; overflow: hidden;
      opacity: 0;
      animation: fadeIn 0.4s ease-out 2.9s forwards;
    }
    @keyframes fadeIn { to { opacity: 1; } }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #e50914, #ff3b44);
      box-shadow: 0 0 12px rgba(229,9,20,0.6);
      width: 0;
      animation: progressFill 1.4s ease-out 3.0s forwards;
    }
    @keyframes progressFill { to { width: 100%; } }
  `],
})
export class SplashPage implements OnInit {
  private router = inject(Router);
  private tokenStorage = inject(TokenStorageService);

  ngOnInit() {
    setTimeout(async () => {
      // ⚡ Verifica si la app fue eliminada de recientes y limpia la sesión
      const wasKilled = await this.tokenStorage.wasAppKilled();
      if (wasKilled) {
        await this.tokenStorage.clear();
      }

      const token = await this.tokenStorage.getAccessToken();
      if (token) {
        this.router.navigateByUrl('/tabs/movies', { replaceUrl: true });
      } else {
        this.router.navigateByUrl('/auth', { replaceUrl: true });
      }
    }, 4500);
  }
}