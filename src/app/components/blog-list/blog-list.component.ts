import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { Blog } from '../../models/blog.model';
import { User } from '../../models/user.model';
import { Observable, Subject, BehaviorSubject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.css']
})
export class BlogListComponent implements OnInit, OnDestroy {
  // Observables
  blogs$!: Observable<Blog[]>;
  loading$ = new BehaviorSubject<boolean>(false);
  currentUser$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;

  // Form Controls
  searchControl = new FormControl('');
  sortBy = 'latest';

  // UI States
  showCreateBlogHint = false;
  selectedCategories: string[] = [];
  availableCategories = ['Teknoloji', 'Yazılım', 'Tasarım', 'İş Dünyası', 'Kişisel', 'Eğitim', 'Sağlık', 'Spor'];
  viewMode: 'grid' | 'list' = 'grid';

  // Pagination
  currentPage = 0;
  pageSize = 9;
  hasMore = true;

  // Private properties
  private destroy$ = new Subject<void>();
  private allBlogs: Blog[] = [];
  private filteredBlogs: Blog[] = [];

  // Statistics
  totalBlogs = 0;
  totalAuthors = 0;

  constructor(
    private blogService: BlogService,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  ngOnInit(): void {
    this.loadBlogs();
    this.setupSearch();
    this.checkCreateBlogHint();
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBlogs(): void {
    this.loading$.next(true);

    this.blogService.getAllBlogs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blogs) => {
          console.log('BURAYA GİRDİ ')
          console.log(blogs)
          this.allBlogs = blogs || [];
          this.applyFiltersAndSort();
          this.loading$.next(false);
        },
        error: (error) => {
          console.error('Blog yükleme hatası:', error);
          this.loading$.next(false);
          this.showNotification('Bloglar yüklenirken bir hata oluştu', 'error');
        }
      });
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.applyFiltersAndSort();
      });
  }

  private applyFiltersAndSort(): void {
    let filteredBlogs = [...this.allBlogs];

    // Arama filtresi
    const searchTerm = this.searchControl.value?.trim().toLowerCase();
    if (searchTerm) {
      filteredBlogs = filteredBlogs.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm) ||
        blog.content.toLowerCase().includes(searchTerm) ||
        blog.authorUsername?.toLowerCase().includes(searchTerm) ||
        blog.slug?.toLowerCase().includes(searchTerm)
      );
    }

    // Kategori filtresi
    if (this.selectedCategories.length > 0) {
      filteredBlogs = filteredBlogs.filter(blog =>
        this.selectedCategories.some(category =>
          blog.slug?.toLowerCase().includes(category.toLowerCase())
        )
      );
    }

    // Sıralama
    switch (this.sortBy) {
      case 'latest':
        filteredBlogs.sort((a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        );
        break;
      case 'oldest':
        filteredBlogs.sort((a, b) =>
          new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
        );
        break;
      case 'title':
        filteredBlogs.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
        break;
      case 'popular':
        filteredBlogs.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case 'comments':
        filteredBlogs.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
        break;
    }

    this.filteredBlogs = filteredBlogs;
    this.updateBlogsObservable();
  }

  private updateBlogsObservable(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const paginatedBlogs = this.filteredBlogs.slice(0, endIndex);

    this.hasMore = endIndex < this.filteredBlogs.length;

    this.blogs$ = new Observable(observer => {
      observer.next(paginatedBlogs);
      observer.complete();
    });
  }

  private checkCreateBlogHint(): void {
    this.isAuthenticated$.pipe(takeUntil(this.destroy$)).subscribe(isAuth => {
      this.showCreateBlogHint = isAuth && this.allBlogs.length === 0;
    });
  }

  private loadStatistics(): void {
    // Bu normalde backend'den gelecek
    this.totalBlogs = this.allBlogs.length;
    this.totalAuthors = new Set(this.allBlogs.map(blog => blog.authorUsername)).size;
  }

  // Public Methods
  onSortChange(): void {
    this.currentPage = 0;
    this.applyFiltersAndSort();
  }

  refreshBlogs(): void {
    this.searchControl.setValue('');
    this.selectedCategories = [];
    this.currentPage = 0;
    this.sortBy = 'latest';
    this.loadBlogs();
    this.showNotification('Bloglar yenilendi', 'success');
  }

  loadMore(): void {
    if (this.hasMore && !this.loading$.value) {
      this.currentPage++;
      this.updateBlogsObservable();
    }
  }

  viewBlog(blogId: number | undefined): void {
    if (blogId) {
      this.router.navigate(['/blogs', blogId]);
    }
  }

  createNewBlog(): void {
    this.router.navigate(['/create-blog']);
  }

  toggleCategory(category: string): void {
    const index = this.selectedCategories.indexOf(category);
    if (index === -1) {
      this.selectedCategories.push(category);
    } else {
      this.selectedCategories.splice(index, 1);
    }
    this.currentPage = 0;
    this.applyFiltersAndSort();
  }

  clearAllFilters(): void {
    this.searchControl.setValue('');
    this.selectedCategories = [];
    this.sortBy = 'latest';
    this.currentPage = 0;
    this.applyFiltersAndSort();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  // Blog Actions
  editBlog(blog: Blog, event: Event): void {
    event.stopPropagation();
    if (blog.id) {
      this.router.navigate(['/edit-blog', blog.id]);
    }
  }

  deleteBlog(blog: Blog, event: Event): void {
    event.stopPropagation();

    if (confirm(`"${blog.title}" adlı blog yazısını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) {
      if (blog.id) {
        this.blogService.deleteBlog(blog.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.allBlogs = this.allBlogs.filter(b => b.id !== blog.id);
              this.applyFiltersAndSort();
              this.loadStatistics();
              this.showNotification('Blog başarıyla silindi', 'success');
            },
            error: (error) => {
              console.error('Blog silme hatası:', error);
              this.showNotification('Blog silinirken bir hata oluştu', 'error');
            }
          });
      }
    }
  }
  // Utility Methods
  formatDate(date: Date | string | undefined): string {
    if (!date) return '';

    const blogDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - blogDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Şimdi';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} dk önce`;
    } else if (diffHours < 24) {
      return `${diffHours} sa önce`;
    } else if (diffDays === 1) {
      return 'Dün';
    } else if (diffDays <= 7) {
      return `${diffDays} gün önce`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} hafta önce`;
    } else {
      return blogDate.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }
  truncateContent(content: string, maxLength: number = 150): string {
    if (!content) return '';

    // HTML tag'lerini temizle
    const textContent = content.replace(/<[^>]*>/g, '').trim();

    if (textContent.length <= maxLength) {
      return textContent;
    }

    // Kelime sınırında kes
    const truncated = textContent.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
  }
  getReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }
  // Permission Methods
  canEditBlog(blog: Blog, currentUser: User | null): boolean {
    if (!currentUser) return false;
    return currentUser.username === blog.authorUsername || currentUser.role === 'ADMIN';
  }
  // Display Methods
  getAuthorInitials(username: string | undefined): string {
    if (!username) return 'U';
    return username.substring(0, 2).toUpperCase();
  }
  getBlogTags(tags: string | undefined): string[] {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  }
  // Track Functions
  trackByBlogId(index: number, blog: Blog): number {
    return blog.id || index;
  }

  trackByCategory(index: number, category: string): string {
    return category;
  }

  // Notification System
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      zIndex: '9999',
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      background: type === 'success' ? '#10b981' :
        type === 'error' ? '#ef4444' : '#3b82f6'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  // Navigation Methods
  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

}
