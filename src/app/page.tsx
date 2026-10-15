import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Hero } from '@/components/home/Hero';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { Features } from '@/components/home/Features';

export default function HomePage() {
  return (
    <div className="container home-bottom">
      <Hero />

      <section className="section" aria-labelledby="categories-title">
        <div className="section__head">
          <h2 id="categories-title" className="title-2">
            Категории
          </h2>
          <Link href="/catalog" className="section__more">
            Все категории
            <span className="section__more-icon" aria-hidden="true">
              <ChevronRight size={22} strokeWidth={2.25} />
            </span>
          </Link>
        </div>
        <CategoryGrid />
      </section>

      <section className="section" aria-labelledby="features-title">
        <div className="section__head">
          <h2 id="features-title" className="title-2">
            Что можно сделать
          </h2>
        </div>
        <Features />
      </section>
    </div>
  );
}
