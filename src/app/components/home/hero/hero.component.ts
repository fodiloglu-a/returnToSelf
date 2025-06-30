import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import {Router, NavigationEnd, RouterLink} from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import {TranslatePipe} from '@ngx-translate/core';

declare var particlesJS: any;

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  imports: [
    RouterLink,
    TranslatePipe
  ],
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  private routerSubscription: Subscription | undefined;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Sayfa değişikliklerini izle, sayfaya geri dönüldüğünde partikleri yeniden başlat
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        if ((event as NavigationEnd).url === '/') {

        }
      });
  }

  ngAfterViewInit(): void {

  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

}
