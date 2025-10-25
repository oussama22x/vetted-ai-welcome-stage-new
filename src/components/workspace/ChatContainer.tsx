import { ReactNode, useEffect, useRef } from "react";
import { ChatMessage as Message } from "@/hooks/useChatFlow";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
  children: ReactNode;
}

export const ChatContainer = ({ messages, isTyping, children }: ChatContainerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="max-w-[960px] mx-auto px-6 py-8">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <ChatMessage
              key={msg.id}
              type={msg.type}
              content={msg.content}
              delay={index}
            />
          ))}
          
          {isTyping && <TypingIndicator />}
          
          {children}
        </div>
      </div>
    </div>
  );
};
