import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ToastController } from '@ionic/angular';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private toastCtrl = inject(ToastController);
  private lastToastTime = 0;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Error 0 = Sin conexión / Servidor caído
        if (error.status === 0) {
          this.showToast('No pudimos conectar con el servidor. Revisa tu conexión a internet.');
        } 
        // Error 500+ = Servidor con problemas
        else if (error.status >= 500) {
          this.showToast('Estamos en actualizaciones. Vuelve a intentarlo en unos minutos.');
        }
        return throwError(() => error);
      })
    );
  }

  private async showToast(message: string) {
    // Evita que salgan 5 toasts seguidos si fallan varias peticiones a la vez
    if (Date.now() - this.lastToastTime < 5000) return; 
    this.lastToastTime = Date.now();
    
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    toast.present();
  }
}