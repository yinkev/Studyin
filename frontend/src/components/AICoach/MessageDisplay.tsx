import { Children, cloneElement, isValidElement, type HTMLAttributes, type ReactNode } from 'react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MessageDisplayProps {
  content: string;
  role: 'user' | 'assistant';
}

const CITATION_PATTERN = /\[\[(\d+)\]\]/g;

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
  p: ({ children, ...props }) => (
    <p {...props}>
      {enhanceCitations(children)}
    </p>
  ),
  li: ({ children, ...props }) => (
    <li {...props}>{enhanceCitations(children)}</li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote {...props}>{enhanceCitations(children)}</blockquote>
  ),
  strong: ({ children, ...props }) => <strong {...props}>{enhanceCitations(children)}</strong>,
  em: ({ children, ...props }) => <em {...props}>{enhanceCitations(children)}</em>,
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
  code: ({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: ReactNode } & HTMLAttributes<HTMLElement>) => {
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

function enhanceCitations(children: ReactNode, keyPrefix = 'citation'): ReactNode {
  return Children.map(children, (child, index) => {
    const currentKey = `${keyPrefix}-${index}`;
    if (typeof child === 'string' || typeof child === 'number') {
      return renderCitationSegments(String(child), currentKey);
    }

    if (Array.isArray(child)) {
      return child.map((nested, nestedIndex) => enhanceCitations(nested, `${currentKey}-${nestedIndex}`));
    }

    if (isValidElement<{ children?: ReactNode }>(child)) {
      const nestedChildren = child.props?.children;
      if (nestedChildren === undefined || nestedChildren === null) {
        return child;
      }

      return cloneElement(child, {
        children: enhanceCitations(nestedChildren, currentKey),
      });
    }

    return child;
  });
}

function renderCitationSegments(value: string, keyPrefix: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let counter = 0;
  CITATION_PATTERN.lastIndex = 0;

  while ((match = CITATION_PATTERN.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(value.slice(lastIndex, match.index));
    }
    counter += 1;
    nodes.push(
      <span key={`${keyPrefix}-${counter}-${match.index}`} className="citation-badge">
        [{match[1]}]
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    nodes.push(value.slice(lastIndex));
  }

  if (nodes.length === 0) {
    return value;
  }

  return nodes;
}

export function MessageDisplay({ content, role }: MessageDisplayProps) {
  // DOMPurify strips dangerous HTML while preserving text content for ReactMarkdown
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],  // Strip all HTML tags
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['style', 'script'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
    SAFE_FOR_TEMPLATES: true,
    KEEP_CONTENT: true,  // CRITICAL: Preserve text content when stripping tags
  });

  return (
    <div className={role === 'user' ? 'message-user' : 'message-assistant'}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
