import { Component, OnInit } from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-event-filter',
  templateUrl: './event-filter.component.html',
  imports: [
    TranslatePipe
  ],
  styleUrls: ['./event-filter.component.css']
})
export class EventFilterComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
