import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  type: 'user' | 'assistant' | 'system';
  content: ReactNode;
  delay?: number;
}

export const ChatMessage = ({ type, content, delay = 0 }: ChatMessageProps) => {
  const isAssistant = type === 'assistant' || type === 'system';

  return (
    <div
      className={cn(
        "flex w-full animate-fade-in",
        isAssistant ? "justify-start" : "justify-end"
      )}
      style={{ animationDelay: `${delay * 40}ms` }}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[75%] rounded-xl px-4 py-3 shadow-sm",
          isAssistant
            ? "bg-[#F4F2FF] text-foreground border border-[#D6D1FF]"
            : "bg-white text-foreground border border-border"
        )}
      >
        {typeof content === 'string' ? (
          <p className="text-base leading-relaxed">{content}</p>
        ) : (
          content
        )}
      </div>
    </div>
  );
};
