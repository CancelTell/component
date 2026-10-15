import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { navigate } from './router';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean };

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch: _p, onClick, ...rest }, ref) {
  return (
    <a
      ref={ref}
      href={`#${href}`}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        const [path, anchor] = href.split('#');
        navigate(path || '/');
        if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
      }}
      {...rest}
    />
  );
});
export default Link;
