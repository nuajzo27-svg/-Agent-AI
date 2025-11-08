import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon } from './icons/SendIcon';

interface ChatModalProps {
  ideaName: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

export const ChatModal: React.FC<ChatModalProps> = ({ ideaName, messages, onSendMessage, onClose, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">
            مناقشة: <span className="bg-gradient-to-r from-sky-400 to-indigo-400 text-transparent bg-clip-text">{ideaName}</span>
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-700 rounded-full text-2xl leading-none">&times;</button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-xl bg-slate-700 text-slate-200 rounded-bl-none flex items-center gap-2">
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} className="p-4 border-t border-slate-700 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-sky-600 text-white rounded-lg disabled:opacity-50 hover:bg-sky-700 transition">
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
