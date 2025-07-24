// src/app/components/blog-detail/blog-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';
import { Blog } from '../../models/blog.model';
import { CommentModel, CommentRequest } from '../../models/comment.model';
import { BlogService } from '../../services/blog.service';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    MatSnackBarModule
  ],
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.css']
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  blog: Blog | null = null;
  comments: CommentModel[] = [];
  isLoading = false;
  isCommentsLoading = false;
  isSubmittingComment = false;

  // Yorum formu
  newComment: CommentRequest = {
    content: ''
  };

  // UI durumları
  showCommentForm = false;
  isAuthenticated = false;
  currentUser: string | null = null;

  // Blog metadata
  readingTime = 0;
  relatedBlogs: Blog[] = [];

  // Authentication state
  pendingComment = ''; // Giriş yapmadan önce yazılan yorum

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private blogService: BlogService,
    private commentService: CommentService,
    private authService: AuthService,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadBlogDetail();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthStatus(): void {
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
        if (isAuth) {
          this.currentUser = this.authService.getCurrentUser()?.username ?? null;
        } else {
          this.currentUser = null;
        }
      });
  }

  private loadBlogDetail(): void {
    // URL'den blog ID'sini güvenli bir şekilde al
    const blogIdParam = this.route.snapshot.paramMap.get('id');
    const blogId = blogIdParam ? Number(blogIdParam) : NaN;

    if (isNaN(blogId) || blogId <= 0) {
      console.warn('Geçersiz blog ID:', blogIdParam);
      this.router.navigate(['/blogs']);
      return;
    }

    this.isLoading = true;

    this.blogService.getBlogById(blogId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blog) => {
          this.blog = blog;
          this.calculateReadingTime();
          this.isLoading = false;
          this.loadComments(blogId);
        },
        error: (error) => {
          console.error('Blog yüklenirken hata:', error);
          this.isLoading = false;
          this.snackBar.open('Blog yüklenirken bir hata oluştu veya blog bulunamadı.', 'Kapat', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.router.navigate(['/blogs']);
        }
      });
  }

  private loadComments(blogId: number): void {
    this.isCommentsLoading = true;

    this.commentService.getCommentsByBlogId(blogId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comments) => {
          this.comments = comments;
          this.isCommentsLoading = false;
        },
        error: (error) => {
          console.error('Yorumlar yüklenirken hata:', error);
          this.isCommentsLoading = false;
          this.snackBar.open('Yorumlar yüklenirken bir hata oluştu.', 'Kapat', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private calculateReadingTime(): void {
    if (this.blog?.content) {
      const wordsPerMinute = 200;
      const wordCount = this.blog.content.split(/\s+/).filter(word => word.length > 0).length;
      this.readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }
  }

  // Yorum ekleme - Sadece giriş yapmış kullanıcılar için
  onSubmitComment(): void {
    if (!this.isAuthenticated) {
      this.pendingComment = this.newComment.content;
      this.redirectToLogin('comment');
      return;
    }

    if (!this.newComment.content.trim() || !this.blog?.id) {
      this.snackBar.open('Yorum içeriği boş olamaz.', 'Kapat', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.isSubmittingComment = true;

    this.commentService.addComment(this.blog.id, this.newComment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comment) => {
          this.comments.unshift(comment);
          this.newComment.content = '';
          this.showCommentForm = false;
          this.isSubmittingComment = false;

          if (this.blog) {
            this.blog.commentCount = (this.blog.commentCount || 0) + 1;
          }
          this.snackBar.open('Yorumunuz başarıyla eklendi!', 'Kapat', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Yorum eklenirken hata:', error);
          this.isSubmittingComment = false;
          this.snackBar.open('Yorum eklenirken bir hata oluştu.', 'Kapat', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  // Giriş sayfasına yönlendirme
  private redirectToLogin(action?: string): void {
    const returnUrl = this.router.url;
    this.router.navigate(['/auth/login'], {
      queryParams: {
        returnUrl: returnUrl,
        action: action
      }
    });
  }

  // Yorum silme
  onDeleteComment(commentId: number | undefined): void {
    if (!commentId || !this.blog?.id) return;

    if (confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      this.commentService.deleteComment(commentId, this.blog.id)
      location.reload()
    }
  }

  // Blog beğenme/beğenmekten vazgeçme
  onToggleLike(): void {
    if (!this.isAuthenticated) {
      this.redirectToLogin('like');
      return;
    }

    if (!this.blog?.id) return;

    // UI'ı hemen güncelle (optimistic update)
    const initialIsLiked = this.blog.isLiked;
    const initialLikesCount = this.blog.likesCount || 0;

    this.blog.isLiked = !initialIsLiked;
    this.blog.likesCount = this.blog.isLiked ? initialLikesCount + 1 : Math.max(0, initialLikesCount - 1);

    this.blogService.toggleLike(this.blog.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Beğeni durumu başarıyla güncellendi.');
        },
        error: (error) => {
          console.error('Beğeni durumu değiştirilirken hata:', error);
          // Hata durumunda UI'ı eski haline döndür (rollback)
          if (this.blog) {
            this.blog.isLiked = initialIsLiked;
            this.blog.likesCount = initialLikesCount;
          }
          this.snackBar.open('Beğeni durumu güncellenirken bir hata oluştu.', 'Kapat', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  // Yorum formunu göster/gizle
  toggleCommentForm(): void {
    this.showCommentForm = !this.showCommentForm;
    if (this.pendingComment && this.isAuthenticated) {
      this.newComment.content = this.pendingComment;
      this.pendingComment = '';
    }
  }

  // Blog favorilere ekle/çıkar
  onToggleFavorite(): void {
    if (!this.isAuthenticated) {
      this.redirectToLogin('favorite');
      return;
    }

    if (!this.blog?.id) return;

    this.blogService.toggleFavorite(this.blog.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Favori durumu güncellendi');
          this.snackBar.open('Favori durumu başarıyla güncellendi.', 'Kapat', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Favori durumu değiştirilirken hata:', error);
          this.snackBar.open('Favori durumu güncellenirken bir hata oluştu.', 'Kapat', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  // Blog düzenleme (sadece author için)
  onEditBlog(): void {
    if (!this.isAuthenticated) {
      this.redirectToLogin('edit_blog');
      return;
    }

    if (this.blog?.id && this.isAuthor()) {
      this.router.navigate(['/blogs/edit', this.blog.id]);
    } else if (this.blog?.id && !this.isAuthor()) {
      this.snackBar.open('Bu blogu düzenleme yetkiniz yok.', 'Kapat', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // Blog silme (sadece author için)
  onDeleteBlog(): void {
    if (!this.blog?.id) return;

    if (confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) {
      this.blogService.deleteBlog(this.blog.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Blog başarıyla silindi.', 'Kapat', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/blogs']);
          },
          error: (error) => {
            console.error('Blog silinirken hata:', error);
            this.snackBar.open('Blog silinirken bir hata oluştu.', 'Kapat', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  // Helper methods
  getBlogImageUrl(): string {
    return this.blog?.imageUrl || '/assets/default-blog.jpg';
  }

  getBlogViewCount(): number {
    return this.blog?.viewCount || 0;
  }

  getRelatedBlogImageUrl(blog: Blog): string {
    return blog.imageUrl || '/assets/default-blog.jpg';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return this.datePipe.transform(date, 'longDate', 'tr-TR') || '';
  }

  formatDetailedDate(date: Date | string | undefined): string {
    if (!date) return '';
    return this.datePipe.transform(date, 'medium', 'tr-TR') || '';
  }

  getTagsArray(tags: string | string[] | undefined): string[] {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  isAuthor(): boolean {
    return this.isAuthenticated && this.blog?.authorUsername === this.authService.getCurrentUser()?.username;
  }

  isCommentOwner(comment: CommentModel): boolean {
    return this.isAuthenticated && comment.username === this.authService.getCurrentUser()?.username;
  }

  goBack(): void {
    this.router.navigate(['/blogs']);
  }

  formatContent(content: string): string {
    if (!content) return '';

    let formattedContent = content;

    // Code blocks
    // style="color: white" kaldırıldı, CSS'ten yönetilecek
    formattedContent = formattedContent.replace(
      /```([\s\S]*?)```/g,
      '<pre class="code-block"><code>$1</code></pre>'
    );

    // Inline code
    // style="color: white" kaldırıldı, CSS'ten yönetilecek
    formattedContent = formattedContent.replace(
      /`([^`]+)`/g,
      '<code class="inline-code">$1</code>'
    );

    // Bold text
    // style="color: white" kaldırıldı, CSS'ten yönetilecek
    formattedContent = formattedContent.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold">$1</strong>'
    );

    // Italic text
    // style="color: white" kaldırıldı, CSS'ten yönetilecek
    formattedContent = formattedContent.replace(
      /\*(.*?)\*/g,
      '<em class="italic">$1</em>'
    );

    // Links
    formattedContent = formattedContent.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="blog-link">$1</a>'
    );

    // Line breaks
    formattedContent = formattedContent.replace(/\n/g, '<br>');

    return formattedContent;
  }

  // Sosyal medya paylaşımları
  shareOnTwitter(): void {
    if (this.blog) {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`${this.blog.title} - ${this.blog.excerpt}`);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
    }
  }

  shareOnFacebook(): void {
    if (this.blog) {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    }
  }

  shareOnLinkedIn(): void {
    if (this.blog) {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(this.blog.title);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank', 'width=600,height=400');
    }
  }

  shareOnWhatsApp(): void {
    if (this.blog) {
      const text = encodeURIComponent(`${this.blog.title} - ${window.location.href}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  }

  copyUrl(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.snackBar.open('URL panoya kopyalandı!', 'Kapat', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }).catch(err => {
      console.error('URL kopyalanırken hata:', err);
      this.snackBar.open('URL kopyalanırken bir hata oluştu.', 'Kapat', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    });
  }

  navigateToRelatedBlog(blogId: number): void {
    this.router.navigate(['/blogs', blogId]);
  }

  trackByCommentId(index: number, comment: CommentModel): number | undefined {
    return comment.id;
  }

  trackByBlogId(index: number, blog: Blog): number | undefined {
    return blog.id;
  }
}
