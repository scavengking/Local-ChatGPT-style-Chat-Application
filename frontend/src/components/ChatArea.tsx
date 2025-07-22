'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Chat } from '../app/page';

// 1. Updated Message interface with status
interface Message {
  id: number | string;
  role: 'user' | 'bot';
  content: string;
  status?: 'sending' | 'success' | 'failed';
}

interface ChatAreaProps {
  activeChat: Chat | undefined;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
}

export default function ChatArea({ activeChat, setChats }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/chat/${activeChat.id}`);
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([]);
      }
    };
    fetchMessages();
  }, [activeChat]);

  const handleStopGeneration = useCallback(async () => {
    if (!activeChat) return;
    try {
      await fetch(`http://localhost:3001/api/chat/${activeChat.id}/stop`, { method: 'POST' });
    } catch (error) {
      console.error("Failed to send stop request:", error);
    }
    setIsGenerating(false);
  }, [activeChat]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGenerating) {
        handleStopGeneration();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGenerating, handleStopGeneration]);

  // 2. Core logic is refactored into this reusable function
  const processStream = async (prompt: string, userMessageId: string | number) => {
    setIsGenerating(true);
    let botMessageId: string | number | null = null;

    try {
      const response = await fetch(`http://localhost:3001/api/chat/${activeChat!.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: prompt }),
      });

      if (!response.ok) throw new Error('Failed to get response from server.');
      if (!response.body) throw new Error('Response body is empty.');

      botMessageId = `bot-${Date.now()}`;
      setMessages(prev => [...prev, { id: botMessageId!, role: 'bot', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          if (part.trim() === '') continue;
          const parsed = JSON.parse(part);
          if (parsed.response) {
            setMessages(prev => prev.map(msg => 
              msg.id === botMessageId ? { ...msg, content: msg.content + parsed.response } : msg
            ));
          }
        }
      }
      // Mark user message as success
      setMessages(prev => prev.map(msg => msg.id === userMessageId ? { ...msg, status: 'success' } : msg));

    } catch (error) {
      console.error("Stream processing failed:", error);
      // Mark user message as failed
      setMessages(prev => prev.map(msg => msg.id === userMessageId ? { ...msg, status: 'failed' } : msg));
      // Remove the empty bot message container if it was created
      if (botMessageId) {
        setMessages(prev => prev.filter(msg => msg.id !== botMessageId));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !activeChat || isGenerating) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage: Message = { id: userMessageId, role: 'user', content: userInput, status: 'sending' };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    if (activeChat.title === 'New Chat') {
      const newTitle = userInput.substring(0, 50);
      try {
        await fetch(`http://localhost:3001/api/chat/${activeChat.id}/title`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        });
        setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, title: newTitle } : c));
      } catch (error) {
        console.error("Failed to update chat title:", error);
      }
    }

    await processStream(userInput, userMessageId);
  };

  // 3. New function to handle retrying a message
  const handleRetry = async (failedMessage: Message) => {
    // Remove the failed message before retrying
    setMessages(prev => prev.filter(msg => msg.id !== failedMessage.id));
    
    const newId = `user-${Date.now()}`;
    const retriedMessage: Message = { ...failedMessage, id: newId, status: 'sending' };
    
    setMessages(prev => [...prev, retriedMessage]);
    
    await processStream(failedMessage.content, newId);
  };

  return (
    <div className="flex flex-col h-screen flex-grow bg-gray-700 text-white">
      <div className="flex-grow p-6 overflow-y-auto">
        {messages.map(message => (
          <div key={message.id}>
            <div className="mb-4 whitespace-pre-wrap">
              <p className="font-bold capitalize">{message.role}:</p>
              <p>{message.content}</p>
            </div>
            {/* 4. UI for failed messages */}
            {message.status === 'failed' && (
              <div className="text-red-400 text-sm ml-8 -mt-2 mb-4 flex items-center">
                <span>Message failed to send.</span>
                <button onClick={() => handleRetry(message)} className="ml-2 underline">
                  Retry
                </button>
              </div>
            )}
          </div>
        ))}
        {isGenerating && (
          <div className="mb-4 whitespace-pre-wrap">
            <p className="font-bold capitalize">Bot:</p>
            <p className="animate-pulse">Typing...</p>
          </div>
        )}
      </div>
      <div className="p-4 bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            placeholder="Type your message..."
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            className="flex-grow bg-gray-600 rounded-full py-2 px-4 focus:outline-none text-white"
            disabled={isGenerating}
          />
          {isGenerating ? (
            <button 
              type="button" 
              onClick={handleStopGeneration}
              className="ml-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full"
            >
              Stop
            </button>
          ) : (
            <button 
              type="submit" 
              className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
            >
              Send
            </button>
          )}
        </form>
      </div>
    </div>
  );
}