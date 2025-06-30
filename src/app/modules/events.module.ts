// src/app/modules/events/events.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/event-list/event-list.component').then(c => c.EventListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('../components/event-detail/event-detail.component').then(c => c.EventDetailComponent)
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class EventsModule { }
