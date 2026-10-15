// Static preview entry: renders the real app pages client-side with a hash router.
// Used to demo and visually test the design without a Next.js server. Not part of the production app.
import './shims/router';
import { createRoot } from 'react-dom/client';
import { Suspense, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { currentUrl, routeVersion, subscribe } from './shims/router';
import { NotFoundError } from './shims/next-navigation';
import '@/app/globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import HomePage from '@/app/page';
import CatalogIndexPage from '@/app/catalog/page';
import CategoryPage from '@/app/catalog/[category]/page';
import ModelPage from '@/app/catalog/[category]/[slug]/page';
import ComparePage from '@/app/compare/page';
import CompatibilityPage from '@/app/compatibility/page';
import SearchPage from '@/app/search/page';
import AboutPage from '@/app/about/page';
import NotFound from '@/app/not-found';

async function resolve(url: URL): Promise<ReactNode> {
  const parts = url.pathname.split('/').filter(Boolean);
  const sp = Object.fromEntries(url.searchParams.entries());
  try {
    if (parts.length === 0) return <HomePage />;
    if (parts[0] === 'catalog' && parts.length === 1) return <CatalogIndexPage />;
    if (parts[0] === 'catalog' && parts.length === 2) return await CategoryPage({ params: Promise.resolve({ category: parts[1]! }) });
    if (parts[0] === 'catalog' && parts.length === 3)
      return await ModelPage({ params: Promise.resolve({ category: parts[1]!, slug: parts[2]! }) });
    if (parts[0] === 'compare') return <ComparePage />;
    if (parts[0] === 'compatibility') return <CompatibilityPage />;
    if (parts[0] === 'search') return await SearchPage({ searchParams: Promise.resolve(sp) });
    if (parts[0] === 'about') return <AboutPage />;
  } catch (e) {
    if (!(e instanceof NotFoundError)) throw e;
  }
  return <NotFound />;
}

function App() {
  const key = useSyncExternalStore(subscribe, routeVersion);
  const [page, setPage] = useState<ReactNode>(null);
  useEffect(() => {
    let alive = true;
    resolve(currentUrl()).then((node) => alive && setPage(node));
    return () => {
      alive = false;
    };
    // Re-resolve on navigation only (replaceState of filters keeps the same page)
  }, [key.split(':')[0]]);
  return (
    <>
      <a href="#main" className="skip-link">Перейти к содержимому</a>
      <Header />
      <main id="main" className="main">
        <Suspense>{page}</Suspense>
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
