import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MessageDisplayProps {
  content: string;
  role: 'user' | 'assistant';
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

const isSafeHref = (href?: string): boolean => {
  if (!href) {
    return false;
  }

  if (href.startsWith('#') || href.startsWith('/')) {
    return true;
  }

  try {
    const url = new URL(href, 'https://placeholder.local');
    return SAFE_PROTOCOLS.has(url.protocol);
  } catch (error) {
    return false;
  }
};

const sanitizeClassName = (className?: string): string | undefined => {
  if (!className) {
    return undefined;
  }

  return className
    .split(' ')
    .filter((token) => /^[A-Za-z0-9_:-]+$/.test(token))
    .join(' ');
};

const markdownComponents: Components = {
  a: ({ node, children, href, ...props }) => {
    if (!isSafeHref(href)) {
      return <span className="text-red-500 font-semibold">[unsafe link removed]</span>;
    }

    return (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline"
      >
        {children}
      </a>
    );
  },
  code: ({ inline, className, children, ...props }) => {
    const safeClassName = sanitizeClassName(className ?? undefined);

    return inline ? (
      <code className={`bg-gray-100 px-1 rounded ${safeClassName ?? ''}`} {...props}>
        {children}
      </code>
    ) : (
      <pre className="bg-gray-900 text-white p-4 rounded overflow-x-auto">
        <code className={safeClassName} {...props}>
          {children}
        </code>
      </pre>
    );
  },
};

export function MessageDisplay({ content, role }: MessageDisplayProps) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['style', 'script'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
    SAFE_FOR_TEMPLATES: true,
    KEEP_CONTENT: false,
  });

  return (
    <div className={role === 'user' ? 'message-user' : 'message-assistant'}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
