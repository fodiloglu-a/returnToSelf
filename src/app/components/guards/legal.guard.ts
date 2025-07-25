import { CanActivateFn } from '@angular/router';

export const legalGuard: CanActivateFn = (route, state) => {
  return true;
};
