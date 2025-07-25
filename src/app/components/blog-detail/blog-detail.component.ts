// src/app/components/blog-detail/blog-detail.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core'; // ViewChild, ElementRef eklendi
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';
import { Blog } from '../../models/blog.model';
import { CommentModel, CommentRequest } from '../../models/comment.model';
import { BlogService } from '../../services/blog.service';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core'; // TranslateService eklendi
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

  // Yorumlar bölümüne erişmek için ViewChild
  @ViewChild('commentsSection') commentsSection!: ElementRef;

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
    private snackBar: MatSnackBar,
    private translateService: TranslateService // TranslateService enjekte edildi
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
          const errorMessage = error.message || this.translateService.instant('BLOG_DETAIL.ERROR.NOT_FOUND_TITLE');
          this.snackBar.open(errorMessage, this.translateService.instant('COMMON.CLOSE_BUTTON'), {
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
          this.snackBar.open(this.translateService.instant('BLOG_DETAIL.COMMENTS.LOADING_ERROR'), this.translateService.instant('COMMON.CLOSE_BUTTON'), {
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

  onSubmitComment(): void {
    if (!this.isAuthenticated) {
      this.pendingComment = this.newComment.content;
      this.redirectToLogin('comment');
      return;
    }

    if (!this.newComment.content.trim() || !this.blog?.id) {
      this.snackBar.open(this.translateService.instant('BLOG_DETAIL.COMMENTS.EMPTY_COMMENT_WARNING'), this.translateService.instant('COMMON.CLOSE_BUTTON'), {
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
          this.snackBar.open(this.translateService.instant('BLOG_DETAIL.COMMENTS.SUBMIT_SUCCESS'), this.translateService.instant('COMMON.CLOSE_BUTTON'), {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Yorum eklenirken hata:', error);
          this.isSubmittingComment = false;
          this.snackBar.open(this.translateService.instant('BLOG_DETAIL.COMMENTS.SUBMIT_ERROR'), this.translateService.instant('COMMON.CLOSE_BUTTON'), {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private redirectToLogin(action?: string): void {
    const returnUrl = this.router.url;
    this.router.navigate(['/auth/login'], {
      queryParams: {
        returnUrl: returnUrl,
        action: action
      }
    });
  }

  onDeleteComment(commentId: number | undefined): void {
    if (!commentId || !this.blog?.id) return;

    if (confirm(this.translateService.instant('BLOG_DETAIL.COMMENTS.DELETE_CONFIRM'))) { // Çeviri kullanıldı
      this.commentService.deleteComment(commentId, this.blog.id)
     location.reload()
    }
  }

  onToggleLike(): void {
    if (!this.isAuthenticated) {
      this.redirectToLogin('like');
      return;
    }

    if (!this.blog?.id) return;

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
          if (this.blog) {
            this.blog.isLiked = initialIsLiked;
            this.blog.likesCount = initialLikesCount;
          }
          this.snackBar.open(this.translateService.instant('BLOG_DETAIL.ACTIONS.LIKE_ERROR'), this.translateService.instant('COMMON.CLOSE_BUTTON'), { // Çeviri kullanıldı
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  toggleCommentForm(): void {
    this.showCommentForm = !this.showCommentForm;
    if (this.pendingComment && this.isAuthenticated) {
      this.newComment.content = this.pendingComment;
      this.pendingComment = '';
    }
  }

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
          this.snackBar.open(this.translateService.instant('BLOG_DETAIL.ACTIONS.SAVE_SUCCESS'), this.translateService.instant('COMMON.CLOSE_BUTTON'), { // Çeviri kullanıldı
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Favori durumu değiştirilirken hata:', error);
          this.snackBar.open(this.translateService.instant('BLOG_DETAIL.ACTIONS.SAVE_ERROR'), this.translateService.instant('COMMON.CLOSE_BUTTON'), { // Çeviri kullanıldı
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onEditBlog(): void {
    if (!this.isAuthenticated) {
      this.redirectToLogin('edit_blog');
      return;
    }

    if (this.blog?.id && this.isAuthor()) {
      this.router.navigate(['/blogs/edit', this.blog.id]);
    } else if (this.blog?.id && !this.isAuthor()) {
      this.snackBar.open(this.translateService.instant('BLOG_DETAIL.ACTIONS.EDIT_PERMISSION_ERROR'), this.translateService.instant('COMMON.CLOSE_BUTTON'), { // Çeviri kullanıldı
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  onDeleteBlog(): void {
    if (!this.blog?.id) return;

    if (confirm(this.translateService.instant('BLOG_DETAIL.ACTIONS.DELETE_CONFIRM'))) { // Çeviri kullanıldı
      this.blogService.deleteBlog(this.blog.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open(this.translateService.instant('BLOG_DETAIL.ACTIONS.DELETE_SUCCESS'), this.translateService.instant('COMMON.CLOSE_BUTTON'), { // Çeviri kullanıldı
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/blogs']);
          },
          error: (error) => {
            console.error('Blog silinirken hata:', error);
            this.snackBar.open(this.translateService.instant('BLOG_DETAIL.ACTIONS.DELETE_ERROR'), this.translateService.instant('COMMON.CLOSE_BUTTON'), { // Çeviri kullanıldı
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  // Yeni eklenen metot: Yorumlar bölümüne kaydır
  scrollToComments(): void {
    if (this.commentsSection) {
      this.commentsSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.toggleCommentForm();
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
    return this.datePipe.transform(date, 'longDate', undefined, 'uk') || '';
  }

  formatDetailedDate(date: Date | string | undefined): string {
    if (!date) return '';
    return this.datePipe.transform(date, 'medium', undefined, 'uk') || ''; // Ukraynaca locale kullanıldı
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
    formattedContent = formattedContent.replace(
      /```([\s\S]*?)```/g,
      '<pre class="code-block"><code>$1</code></pre>'
    );

    // Inline code
    formattedContent = formattedContent.replace(
      /`([^`]+)`/g,
      '<code class="inline-code">$1</code>'
    );

    // Bold text
    formattedContent = formattedContent.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold">$1</strong>'
    );

    // Italic text
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
      this.snackBar.open(this.translateService.instant('BLOG_DETAIL.ACTIONS.COPY_LINK_SUCCESS'), this.translateService.instant('COMMON.CLOSE_BUTTON'), {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }).catch(err => {
      console.error('URL kopyalanırken hata:', err);
      this.snackBar.open(this.translateService.instant('BLOG_DETAIL.ACTIONS.COPY_LINK_ERROR'), this.translateService.instant('COMMON.CLOSE_BUTTON'), {
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
