// Minimal hash router used only by the static preview build (not part of the Next.js app)
type Listener = () => void;
const listeners = new Set<Listener>();

// The route lives in memory; the URL hash mirrors it when the host frame allows history changes.
let route = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : '/';
let version = 0;

export function currentUrl(): URL {
  return new URL(route, 'http://preview.local');
}
export function routeVersion() {
  return `${version}:${route}`;
}

function mirror(path: string, replace: boolean) {
  try {
    if (replace) nativeReplace(null, '', `#${path}`);
    else window.history.pushState(null, '', `#${path}`);
  } catch {
    // sandboxed frame — keep the in-memory route only
  }
}

export function navigate(href: string, replace = false) {
  route = href.replace(/^#/, '') || '/';
  version++;
  mirror(route, replace);
  listeners.forEach((l) => l());
  window.scrollTo({ top: 0 });
}

export function subscribe(l: Listener) {
  listeners.add(l);
  const onPop = () => {
    if (window.location.hash.startsWith('#/') && window.location.hash.slice(1) !== route) {
      route = window.location.hash.slice(1);
      version++;
    }
    l();
  };
  window.addEventListener('popstate', onPop);
  window.addEventListener('hashchange', onPop);
  return () => {
    listeners.delete(l);
    window.removeEventListener('popstate', onPop);
    window.removeEventListener('hashchange', onPop);
  };
}

// Pages call history.replaceState with "?query" or a pathname — keep it inside the in-memory route
const nativeReplace = window.history.replaceState.bind(window.history);
window.history.replaceState = (data: unknown, unused: string, url?: string | URL | null) => {
  if (typeof url === 'string' && !url.startsWith('#')) {
    const u = currentUrl();
    route = url.startsWith('?') ? `${u.pathname}${url}` : u.pathname;
    try {
      return nativeReplace(data, unused, `#${route}`);
    } catch {
      return;
    }
  }
  try {
    return nativeReplace(data, unused, url);
  } catch {
    return;
  }
};

// Plain GET forms (search) → hash navigation
document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement;
  const action = form.getAttribute('action');
  if (!action || !action.startsWith('/')) return;
  e.preventDefault();
  const qs = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
  navigate(`${action}${qs ? `?${qs}` : ''}`);
});
