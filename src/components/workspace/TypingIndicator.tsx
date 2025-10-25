export const TypingIndicator = () => {
  return (
    <div className="flex justify-start w-full">
      <div className="bg-[#F4F2FF] border border-[#D6D1FF] rounded-xl px-4 py-3 shadow-sm">
        <div className="flex space-x-1">
          <div 
            className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" 
            style={{ animationDelay: '0ms', animationDuration: '1s' }} 
          />
          <div 
            className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" 
            style={{ animationDelay: '150ms', animationDuration: '1s' }} 
          />
          <div 
            className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" 
            style={{ animationDelay: '300ms', animationDuration: '1s' }} 
          />
        </div>
      </div>
    </div>
  );
};
