import { useReveal } from '../../hooks/useReveal.js';
import './Reveal.css';

// variant="up"   fades and rises slightly (default)
// variant="line" slides text up out of a mask (for big headings)
export default function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className = '', children, ...rest }) {
  const [ref, shown] = useReveal();
  const cls = `reveal reveal--${variant}${shown ? ' is-in' : ''} ${className}`;

  return (
    <Tag ref={ref} className={cls} style={{ '--d': `${delay}ms` }} {...rest}>
      {variant === 'line' ? <span className="reveal__inner">{children}</span> : children}
    </Tag>
  );
}