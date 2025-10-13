import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { MessageDisplay } from '@/components/AICoach/MessageDisplay';
import type {
  ChatMessage,
  ConnectionStatus,
} from '@/hooks/useChatSession';

interface ChatPanelProps {
  status: ConnectionStatus;
  isOnline: boolean;
  messages: ChatMessage[];
  pendingAssistant: string | null;
  lastError: string | null;
  canRetry: boolean;
  onSend: (content: string) => void;
  onReconnect: () => void;
  onRetry: () => void;
  setUserLevel: (level: number) => void;
  setProfile: (profile: string) => void;
  setEffort: (effort: 'minimal' | 'low' | 'medium' | 'high') => void;
  setVerbosity: (verbosity: 'concise' | 'balanced' | 'detailed') => void;
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  idle: 'Connecting…',
  connecting: 'Connecting…',
  reconnecting: 'Reconnecting…',
  ready: 'Connected',
  closed: 'Disconnected',
  offline: 'Offline',
  auth_error: 'Sign in required',
  error: 'Connection issue',
};

const STATUS_CLASS: Record<ConnectionStatus, string> = {
  idle: 'status-indicator status-connecting',
  connecting: 'status-indicator status-connecting',
  reconnecting: 'status-indicator status-connecting',
  ready: 'status-indicator status-ready',
  closed: 'status-indicator',
  offline: 'status-indicator status-offline',
  auth_error: 'status-indicator status-error',
  error: 'status-indicator status-error',
};

export function ChatPanel({
  status,
  isOnline,
  messages,
  pendingAssistant,
  lastError,
  canRetry,
  onSend,
  onReconnect,
  onRetry,
  setUserLevel,
  setProfile,
  setEffort,
  setVerbosity,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const [level, setLevel] = useState(3);
  const [profile, setProfileState] = useState('studyin_fast');
  const [verbosity, setVerbosityState] = useState<'concise' | 'balanced' | 'detailed'>('balanced');
  const [effort, setEffortState] = useState<'minimal' | 'low' | 'medium' | 'high'>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('studyin_effort') : null;
      if (saved === 'minimal' || saved === 'low' || saved === 'medium' || saved === 'high') return saved;
    } catch {}
    return 'low';  // Default to "Fast" for better UX
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // When Learning Mode changes, set Verbosity and Reasoning Speed defaults
  const handleLearningModeChange = (newProfile: string) => {
    setProfileState(newProfile);
    if (newProfile === 'studyin_fast') {
      setVerbosityState('concise');
      setEffortState('minimal');
    } else if (newProfile === 'studyin_study') {
      setVerbosityState('balanced');
      setEffortState('low');
    } else if (newProfile === 'studyin_deep') {
      setVerbosityState('detailed');
      setEffortState('medium');
    }
  };

  useEffect(() => {
    setUserLevel(level);
  }, [level, setUserLevel]);

  useEffect(() => {
    setProfile(profile);
  }, [profile, setProfile]);

  useEffect(() => {
    setVerbosity(verbosity);
  }, [verbosity, setVerbosity]);

  useEffect(() => {
    setEffort(effort);
  }, [effort, setEffort]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingAssistant]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }
    onSend(draft);
    setDraft('');
  };

  const isStreaming = pendingAssistant !== null;
  const disableInput = status !== 'ready';
  const showReconnect = status === 'error' || status === 'closed' || status === 'offline' || status === 'auth_error';
  const reconnectDisabled = status === 'offline' && !isOnline;
  const showRetryButton = Boolean(lastError && canRetry);
  const reconnectLabel = status === 'auth_error' ? 'Sign in again' : 'Reconnect';

  const assistantPreview = useMemo(() => {
    if (!pendingAssistant) {
      return null;
    }
    return (
      <div className="chat-message-block chat-message-assistant">
        <MessageDisplay content={pendingAssistant} role="assistant" />
      </div>
    );
  }, [pendingAssistant]);

  return (
    <div className="chat-panel">
      <div className="chat-status">
        <span className={STATUS_CLASS[status]} />
        <span>{STATUS_LABEL[status]}</span>
        {status === 'reconnecting' && <span className="status-pill status-pill-warn">Attempting to reconnect…</span>}
        {!isOnline && <span className="status-pill status-pill-offline">Offline</span>}
        <div className="chat-status-controls">
          <div className="chat-control-group">
            <label htmlFor="student-level" className="chat-level-label">
              Level {level}
            </label>
            <input
              id="student-level"
              type="range"
              min="1"
              max="5"
              value={level}
              onChange={(event) => setLevel(Number(event.target.value))}
            />
          </div>

          <div className="chat-control-group">
            <label htmlFor="ai-profile" className="chat-level-label" title="Preset combinations of verbosity and reasoning">
              Learning Mode
            </label>
            <select
              id="ai-profile"
              value={profile}
              onChange={(event) => handleLearningModeChange(event.target.value)}
              className="chat-select"
              title="Sets defaults for Verbosity and Reasoning Speed"
            >
              <option value="studyin_fast">Fast</option>
              <option value="studyin_study">Study</option>
              <option value="studyin_deep">Deep</option>
            </select>
          </div>

          <div className="chat-control-group">
            <label htmlFor="verbosity" className="chat-level-label" title="Controls response length">
              Verbosity
            </label>
            <select
              id="verbosity"
              value={verbosity}
              onChange={(e) => setVerbosityState(e.target.value as 'concise' | 'balanced' | 'detailed')}
              className="chat-select"
              title="Concise: Brief • Balanced: Moderate • Detailed: Comprehensive"
            >
              <option value="concise">Concise</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>

          <div className="chat-control-group">
            <label htmlFor="reasoning-effort" className="chat-level-label" title="Controls response speed (higher = slower but more thorough)">
              Reasoning Speed
            </label>
            <select
              id="reasoning-effort"
              value={effort}
              onChange={(e) => setEffortState(e.target.value as 'minimal' | 'low' | 'medium' | 'high')}
              className="chat-select"
              title="Lower = faster responses • Higher = more deliberate thinking"
            >
              <option value="minimal">Minimal</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {showReconnect && (
            <button
              type="button"
              className="chat-reconnect-btn"
              onClick={onReconnect}
              disabled={reconnectDisabled}
            >
              {reconnectLabel}
            </button>
          )}
        </div>
      </div>

      {lastError && (
        <div className="chat-error-banner">
          <span>{lastError}</span>
          {showRetryButton && (
            <button type="button" className="chat-error-retry" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}

      {isStreaming && (
        <div className="typing-indicator" role="status" aria-live="polite">
          <span>AI is typing</span>
          <span className="typing-ellipsis" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((message) => {
          const messageStatus = message.status ?? 'sent';
          return (
            <div
              key={message.id}
              className={`chat-message-block ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
            >
              <MessageDisplay content={message.content} role={message.role} />
              {message.role === 'user' && (
                <span
                  className={`message-meta ${
                    messageStatus === 'sent'
                      ? 'message-meta-success'
                      : messageStatus === 'sending'
                      ? 'message-meta-pending'
                      : 'message-meta-queued'
                  }`}
                >
                  {messageStatus === 'sent' ? '✓ Sent' : messageStatus === 'sending' ? 'Sending…' : 'Queued'}
                </span>
              )}
            </div>
          );
        })}
        {assistantPreview}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <textarea
          placeholder="Ask about your uploaded materials…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={disableInput}
        />
        <button type="submit" disabled={!draft.trim() || disableInput}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatPanel;
