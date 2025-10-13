import { ChatPanel } from '@/components/chat/ChatPanel';
import { ContextSidebar } from '@/components/chat/ContextSidebar';
import type { View } from '@/components/NavBar';
import type { ConnectionStatus, ChatMessage, ContextChunk } from '@/hooks/useChatSession';

interface ChatViewProps {
  status: ConnectionStatus;
  isOnline: boolean;
  messages: ChatMessage[];
  pendingAssistant: string | null;
  contextChunks: ContextChunk[];
  lastError: string | null;
  canRetry: boolean;
  sendMessage: (message: string) => void;
  reconnect: () => void;
  retryLastMessage: () => void;
  setUserLevel: (level: number) => void;
  setProfile: (profile: string) => void;
  setEffort: (effort: 'minimal' | 'low' | 'medium' | 'high') => void;
  setVerbosity: (verbosity: 'concise' | 'balanced' | 'detailed') => void;
  onNavigate: (view: View) => void;
}

export function ChatView({
  status,
  isOnline,
  messages,
  pendingAssistant,
  contextChunks,
  lastError,
  canRetry,
  sendMessage,
  reconnect,
  retryLastMessage,
  setUserLevel,
  setProfile,
  setEffort,
  setVerbosity,
}: ChatViewProps) {
  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Learning Coach</h1>
        <p className="text-slate-600">
          Ask questions about your study materials and get personalized explanations
        </p>
      </div>

      <div className="chat-wrapper">
        <ChatPanel
          status={status}
          isOnline={isOnline}
          messages={messages}
          pendingAssistant={pendingAssistant}
          lastError={lastError}
          canRetry={canRetry}
          onSend={sendMessage}
          onReconnect={reconnect}
          onRetry={retryLastMessage}
          setUserLevel={setUserLevel}
          setProfile={setProfile}
          setEffort={setEffort}
          setVerbosity={setVerbosity}
        />
        <ContextSidebar chunks={contextChunks} />
      </div>
    </div>
  );
}
