import { Component } from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-web-info',
  imports: [
    TranslatePipe
  ],
  templateUrl: './web-info.component.html',
  styleUrl: './web-info.component.css'
})
export class WebInfoComponent {

}
