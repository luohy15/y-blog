import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { markdownPathFor } from '@/lib/markdown';

export default function MarkdownAlternateLink() {
  const location = useLocation();

  useEffect(() => {
    const href = markdownPathFor(location.pathname);
    let link = document.head.querySelector('link[rel="alternate"][type="text/markdown"]') as HTMLLinkElement | null;
    const created = !link;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'alternate';
      link.type = 'text/markdown';
      document.head.appendChild(link);
    }
    link.href = href;

    return () => {
      if (created && link && link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [location.pathname]);

  return null;
}
