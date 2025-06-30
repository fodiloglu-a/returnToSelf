import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Blog } from '../../models/blog.model';
import { CommentModel, CommentRequest } from '../../models/comment.model';
import { BlogService } from '../../services/blog.service';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
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
    private authService: AuthService
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
    const blogId = Number(this.route.snapshot.paramMap.get('id'));

    if (!blogId) {
      this.router.navigate(['/blogs']);
      return;
    }

    this.isLoading = true;

    this.blogService.getBlogById(blogId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blog) => {
          console.log(blog)
          this.blog = blog;
          this.calculateReadingTime();
          this.isLoading = false;
          this.loadComments(blogId);

        },
        error: (error) => {
          console.error('Blog yüklenirken hata:', error);
          this.isLoading = false;
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
        }
      });
  }



  private calculateReadingTime(): void {
    if (this.blog?.content) {
      const wordsPerMinute = 200;
      const wordCount = this.blog.content.split(/\s+/).length;
      this.readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }
  }

  // Yorum ekleme - Sadece giriş yapmış kullanıcılar için
  onSubmitComment(): void {
    if (!this.isAuthenticated) {
      // Yorumu sakla ve giriş sayfasına yönlendir
      this.pendingComment = this.newComment.content;
      this.redirectToLogin();
      return;
    }

    if (!this.newComment.content.trim() || !this.blog?.id) {
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
        },
        error: (error) => {
          console.error('Yorum eklenirken hata:', error);
          this.isSubmittingComment = false;
        }
      });
  }

  // Giriş sayfasına yönlendirme
  private redirectToLogin(): void {
    // Return URL olarak current page'i sakla
    const returnUrl = this.router.url;
    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: returnUrl,
        action: 'comment' // Yorum yapmak için giriş yapıldığını belirt
      }
    });
  }

  // Yorum silme
  onDeleteComment(commentId: number | undefined): void {
    if (!commentId || !this.blog?.id) return;

    if (confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      this.commentService.deleteComment(commentId, this.blog.id)
      location.reload();
    }
  }

  // Blog beğenme
  onToggleLike(): void {
    if (!this.isAuthenticated) {
      this.redirectToLogin();
      return;
    }else{
      if (this.blog?.isLiked) {
        this.blog.isLiked = false;
        this.blog.likesCount = Math.max((this.blog.likesCount || 0) - 1, 0);
        this.commentService.deleteLike(this.blog.id??0)
      }else if (this.blog?.isLiked == false) {
        this.blog.isLiked = true;
        this.blog.likesCount = (this.blog.likesCount || 0) + 1;
        this.commentService.addLike(this.blog.id??0).subscribe(
          requser => {
            console.log(requser);
          }
        )
      }
    }

    if (!this.blog?.id) return;

    this.blogService.toggleLike(this.blog.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.blog) {
            this.blog.isLiked = !this.blog.isLiked;
            this.blog.likesCount = this.blog.isLiked
              ? (this.blog.likesCount || 0) + 1
              : Math.max((this.blog.likesCount || 0) - 1, 0);
          }
        },
        error: (error) => {
          console.error('Beğeni durumu değiştirilirken hata:', error);
        }
      });
  }

  // Yorum formunu göster/gizle
  toggleCommentForm(): void {
    this.showCommentForm = !this.showCommentForm;
    // Eğer pending comment varsa, onu form'a yerleştir
    if (this.pendingComment && this.isAuthenticated) {
      this.newComment.content = this.pendingComment;
      this.pendingComment = '';
    }
  }

  // Blog favorilere ekle/çıkar
  onToggleFavorite(): void {
    if (!this.isAuthenticated) {
      this.redirectToLogin();
      return;
    }

    if (!this.blog?.id) return;

    this.blogService.toggleFavorite(this.blog.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Favori durumu güncellendi');
        },
        error: (error) => {
          console.error('Favori durumu değiştirilirken hata:', error);
        }
      });
  }

  // Blog düzenleme (sadece author için)
  onEditBlog(): void {
    if (!this.isAuthenticated) {
      this.redirectToLogin();
      return;
    }

    if (this.blog?.id) {
      this.router.navigate(['/blogs/edit', this.blog.id]);
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
            this.router.navigate(['/blogs']);
          },
          error: (error) => {
            console.error('Blog silinirken hata:', error);
          }
        });
    }
  }

  // Helper methods
  getBlogImageUrl(): string | undefined {
    return (this.blog as any)?.imageUrl;
  }

  getBlogViewCount(): number {
    return (this.blog as any)?.viewCount || 0;
  }

  getRelatedBlogImageUrl(blog: Blog): string | undefined {
    return (blog as any)?.imageUrl;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDetailedDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTagsArray(tags: string | string[] | undefined): string[] {
    // Eğer tags undefined veya null ise boş dizi döndür
    if (!tags) return [];

    // Eğer tags zaten bir dizi ise, doğrudan o diziyi döndür
    if (Array.isArray(tags)) return tags;

    // Eğer tags bir string ise, virgülle ayrılmış parçalara böl
    return tags.split(',').map(tag => tag.trim());
  }

  isAuthor(): boolean {
    return this.blog?.authorUsername === this.currentUser;
  }

  isCommentOwner(comment: CommentModel): boolean {
    return comment.username === this.currentUser;
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

  // Sosyal medya paylaşımları
  shareOnTwitter(): void {
    if (this.blog) {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`${this.blog.title} - ${this.blog.excerpt}`);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  }

  shareOnFacebook(): void {
    if (this.blog) {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }
  }

  shareOnLinkedIn(): void {
    if (this.blog) {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(this.blog.title);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
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
      alert('URL kopyalandı!');
    });
  }

  navigateToRelatedBlog(blogId: number): void {
    this.router.navigate(['/blog', blogId]);
  }

  trackByCommentId(index: number, comment: CommentModel): number {
    return comment.id || index;
  }

  trackByBlogId(index: number, blog: Blog): number {
    return blog.id || index;
  }
}
