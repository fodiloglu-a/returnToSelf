// app.module.ts
import {HTTP_INTERCEPTORS, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    if (req.url.includes('.gif')) {
      const cachedReq = req.clone({
        setHeaders: {
          'Cache-Control': 'max-age=31536000' // 1 yıl cache
        }
      });
      return next.handle(cachedReq);
    }
    return next.handle(req);
  }
}
