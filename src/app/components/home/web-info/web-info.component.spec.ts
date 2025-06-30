import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebInfoComponent } from './web-info.component';

describe('WebInfoComponent', () => {
  let component: WebInfoComponent;
  let fixture: ComponentFixture<WebInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
