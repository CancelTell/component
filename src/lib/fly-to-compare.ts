'use client';

/**
 * "Throw into comparison" effect: a copy of the product picture flies along an arc
 * from the clicked button to the comparison button in the header (or the bottom bar).
 */
const COMPARE_TARGETS = ['.compare-bar [data-compare-target]', '.header__compare[data-compare-target]', '.header__menu-btn'];
const CART_TARGETS = ['[data-cart-target]', '.header__menu-btn'];

function visibleTarget(targets: string[]): HTMLElement | null {
  for (const selector of targets) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && el.getBoundingClientRect().width > 0) return el;
  }
  return null;
}

export function flyToCompare(from: HTMLElement) {
  const source =
    from.closest('.pcard')?.querySelector<HTMLElement>('.pcard__media') ??
    from.closest('.qv')?.querySelector<HTMLElement>('.qv__media') ??
    document.querySelector<HTMLElement>('.model-hero__image');
  fly(from, source, COMPARE_TARGETS);
}

/** A build goes to the cart: the picture of the case (or the button itself) flies to the cart icon */
export function flyToCart(from: HTMLElement, source?: HTMLElement | null) {
  fly(from, source ?? null, CART_TARGETS);
}

function fly(from: HTMLElement, source: HTMLElement | null, targets: string[]) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = visibleTarget(targets);
  if (!target) return;

  const start = (source ?? from).getBoundingClientRect();
  const end = target.getBoundingClientRect();

  const flyer = document.createElement('div');
  flyer.className = 'flyer';
  if (source) {
    const clone = source.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('a, button').forEach((n) => n.remove());
    clone.style.width = `${start.width}px`;
    clone.style.height = `${start.height}px`;
    flyer.appendChild(clone);
  }
  Object.assign(flyer.style, {
    left: `${start.left}px`,
    top: `${start.top}px`,
    width: `${start.width}px`,
    height: `${start.height}px`,
  });
  document.body.appendChild(flyer);

  const dx = end.left + end.width / 2 - (start.left + start.width / 2);
  const dy = end.top + end.height / 2 - (start.top + start.height / 2);
  const finalScale = Math.min(0.18, 40 / start.width);
  const lift = Math.min(160, Math.abs(dy) * 0.5 + 60);

  const animation = flyer.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, filter: 'blur(0px)' },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - lift}px) scale(0.6) rotate(-8deg)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${dx}px, ${dy}px) scale(${finalScale}) rotate(10deg)`, opacity: 0.2, filter: 'blur(2px)' },
    ],
    { duration: 820, easing: 'cubic-bezier(0.55, 0, 0.25, 1)' },
  );
  animation.onfinish = () => {
    flyer.remove();
    target.classList.remove('is-catch');
    void target.offsetWidth; // restart the catch animation
    target.classList.add('is-catch');
    window.setTimeout(() => target.classList.remove('is-catch'), 600);
  };
}
