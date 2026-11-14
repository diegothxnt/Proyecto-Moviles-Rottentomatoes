import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // ⚡ Añadido RouterLink
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonTextarea, IonSpinner, IonModal, ToastController, AlertController,
} from '@ionic/angular';
import { MovieService } from 'src/app/core/services/movie.service';
import { MovieCacheService } from 'src/app/core/services/movie-cache.service';
import { ReviewService } from 'src/app/core/services/review.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { MovieDetail, Review } from 'src/app/core/models/movie.model';
import { addIcons } from 'ionicons';
import { 
  arrowBack, trash, create, star, filmOutline, 
  heart, heartOutline, heartDislikeOutline, chatbubbleOutline,
  calendarOutline, locationOutline, globeOutline, personOutline
} from 'ionicons/icons';

interface ReviewNode extends Review {
  children: ReviewNode[];
}

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonTextarea, IonSpinner, IonModal,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="goBack()"><ion-icon name="arrow-back"></ion-icon></ion-button>
        </ion-buttons>
        <ion-title></ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content *ngIf="movie">
      <!-- HERO -->
      <div class="hero">
        <div class="hero-bg" [style.backgroundImage]="'url(' + (movie.backdropPath || movie.posterPath || getFallbackImage(movie.title)) + ')'"></div>
        <div class="hero-gradient"></div>
        <div class="hero-content">
          <img [src]="movie.posterPath || getFallbackImage(movie.title)"
               (error)="movie.posterPath = getFallbackImage(movie.title)"
               class="poster" [alt]="movie.title" />
          <div class="info">
            <h1 class="title">{{ movie.title }}</h1>
            <p class="meta">{{ (movie.releaseDate | date:'yyyy') || 'N/A' }} <span *ngIf="movie.runtime"> · {{ movie.runtime }} min</span></p>
            <div class="imdb-badge" *ngIf="movie.externalRating > 0"><ion-icon name="star"></ion-icon> IMDb: {{ movie.externalRating }}</div>
            
            <div class="preference-buttons">
              <ion-button fill="clear" size="small" [color]="userPreference === 'like' ? 'danger' : 'medium'" (click)="markPreference('like')">
                <ion-icon slot="start" [name]="userPreference === 'like' ? 'heart' : 'heart-outline'"></ion-icon> Me gusta
              </ion-button>
              <ion-button fill="clear" size="small" [color]="userPreference === 'dislike' ? 'danger' : 'medium'" (click)="markPreference('dislike')">
                <ion-icon slot="start" [name]="userPreference === 'dislike' ? 'heart-dislike' : 'heart-dislike-outline'"></ion-icon> No me gusta
              </ion-button>
            </div>
          </div>
        </div>
      </div>

      <!-- RATINGS -->
      <div class="ratings-grid">
        <div class="rating-cell">
          <div class="rating-value public" [class.empty]="!movie.ratings?.publicCount">{{ movie.ratings?.publicCount ? (movie.ratings!.publicAverage | number:'1.1-1') : '-' }}</div>
          <div class="rating-label">Público</div><div class="rating-count">{{ movie.ratings?.publicCount ?? 0 }} reseñas</div>
        </div>
        <div class="rating-cell">
          <div class="rating-value critic" [class.empty]="!movie.ratings?.criticCount">{{ movie.ratings?.criticCount ? (movie.ratings!.criticAverage | number:'1.1-1') : '-' }}</div>
          <div class="rating-label">Críticos</div><div class="rating-count">{{ movie.ratings?.criticCount ?? 0 }} reseñas</div>
        </div>
        <div class="rating-cell">
          <div class="rating-value global" [class.empty]="!movie.ratings?.totalReviews">{{ movie.ratings?.totalReviews ? (movie.ratings!.globalAverage | number:'1.1-1') : '-' }}</div>
          <div class="rating-label">Global</div><div class="rating-count">{{ movie.ratings?.totalReviews ?? 0 }} total</div>
        </div>
      </div>

      <!-- SINOPSIS, GÉNEROS, REPARTO -->
      <section class="section">
        <h2 class="section-title">Sinopsis</h2>
        <p class="overview">{{ movie.overview || 'Sinopsis no disponible por el momento.' }}</p>
      </section>
      <section class="section" *ngIf="movie.genres.length">
        <h2 class="section-title">Géneros</h2>
        <div class="genres"><span class="genre-chip" *ngFor="let g of movie.genres">{{ g }}</span></div>
      </section>
      <section class="section" *ngIf="movie.cast.length">
        <h2 class="section-title">Reparto</h2>
        <div class="cast"><span class="cast-chip" *ngFor="let c of movie.cast">{{ c }}</span></div>
      </section>

      <!-- TU RESEÑA -->
      <section class="section">
        <h2 class="section-title">Tu reseña</h2>
        <div class="review-target"><ion-icon name="film-outline"></ion-icon><span>Reseñando:</span><strong>{{ movie.title }}</strong></div>

        <div *ngIf="!myReview || isEditing">
          <div class="rate-row">
            <span class="rate-label">Puntuación:</span>
            <input type="range" min="0" max="10" step="0.5" [(ngModel)]="newRating" class="slider" />
            <span class="rate-value">{{ newRating }}</span>
          </div>
          <ion-textarea [(ngModel)]="newComment" placeholder="Comparte tu opinión..." fill="outline" [autoGrow]="true" maxlength="500" class="mt-12 review-textarea"></ion-textarea>
          <div class="review-footer">
            <span class="review-hint" [class.error]="newComment.length > 0 && newComment.trim().length < 1">Mínimo 1 carácter</span>
            <span class="review-counter" [class.ok]="isCommentValid">{{ newComment.length }}/500</span>
          </div>
          <div class="action-buttons" *ngIf="isEditing">
            <ion-button expand="block" fill="outline" color="light" class="mt-12" (click)="cancelEdit()">Cancelar</ion-button>
            <ion-button expand="block" class="btn-primary mt-12" [disabled]="submitting || !isCommentValid" (click)="submitReview()">
              <ion-spinner *ngIf="submitting" name="dots"></ion-spinner><span *ngIf="!submitting">Actualizar reseña</span>
            </ion-button>
          </div>
          <ion-button *ngIf="!isEditing" expand="block" class="btn-primary mt-12" [disabled]="submitting || !isCommentValid" (click)="submitReview()">
            <ion-spinner *ngIf="submitting" name="dots"></ion-spinner><span *ngIf="!submitting">Publicar reseña</span>
          </ion-button>
        </div>

        <div *ngIf="myReview && !isEditing" class="review-card my-review">
          <div class="review-header">
            <strong>Tu calificación: {{ myReview.rating }} / 10</strong>
            <div class="review-actions">
              <ion-button fill="solid" size="small" class="edit-btn" (click)="startEdit()"><ion-icon slot="start" name="create"></ion-icon> Editar</ion-button>
              <ion-button fill="solid" size="small" color="danger" (click)="deleteMyReview()"><ion-icon slot="start" name="trash"></ion-icon> Eliminar</ion-button>
            </div>
          </div>
          <p>{{ myReview.comment }}</p>
        </div>
      </section>

      <!-- RESEÑAS DE LA COMUNIDAD -->
      <section class="section">
        <h2 class="section-title">Reseñas de la comunidad ({{ topLevelReviews.length }})</h2>
        
        <div *ngFor="let r of topLevelReviews" class="review-card" [class.admin-card]="r.user.role === 'admin'" [class.critic-card]="r.user.role === 'critic'">
          <ng-container *ngTemplateOutlet="reviewItem; context: { $implicit: r, depth: 0 }"></ng-container>
        </div>
        
        <p *ngIf="topLevelReviews.length === 0" class="text-secondary" style="text-align: center; margin-top: 20px;">
          Aún no hay reseñas. ¡Sé el primero en opinar!
        </p>
      </section>

      <!-- ⚡ TEMPLATE RECURSIVO PARA LAS RESPUESTAS -->
      <ng-template #reviewItem let-r let-depth="depth">
        <div class="review-header">
          <div (click)="showUserProfile(r.user)" style="cursor: pointer;">
            <strong style="color: #e50914; text-decoration: underline;">{{ r.user.name }}</strong>
            <span class="role-tag admin-tag" *ngIf="r.user.role === 'admin'">ADMIN</span>
            <span class="role-tag critic-tag" *ngIf="r.user.role === 'critic'">CRÍTICO</span>
          </div>
          <span class="review-rating" *ngIf="r.rating > 0">{{ r.rating }}/10</span>
        </div>
        
        <p>
          <span *ngIf="depth > 1" style="color: #e50914; font-weight: 600;">&#64;{{ r.parentUser || 'Usuario' }} </span>
          {{ r.comment }}
        </p>
        
        <div class="review-actions-bar">
          <ion-button fill="clear" size="small" color="danger" (click)="likeReview(r)">
            <ion-icon slot="start" [name]="r.likes?.includes(currentUserId) ? 'heart' : 'heart-outline'"></ion-icon> {{ r.likes?.length || 0 }}
          </ion-button>
          
          <ion-button *ngIf="r.user._id !== currentUserId" fill="clear" size="small" color="medium" (click)="toggleReplyBox(r._id)">
            <ion-icon slot="start" name="chatbubble-outline"></ion-icon> Responder
          </ion-button>
          
          <ion-button *ngIf="r.user._id === currentUserId" fill="clear" size="small" color="medium" (click)="deleteReply(r)">
            <ion-icon slot="start" name="trash"></ion-icon>
          </ion-button>
        </div>

        <!-- FORMULARIO DE RESPUESTA -->
        <div *ngIf="replyingTo === r._id" class="reply-box mt-12">
          <ion-textarea [(ngModel)]="replyComment" placeholder="Responde a {{ r.user.name }}..." fill="outline" [autoGrow]="true" maxlength="500" class="review-textarea"></ion-textarea>
          <div class="action-buttons mt-12">
            <ion-button expand="block" fill="outline" color="light" (click)="cancelReply()">Cancelar</ion-button>
            <ion-button expand="block" class="btn-primary" [disabled]="!replyComment.trim() || submittingReply" (click)="submitReply(r._id)">Responder</ion-button>
          </div>
        </div>

        <!-- RESPUESTAS HIJAS -->
        <div class="replies-container" [class.flat]="depth >= 1" *ngIf="r.children && r.children.length > 0">
          <div *ngFor="let child of (expandedReplies[r._id] ? r.children : r.children | slice:0:2)" class="reply-card">
            <ng-container *ngTemplateOutlet="reviewItem; context: { $implicit: child, depth: depth + 1 }"></ng-container>
          </div>
          
          <ion-button *ngIf="r.children.length > 2 && !expandedReplies[r._id]" fill="clear" size="small" color="light" (click)="toggleExpand(r._id)">
            Ver las {{ r.children.length }} respuestas
          </ion-button>
        </div>
      </ng-template>

      <div style="height: 64px;"></div>
    </ion-content>

    <!-- MODAL DE PERFIL COMPLETO -->
    <ion-modal [isOpen]="selectedUser !== null" (didDismiss)="selectedUser = null">
      <ng-template>
        <ion-content class="ion-padding" style="--background: #1a1a1a;">
          <div *ngIf="selectedUser" style="padding-top: 20px; padding-bottom: 40px;">
            <div style="text-align: center;">
              <div class="avatar-lg">{{ selectedUser.name[0] | uppercase }}</div>
              <h2 style="color: #fff; margin: 0;">{{ selectedUser.name }}</h2>
              <span class="role-tag" style="margin-top: 8px; display: inline-block;">{{ selectedUser.role | uppercase }}</span>
            </div>
            
            <div class="profile-details" style="margin-top: 24px;">
              <div class="detail-row">
                <ion-icon name="person-outline"></ion-icon>
                <span>{{ selectedUser.bio || 'Sin biografía disponible.' }}</span>
              </div>
              <div class="detail-row" *ngIf="selectedUser.country">
                <ion-icon name="location-outline"></ion-icon>
                <span>País: {{ selectedUser.country }}</span>
              </div>
              <div class="detail-row" *ngIf="selectedUser.favoriteGenre">
                <ion-icon name="heart-outline"></ion-icon>
                <span>Género favorito: {{ selectedUser.favoriteGenre }}</span>
              </div>
              <div class="detail-row" *ngIf="selectedUser.website">
                <ion-icon name="globe-outline"></ion-icon>
                <span>Sitio Web: {{ selectedUser.website }}</span>
              </div>
              <div class="detail-row">
                <ion-icon name="calendar-outline"></ion-icon>
                <span>Miembro desde: {{ selectedUser.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>

            <!-- ⚡ NUEVO: Listas de películas y series -->
            <div class="movie-lists" style="margin-top: 24px;">
              <div class="movie-list-section" *ngIf="getUserLikedMovies(selectedUser).length > 0">
                <h3 class="list-title"><ion-icon name="heart" color="danger"></ion-icon> Películas que le gustan</h3>
                <div class="movies-scroll">
                  <a *ngFor="let m of getUserLikedMovies(selectedUser)" [routerLink]="['/movie', m._id]" (click)="selectedUser = null" class="mini-card">
                    <img [src]="m.posterPath || getFallbackImage(m.title)" alt="">
                    <p>{{ m.title }}</p>
                  </a>
                </div>
              </div>

              <div class="movie-list-section" *ngIf="getUserLikedSeries(selectedUser).length > 0">
                <h3 class="list-title"><ion-icon name="heart" color="danger"></ion-icon> Series que le gustan</h3>
                <div class="movies-scroll">
                  <a *ngFor="let m of getUserLikedSeries(selectedUser)" [routerLink]="['/movie', m._id]" (click)="selectedUser = null" class="mini-card">
                    <img [src]="m.posterPath || getFallbackImage(m.title)" alt="">
                    <p>{{ m.title }}</p>
                  </a>
                </div>
              </div>

              <div class="movie-list-section" *ngIf="getUserDislikedMovies(selectedUser).length > 0">
                <h3 class="list-title"><ion-icon name="heart-dislike-outline" color="medium"></ion-icon> Películas que no le gustan</h3>
                <div class="movies-scroll">
                  <a *ngFor="let m of getUserDislikedMovies(selectedUser)" [routerLink]="['/movie', m._id]" (click)="selectedUser = null" class="mini-card">
                    <img [src]="m.posterPath || getFallbackImage(m.title)" alt="">
                    <p>{{ m.title }}</p>
                  </a>
                </div>
              </div>

              <div class="movie-list-section" *ngIf="getUserDislikedSeries(selectedUser).length > 0">
                <h3 class="list-title"><ion-icon name="heart-dislike-outline" color="medium"></ion-icon> Series que no le gustan</h3>
                <div class="movies-scroll">
                  <a *ngFor="let m of getUserDislikedSeries(selectedUser)" [routerLink]="['/movie', m._id]" (click)="selectedUser = null" class="mini-card">
                    <img [src]="m.posterPath || getFallbackImage(m.title)" alt="">
                    <p>{{ m.title }}</p>
                  </a>
                </div>
              </div>
            </div>

            <ion-button expand="block" fill="outline" color="light" (click)="selectedUser = null" style="margin-top: 32px;">Cerrar</ion-button>
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .hero { position: relative; min-height: 300px; display: flex; flex-direction: column; justify-content: flex-end; }
    .hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; filter: blur(8px); transform: scale(1.1); opacity: 0.4; }
    .hero-gradient { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, #000 100%); }
    .hero-content { position: relative; padding: 24px 16px; display: flex; gap: 16px; align-items: flex-end; }
    .poster { width: 110px; height: 165px; object-fit: cover; border-radius: 8px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 24px rgba(0,0,0,0.8); }
    .info { padding-bottom: 4px; }
    .title { font-size: 24px; font-weight: 900; color: #fff; margin: 0 0 6px; line-height: 1.1; }
    .meta { font-size: 13px; color: #b3b3b3; margin: 0 0 8px; }
    .imdb-badge { display: inline-flex; align-items: center; gap: 4px; background: #f5c518; color: #000; font-weight: 800; font-size: 12px; padding: 2px 8px; border-radius: 4px; }
    .preference-buttons { display: flex; gap: 4px; margin-top: 8px; margin-left: -8px; }
    .ratings-grid { display: grid; grid-template-columns: repeat(3, 1fr); padding: 24px 16px; gap: 8px; border-bottom: 1px solid #232323; }
    .rating-cell { text-align: center; }
    .rating-value { font-size: 28px; font-weight: 900; color: #fff; line-height: 1; }
    .rating-value.public { color: #46d369; } .rating-value.critic { color: #f5c518; } .rating-value.global { color: #e50914; } .rating-value.empty { color: #5a5a5a; }
    .rating-label { font-size: 13px; color: #fff; margin-top: 4px; font-weight: 600; }
    .rating-count { font-size: 11px; color: #808080; }
    .section { padding: 0 16px; }
    .section-title { font-size: 20px; font-weight: 700; color: #fff; margin: 24px 0 12px; }
    .overview { color: #b3b3b3; font-size: 14px; line-height: 1.6; margin: 0; }
    .genres, .cast { display: flex; flex-wrap: wrap; gap: 8px; }
    .genre-chip { padding: 4px 12px; border-radius: 16px; border: 1px solid #5a5a5a; color: #fff; font-size: 12px; }
    .cast-chip { padding: 4px 12px; border-radius: 4px; background: #232323; color: #b3b3b3; font-size: 12px; }
    .rate-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .rate-label { color: #fff; font-size: 14px; } .slider { flex: 1; accent-color: #e50914; } .rate-value { color: #e50914; font-weight: 900; font-size: 18px; min-width: 32px; }
    .mt-12 { margin-top: 12px; }
    .review-textarea { --background: #1a1a1a; --color: #fff; --placeholder-color: #808080; --border-radius: 8px; }
    .review-footer { display: flex; justify-content: space-between; align-items: center; padding: 6px 4px 0; min-height: 20px; gap: 8px; }
    .review-hint { color: #808080; font-size: 12px; flex: 1; } .review-hint.error { color: #e50914; }
    .review-counter { color: #5a5a5a; font-size: 11px; margin-left: auto; } .review-counter.ok { color: #46d369; font-weight: 700; }
    .action-buttons { display: flex; gap: 8px; align-items: center; }
    .action-buttons ion-button { flex: 1; }
    .btn-primary { --background: #e50914; --color: #fff; --border-radius: 8px; --padding-top: 12px; --padding-bottom: 12px; font-weight: 700; text-transform: none; font-size: 15px; display: flex; justify-content: center; align-items: center; }
    .btn-primary[disabled] { opacity: 0.5; }
    .review-card { background: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #232323; }
    .review-card.my-review { border-color: #e50914; background: rgba(229,9,20,0.05); }
    .review-header { display: flex; justify-content: space-between; align-items: center; color: #fff; margin-bottom: 8px; flex-wrap: wrap; gap: 8px; }
    .review-rating { color: #e50914; font-weight: 900; font-size: 16px; }
    .role-tag { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-left: 8px; }
    .admin-tag { background: #e50914; color: #fff; border: 1px solid #fff; }
    .critic-tag { background: #f5c518; color: #000; }
    .review-card p { color: #b3b3b3; font-size: 14px; margin: 0; line-height: 1.5; }
    .review-target { display: flex; align-items: center; gap: 8px; background: rgba(229,9,20,0.08); border-left: 3px solid #e50914; padding: 10px 12px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; color: #b3b3b3; }
    .review-target ion-icon { color: #e50914; font-size: 16px; flex-shrink: 0; } .review-target strong { color: #fff; }
    .review-actions { display: flex; gap: 4px; } .edit-btn { --background: #2d2d2d; --color: #fff; }
    .avatar-lg { width: 80px; height: 80px; border-radius: 50%; background: #e50914; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; margin: 0 auto 12px; }
    
    .review-card.admin-card { border: 1px solid rgba(229, 9, 20, 0.5); background: rgba(229, 9, 20, 0.05); box-shadow: 0 0 10px rgba(229,9,20,0.1); }
    .review-card.critic-card { border: 1px solid rgba(245, 197, 24, 0.5); background: rgba(245, 197, 24, 0.05); box-shadow: 0 0 10px rgba(245,197,24,0.1); }

    .review-actions-bar { display: flex; gap: 8px; margin-top: 8px; margin-left: -8px; }
    .reply-box { background: #0d0d0d; padding: 12px; border-radius: 8px; border: 1px solid #2d2d2d; }
    .replies-container { margin-top: 12px; padding-left: 16px; border-left: 2px solid #2d2d2d; }
    .replies-container.flat { padding-left: 0; border-left: none; margin-top: 8px; }
    .reply-card { background: #121212; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .reply-card p { font-size: 13px; }
    
    .profile-details { background: #232323; border-radius: 8px; padding: 16px; }
    .detail-row { display: flex; align-items: flex-start; gap: 12px; color: #b3b3b3; font-size: 14px; margin-bottom: 12px; }
    .detail-row ion-icon { color: #e50914; font-size: 18px; flex-shrink: 0; margin-top: 2px; }
    .detail-row:last-child { margin-bottom: 0; }

    /* ⚡ Estilos para las mini-tarjetas dentro del modal */
    .movie-lists { margin-top: 16px; }
    .movie-list-section { margin-bottom: 24px; }
    .list-title { color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 6px; margin: 0 0 10px 0; }
    .movies-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; }
    .movies-scroll::-webkit-scrollbar { display: none; }
    .mini-card { width: 80px; flex-shrink: 0; text-decoration: none; }
    .mini-card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 6px; display: block; background: #1a1a1a; }
    .mini-card p { color: #b3b3b3; font-size: 10px; margin: 4px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `],
})
export class MovieDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movieService = inject(MovieService);
  private movieCache = inject(MovieCacheService);
  private reviewService = inject(ReviewService);
  private auth = inject(AuthService);
  private toast = inject(ToastController);
  private alert = inject(AlertController);
  private cd = inject(ChangeDetectorRef);

  movie: MovieDetail | null = null;
  myReview: Review | null = null;
  newRating = 8;
  newComment = '';
  submitting = false;
  selectedUser: any = null;
  currentUserId = '';
  isEditing = false;
  userPreference: 'like' | 'dislike' | null = null;

  topLevelReviews: ReviewNode[] = [];
  replyingTo: string | null = null;
  replyComment = '';
  submittingReply = false;
  expandedReplies: Record<string, boolean> = {};

  constructor() {
    addIcons({ 
      arrowBack, trash, create, star, filmOutline, 
      heart, heartOutline, heartDislikeOutline, chatbubbleOutline,
      calendarOutline, locationOutline, globeOutline, personOutline
    });
  }

  get isCommentValid(): boolean {
    const c = this.newComment.trim();
    return c.length >= 1 && c.length <= 500;
  }

  getFallbackImage(title: string): string {
    const cleanTitle = encodeURIComponent(title || 'Sin Título');
    return `https://placehold.co/150x220/1a1a1a/ffffff?text=${cleanTitle}`;
  }

  // ⚡ Funciones para filtrar las listas del modal
  getUserLikedMovies(user: any) {
    return (user?.likedMovies || []).filter((m: any) => m.type === 'movie');
  }
  getUserLikedSeries(user: any) {
    return (user?.likedMovies || []).filter((m: any) => m.type === 'tv');
  }
  getUserDislikedMovies(user: any) {
    return (user?.dislikedMovies || []).filter((m: any) => m.type === 'movie');
  }
  getUserDislikedSeries(user: any) {
    return (user?.dislikedMovies || []).filter((m: any) => m.type === 'tv');
  }

  ngOnInit() {
    this.currentUserId = this.auth.snapshot?._id || '';
    const id = this.route.snapshot.paramMap.get('id')!;

    const cachedBase = this.movieCache.getMovie(id);
    if (cachedBase) {
      this.movie = { ...cachedBase, reviews: this.movieCache.getDetail(id)?.reviews || [] } as MovieDetail;
    }
    const cachedDetail = this.movieCache.getDetail(id);
    if (cachedDetail) {
      this.movie = cachedDetail;
      this.processReviews(cachedDetail.reviews);
    }
    this.cd.detectChanges();

    if (!this.auth.snapshot) {
      this.auth.me().subscribe({
        next: () => { this.currentUserId = this.auth.snapshot?._id || ''; if (this.movie) this.applyMyReview(this.movie); this.cd.detectChanges(); },
        error: () => {},
      });
    }
    this.load(id);
  }

  load(id: string) {
    this.movieService.getById(id).subscribe({
      next: (res) => {
        this.movie = res.data;
        this.userPreference = res.data.userPreference || null;
        this.processReviews(this.movie.reviews);
        this.applyMyReview(res.data);
        this.cd.detectChanges();
      },
      error: () => {
        if (!this.movie) { this.showToast('Error al cargar', 'danger'); this.router.navigateByUrl('/tabs/movies'); }
      },
    });
  }

  private processReviews(reviews: Review[]) {
    this.topLevelReviews = [];
    
    const buildTree = (parentId: string | null): ReviewNode[] => {
      return reviews
        .filter(r => (r.parent || null) === (parentId || null))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map(r => ({
          ...r,
          children: buildTree(r._id)
        }));
    };

    let tree = buildTree(null);
    
    tree.sort((a, b) => {
      const roleWeight: Record<string, number> = { admin: 3, critic: 2, user: 1 };
      const weightA = roleWeight[a.user.role] || 1;
      const weightB = roleWeight[b.user.role] || 1;
      
      if (weightA !== weightB) {
        return weightB - weightA; 
      }
      return (b.likes?.length || 0) - (a.likes?.length || 0); 
    });
    
    this.topLevelReviews = tree;
  }

  private applyMyReview(detail: MovieDetail) {
    const me = this.auth.snapshot;
    if (!me) { this.myReview = null; return; }
    this.myReview = detail.reviews.find((r) => r.user._id === me._id && !r.parent) ?? null;
    if (this.myReview && !this.isEditing) {
      this.newRating = this.myReview.rating;
      this.newComment = this.myReview.comment;
    }
  }

  goBack() { this.router.navigateByUrl('/tabs/movies'); }
  showUserProfile(user: any) { this.selectedUser = user; }

  markPreference(action: 'like' | 'dislike') {
    if (!this.movie) return;
    this.userPreference = action;
    this.cd.detectChanges();

    this.auth.toggleMoviePreference(this.movie._id, action).subscribe({
      next: () => this.showToast(action === 'like' ? 'Añadida a favoritas' : 'Añadida a no favoritas', 'success'),
      error: () => {
        this.userPreference = null;
        this.cd.detectChanges();
        this.showToast('Error al guardar preferencia', 'danger');
      }
    });
  }

  startEdit() {
    if (!this.myReview) return;
    this.isEditing = true;
    this.newRating = this.myReview.rating;
    this.newComment = this.myReview.comment;
    this.cd.detectChanges();
  }

  cancelEdit() {
    this.isEditing = false;
    if (this.myReview) {
      this.newRating = this.myReview.rating;
      this.newComment = this.myReview.comment;
    }
    this.cd.detectChanges();
  }

  submitReview() {
    if (!this.movie || !this.movie._id || !this.isCommentValid || this.submitting) return;
    this.submitting = true;
    this.cd.detectChanges();

    const movieId = this.movie._id;
    const isEdit = !!this.myReview;
    const reviewId = this.myReview?._id;
    const cleanComment = this.newComment.trim();

    const obs = isEdit && reviewId
      ? this.reviewService.update(reviewId, { rating: this.newRating, comment: cleanComment })
      : this.reviewService.create({ movieId, rating: this.newRating, comment: cleanComment });

    obs.subscribe({
      next: () => {
        this.submitting = false;
        this.isEditing = false;
        this.showToast(isEdit ? 'Reseña actualizada' : 'Reseña publicada');
        this.load(movieId);
      },
      error: (err: any) => {
        this.submitting = false;
        this.cd.detectChanges();
        this.showToast(err?.error?.message || 'Error al guardar', 'danger');
      },
    });
  }

  toggleReplyBox(reviewId: string) {
    this.replyingTo = this.replyingTo === reviewId ? null : reviewId;
    this.replyComment = '';
  }

  cancelReply() {
    this.replyingTo = null;
    this.replyComment = '';
  }

  submitReply(parentId: string) {
    if (!this.movie || !this.replyComment.trim() || this.submittingReply) return;
    this.submittingReply = true;
    this.cd.detectChanges();

    this.reviewService.create({
      movieId: this.movie._id,
      comment: this.replyComment.trim(),
      parent: parentId
    }).subscribe({
      next: () => {
        this.submittingReply = false;
        this.replyingTo = null;
        this.replyComment = '';
        this.showToast('Respuesta publicada');
        this.load(this.movie!._id);
      },
      error: (err: any) => {
        this.submittingReply = false;
        this.cd.detectChanges();
        this.showToast(err?.error?.message || 'Error al responder', 'danger');
      },
    });
  }

  toggleExpand(reviewId: string) {
    this.expandedReplies[reviewId] = true;
  }

  async deleteMyReview() {
    if (!this.myReview) return;
    const reviewId = this.myReview._id;
    const movieId = this.movie?._id;
    const a = await this.alert.create({
      header: 'Eliminar reseña', message: '¿Seguro que quieres eliminar tu reseña?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => {
            this.reviewService.remove(reviewId).subscribe({
              next: () => { 
                this.myReview = null; this.newRating = 8; this.newComment = ''; this.isEditing = false; 
                this.showToast('Reseña eliminada'); 
                if (movieId) this.load(movieId); 
              },
            });
          }},
      ],
    });
    await a.present();
  }

  async deleteReply(reply: any) {
    const a = await this.alert.create({
      header: 'Eliminar respuesta', message: '¿Seguro que quieres eliminar esta respuesta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => {
            this.reviewService.remove(reply._id).subscribe({
              next: () => { 
                this.showToast('Respuesta eliminada'); 
                if (this.movie) this.load(this.movie._id); 
              },
            });
          }},
      ],
    });
    await a.present();
  }

  likeReview(review: any) {
  this.reviewService.toggleLike(review._id).subscribe({
    next: (res) => {
      // 1. Actualizar la reseña original en el array plano
      const originalReview = this.movie!.reviews.find(r => r._id === review._id);
      if (originalReview) {
        originalReview.likes = res.data.likes;
      }
      // 2. Reconstruir el árbol con los datos actualizados
      this.processReviews(this.movie!.reviews);
      // 3. Forzar detección de cambios
      this.cd.detectChanges();
    },
  });
}

  private async showToast(message: string, color: 'success' | 'danger' = 'success') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'top' });
    t.present();
  }
}