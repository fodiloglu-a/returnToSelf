// src/app/modules/blog/blog.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/blog-list/blog-list.component').then(c => c.BlogListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('../components/blog-detail/blog-detail.component').then(c => c.BlogDetailComponent)
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class BlogModule { }
