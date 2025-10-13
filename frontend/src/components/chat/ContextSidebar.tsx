import type { ContextChunk } from '@/hooks/useChatSession';

interface ContextSidebarProps {
  chunks: ContextChunk[];
}

export function ContextSidebar({ chunks }: ContextSidebarProps) {
  if (!chunks.length) {
    return (
      <aside className="context-panel">
        <h3>Relevant Passages</h3>
        <p>No passages retrieved yet. Ask a question to see highlights.</p>
      </aside>
    );
  }

  return (
    <aside className="context-panel">
      <h3>Relevant Passages</h3>
      {chunks.map((chunk, index) => (
        <div className="context-item" key={chunk.id ?? `${index}-${chunk.filename}`}>
          <h4>
            <span className="citation-badge">[{index + 1}]</span>{' '}
            {chunk.filename}{' '}
            <span style={{ fontWeight: 400, fontSize: '0.8rem', color: '#64748b' }}>• Section {chunk.chunk_index + 1}</span>
          </h4>
          <p>{chunk.content}</p>
        </div>
      ))}
    </aside>
  );
}

export default ContextSidebar;
