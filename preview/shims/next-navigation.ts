import { useSyncExternalStore } from 'react';
import { currentUrl, navigate, routeVersion, subscribe } from './router';

const useHref = () => useSyncExternalStore(subscribe, routeVersion);

export function usePathname() {
  useHref();
  return currentUrl().pathname;
}
export function useSearchParams() {
  useHref();
  return currentUrl().searchParams;
}
export function useRouter() {
  return { push: (h: string) => navigate(h), replace: (h: string) => navigate(h, true), back: () => history.back() };
}
export class NotFoundError extends Error {}
export function notFound(): never {
  throw new NotFoundError('not found');
}
