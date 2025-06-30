// src/app/services/comment.service.ts
import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, BehaviorSubject, map, of} from 'rxjs';
import { CommentModel, CommentRequest } from '../models/comment.model';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
 private readonly API_URL = 'http://localhost:8080/api/comments';
  // private readonly API_URL = 'https://returntoyourself.onrender.com/api/comments';

  // Yorumlar için reactive state (blog bazında)
  private commentsSubject = new BehaviorSubject<{ [blogId: number]: CommentModel[] }>({});
  public comments$ = this.commentsSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Like state (blog bazında)
  private likeStatusSubject = new BehaviorSubject<{ [blogId: number]: boolean }>({});
  public likeStatus$ = this.likeStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Belirli bir blog için yorumları getir (public endpoint)
  getCommentsByBlogId(blogId: number): Observable<CommentModel[]> {
    this.loadingSubject.next(true);

    return this.http.get<CommentModel[]>(`${this.API_URL}/public/blog/${blogId}`)
      .pipe(
        tap(comments => {
          // Blog ID'ye göre yorumları cache'le
          const currentComments = this.commentsSubject.value;
          currentComments[blogId] = comments;
          this.commentsSubject.next({ ...currentComments });
          this.loadingSubject.next(false);
        })
      );
  }
  // Yeni yorum ekle (protected endpoint)
  addComment(blogId: number, commentRequest: CommentRequest): Observable<CommentModel> {
    return this.http.post<CommentModel>(`${this.API_URL}/blog/${blogId}`, commentRequest)
      .pipe(
        tap(newComment => {
          // Mevcut yorumlara yeni yorumu ekle
          const currentComments = this.commentsSubject.value;
          const blogComments = currentComments[blogId] || [];
          currentComments[blogId] = [newComment, ...blogComments];
          this.commentsSubject.next({ ...currentComments });
        })
      );
  }
  // Yorum sil (protected endpoint)
  deleteComment(commentId: number, blogId: number): void {
    this.http.delete(`${this.API_URL}/${commentId}`)
      .pipe(
        tap(() => {
          // Yorumu listeden çıkar
          const currentComments = this.commentsSubject.value;
          const blogComments = currentComments[blogId] || [];
          currentComments[blogId] = blogComments.filter(comment => comment.id !== commentId);
          this.commentsSubject.next({ ...currentComments });
        })
      )
      .subscribe({
        next: () => {
          console.log(`Yorum ID ${commentId} başarıyla silindi`);
        },
        error: (error) => {
          console.error(`Yorum ID ${commentId} silinirken hata oluştu:`, error);
        }
      });
  }

  // Blog gönderisine beğeni ekle (yeni eklenen metod)
  addLike(blogId: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.API_URL}/blog-like-add/${blogId}`, {})
      .pipe(
        tap(result => {
          // Like durumunu güncelle
          const currentLikeStatus = this.likeStatusSubject.value;
          currentLikeStatus[blogId] = true;
          this.likeStatusSubject.next({ ...currentLikeStatus });
          return result;
        }),
        catchError(error => {
          console.error('Blog beğenme işlemi sırasında hata:', error);
          throw error;
        })
      );
  }

  // Blog gönderisinden beğeni kaldır (yeni eklenen metod)
  deleteLike(blogId: number): void {
    this.http.delete(`${this.API_URL}/blog-like-delete/${blogId}`)
      .subscribe({
        next: () => {
          console.log(`Blog ID ${blogId} için beğeni başarıyla silindi`);
        },
        error: (error) => {
          console.error(`Blog ID ${blogId} için beğeni silinirken hata oluştu:`, error);
        }
      });
  }
}
