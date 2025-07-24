// src/app/components/home/blog-cards/blog-cards.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // DatePipe eklendi
import { Blog } from '../../../models/blog.model';
import { BehaviorSubject, Subject, takeUntil, Observable } from 'rxjs'; // Observable eklendi
import { BlogService } from '../../../services/blog.service';
import { Router } from '@angular/router';
import { CommentService } from '../../../services/comment.service';
import { AuthService } from '../../../services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-blog-cards',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DatePipe], // DatePipe import edildi
  templateUrl: './blog-cards.component.html',
  styleUrl: './blog-cards.component.css'
})
export class BlogCardsComponent implements OnInit, OnDestroy {
  // blogs: Blog[] = []; // Bu satırı artık kullanmıyoruz.
  blogs$: Observable<Blog[]>; // Data artık Observable olarak gelecek

  loading$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  constructor(
    private blogService: BlogService,
    private router: Router,
    private datePipe: DatePipe, // DatePipe inject edildi
    private commentService: CommentService,
    private authService: AuthService,
  ) {
    // BlogService'den gelen Observable'ı doğrudan blogs$'e atıyoruz
    this.blogs$ = this.blogService.blogs$;
  }

  ngOnInit(): void {
    this.loadBlogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Blogları yükle
  loadBlogs(): void {
    this.loading$.next(true); // Yükleme durumunu başlat
    this.blogService.getAllBlogs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blogs) => {
          // this.blogs = blogs; // BehaviorSubject zaten blogs$i güncellediği için bu satıra gerek yok
          this.loading$.next(false); // Yükleme durumunu bitir
        },
        error: (error) => {
          console.error('Blog yükleme hatası:', error);
          this.loading$.next(false); // Hata durumunda da yüklemeyi bitir
        }
      });
  }

  // Blog resim URL'lerini dinamik olarak oluştur
  // Blog modelinizde `imageUrl` özelliği olduğu için, direkt onu kullanmak daha doğru olacaktır.
  // Eğer imageUrl boşsa varsayılan bir görsel döndürebilirsiniz.
  getBlogImageUrl(blog: Blog): string { // Parametre Blog tipi olarak değiştirildi
    return blog.imageUrl || '/assets/default-blog.jpg'; // Varsayılan görsel yolu
  }

  getTagsArray(tags: string | string[] | undefined): string[] {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    return tags.split(',').map(tag => tag.trim());
  }

  // formatDate metodu artık bu bileşende doğrudan kullanılmadığı için sadeleştirilebilir
  // veya HTML'de DatePipe ile direkt kullanılabilir.
  // HTML'de DatePipe kullanmak daha temiz olacaktır.
  // Eğer bu metodu başka bir yerde kullanmanız gerekiyorsa içeriğini koruyun.
  formatDate(date: any): string {
    return this.datePipe.transform(date, 'mediumDate') || ''; // DatePipe kullanarak biçimlendir
  }

  calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} dk okuma`;
  }

  toggleLike(blog: Blog): void {
    // Mevcut kodunuz zaten beğenme/beğenmeme mantığını düzgün yönetiyor.
    // Sadece blogService.toggleLike çağrısının da bir observable döndüğünü ve abone olunması gerektiğini unutmayın.
    if (!this.authService.isAuthenticated()) {
      alert('Beğenmek için giriş yapmalısınız');
      this.router.navigate(['/login']);
      return;
    }

    // `isLiked` durumunu UI'da hemen göster
    blog.isLiked = !blog.isLiked;
    blog.likesCount = blog.isLiked ? (blog.likesCount || 0) + 1 : Math.max((blog.likesCount || 0) - 1, 0);

    // Backend çağrısı
    this.blogService.toggleLike(blog.id!) // id'nin varolduğundan eminseniz ! kullanın
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Başarılı olduğunda bir şey yapmaya gerek yok, UI zaten güncellendi
          console.log('Beğeni durumu başarıyla güncellendi');
        },
        error: (error) => {
          console.error('Beğeni durumu değiştirilirken hata:', error);
          // Hata durumunda UI'ı eski haline döndürmek isteyebilirsiniz
          blog.isLiked = !blog.isLiked;
          blog.likesCount = blog.isLiked ? (blog.likesCount || 0) + 1 : Math.max((blog.likesCount || 0) - 1, 0);
          alert('Beğeni durumu güncellenirken bir hata oluştu.');
        }
      });
  }

  navigateToBlock(id: number | undefined) {
    if (id) {
      this.router.navigate(['/blogs', id]);
    }
  }

  // ngFor optimizasyonu için trackBy fonksiyonu
  trackByBlogId(index: number, blog: Blog): number {
    return blog.id || index;
  }
}
