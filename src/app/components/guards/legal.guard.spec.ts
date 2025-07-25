import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { legalGuard } from './legal.guard';

describe('legalGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => legalGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
