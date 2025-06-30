import {Component, OnInit} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {Blog} from '../../../models/blog.model';
import {BehaviorSubject, Subject, takeUntil} from 'rxjs';
import {BlogService} from '../../../services/blog.service';
import {Router} from '@angular/router';
import {CommentService} from '../../../services/comment.service';
import {AuthService} from '../../../services/auth.service';
import {TranslatePipe} from '@ngx-translate/core';


@Component({
  selector: 'app-blog-cards',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './blog-cards.component.html',
  styleUrl: './blog-cards.component.css'
})
export class BlogCardsComponent implements OnInit{
  blogs: Blog[] = [

  ];

  loading$ = new BehaviorSubject<boolean>(false);
  // Private properties
  private destroy$ = new Subject<void>();
  constructor(
    private blogService: BlogService,
  private router: Router,
  private datePipe: DatePipe,
    private commentService: CommentService,
    private authService: AuthService,
) {
  }

  ngOnInit(): void {
    this.loadBlogs();

  }
  // Blogları yükle
  loadBlogs(): void {
    this.loading$.next(true);

    this.blogService.getAllBlogs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blogs) => {
          this.blogs = blogs;
          this.loading$.next(false);
        },
        error: (error) => {
          console.error('Blog yükleme hatası:', error);
          this.loading$.next(false);
        }
      });
  }

  // Blog resim URL'lerini dinamik olarak oluştur
  getBlogImageUrl(blogId: number): string {
    return ``;
  }

  getTagsArray(tags: string | string[] | undefined): string[] {
    // Eğer tags undefined veya null ise boş bir dizi döndür
    if (!tags) return [];

    // Eğer tags zaten bir dizi ise, doğrudan döndür
    if (Array.isArray(tags)) return tags;

    // Aksi takdirde, virgülle ayrılmış tags'leri bir diziye dönüştür
    return tags.split(',').map(tag => tag.trim());
  }

  formatDate(date: any): string {
    return  '' ;
  }


  // Okuma süresi hesapla (ortalama kelime sayısına göre)
  calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} dk okuma`;
  }

  // Like/Unlike toggle
  toggleLike(blog: Blog): void {
    blog.isLiked = !blog.isLiked;
    console.log(this.authService.getCurrentUser())
    if (this.authService.getCurrentUser()?.username){
      //SECILEN DEGER TRUE FALSE ONA GORE IF EKLEDIM
      if (blog.isLiked) {
        this.commentService.addLike(blog.id??0).subscribe(
          rquser => {
            blog.likesCount = (blog.likesCount || 0) + 1;
            console.log(rquser);
          }
        )
      }
      else {
        blog.likesCount = Math.max((blog.likesCount || 0) - 1, 0);
        blog.isLiked = false;
        this.commentService.deleteLike(blog.id??0)
      }
    }


    else if (!this.authService.getCurrentUser()?.username) {
      alert('For Like you must login')
      this.router.navigate(['/login']);
    }
     else {
      if (this.authService.getCurrentUser()?.username){
        this.commentService.deleteLike(blog.id??0)
      }else {
        alert('For Like you must login')
        this.router.navigate(['/login']);
      }

    }
  }

  navigateToBlock(id: number | undefined) {
    this.router.navigate(['/blogs', id]);
  }
}
