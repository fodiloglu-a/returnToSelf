// src/app/services/blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Blog, BlogRequest } from '../models/blog.model';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  //private readonly API_URL = 'https://returntoyourself.onrender.com/api/blogs';
  private readonly API_URL = 'http://localhost:8080/api/blogs';

  // Blog listesi için reactive state
  private blogsSubject = new BehaviorSubject<Blog[]>([]);
  public blogs$ = this.blogsSubject.asObservable();

  // Loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Tüm blogları getir (public endpoint)
  getAllBlogs(): Observable<Blog[]> {
    this.loadingSubject.next(true);

    return this.http.get<Blog[]>(`${this.API_URL}/public/all`)
      .pipe(
        tap(blogs => {
          this.blogsSubject.next(blogs);
          this.loadingSubject.next(false);
        })
      );
  }

  // Blog detayını getir (public endpoint)
  getBlogById(id: number): Observable<Blog> {
    return this.http.get<Blog>(`${this.API_URL}/public/${id}`);
  }

  // Blog ara (public endpoint)
  searchBlogs(keyword: string): Observable<Blog[]> {
    const params = new HttpParams().set('keyword', keyword);

    return this.http.get<Blog[]>(`${this.API_URL}/public/search`, { params })
      .pipe(
        tap(blogs => this.blogsSubject.next(blogs))
      );
  }

  // Yeni blog oluştur (protected endpoint)
  createBlog(blogRequest: BlogRequest): Observable<Blog> {
    return this.http.post<Blog>(this.API_URL, blogRequest)
      .pipe(
        tap(newBlog => {
          // Mevcut blog listesine yeni blog'u ekle
          const currentBlogs = this.blogsSubject.value;
          this.blogsSubject.next([newBlog, ...currentBlogs]);
        })
      );
  }

  // Kullanıcının bloglarını getir (protected endpoint)
  getMyBlogs(): Observable<Blog[]> {
    return this.http.get<Blog[]>(`${this.API_URL}/my`);
  }

  // Blog güncelle (protected endpoint)
  updateBlog(id: number, blogRequest: BlogRequest): Observable<Blog> {
    return this.http.put<Blog>(`${this.API_URL}/${id}`, blogRequest)
      .pipe(
        tap(updatedBlog => {
          // Blog listesinde güncellenen blog'u değiştir
          const currentBlogs = this.blogsSubject.value;
          const updatedBlogs = currentBlogs.map(blog =>
            blog.id === id ? updatedBlog : blog
          );
          this.blogsSubject.next(updatedBlogs);
        })
      );
  }

  // Blog sil (protected endpoint)
  deleteBlog(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`)
      .pipe(
        tap(() => {
          // Blog listesinden silinen blog'u çıkar
          const currentBlogs = this.blogsSubject.value;
          const filteredBlogs = currentBlogs.filter(blog => blog.id !== id);
          this.blogsSubject.next(filteredBlogs);
        })
      );
  }

  // Cache'i temizle
  clearCache(): void {
    this.blogsSubject.next([]);
  }

  // Pagination için blogları getir
  getBlogsPaginated(page: number = 0, size: number = 10): Observable<Blog[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Blog[]>(`${this.API_URL}/public/paginated`, { params });
  }

  // Kategoriye göre blogları getir (gelecekte kategoriler eklenirse)
  getBlogsByCategory(category: string): Observable<Blog[]> {
    const params = new HttpParams().set('category', category);

    return this.http.get<Blog[]>(`${this.API_URL}/public/category`, { params });
  }

  // Popüler blogları getir
  getPopularBlogs(limit: number = 5): Observable<Blog[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<Blog[]>(`${this.API_URL}/public/popular`, { params });
  }

  // Son blogları getir
  getLatestBlogs(limit: number = 5): Observable<Blog[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<Blog[]>(`${this.API_URL}/public/latest`, { params });
  }

  // Mevcut blog listesini al
  getCurrentBlogs(): Blog[] {
    return this.blogsSubject.value;
  }

  // Loading durumunu manuel olarak set et
  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  // Blog favorilere ekle/çıkar (gelecekte eklenebilir)
  toggleFavorite(blogId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/${blogId}/favorite`, {});
  }

  // Blog beğen/beğenme (gelecekte eklenebilir)
  toggleLike(blogId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/${blogId}/like`, {});
  }
}
