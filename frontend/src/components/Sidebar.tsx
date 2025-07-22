'use client';

import React, { useState } from 'react';
import type { Chat } from '../app/page';


function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}


interface SidebarProps {
  chats: Chat[];
  setActiveChatId: (id: number) => void;
  handleDeleteChat: (id: number) => void;
  handleRenameChat: (id: number, newTitle: string) => void;
  handleNewChat: () => void; 
}

export default function Sidebar({ chats, setActiveChatId, handleDeleteChat, handleRenameChat, handleNewChat }: SidebarProps) {
  const [renamingChatId, setRenamingChatId] = useState<number | null>(null);
  const [renameText, setRenameText] = useState('');

  const startRename = (chat: Chat) => {
    setRenamingChatId(chat.id);
    setRenameText(chat.title);
  };

  const cancelRename = () => {
    setRenamingChatId(null);
    setRenameText('');
  };

  const submitRename = (chatId: number) => {
    if (renameText.trim()) {
      handleRenameChat(chatId, renameText.trim());
    }
    cancelRename();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, chatId: number) => {
    if (e.key === 'Enter') submitRename(chatId);
    else if (e.key === 'Escape') cancelRename();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white w-64 p-4">
      <button onClick={handleNewChat} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        New Chat
      </button>
      <div className="mt-4 overflow-y-auto">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <ul className="mt-2 space-y-2">
          {chats.map((chat) => (
            <li 
              key={chat.id} 
              className="group flex items-center justify-between p-2 hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => renamingChatId !== chat.id && setActiveChatId(chat.id)}
            >
              {renamingChatId === chat.id ? (
                <input
                  type="text"
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, chat.id)}
                  onBlur={() => submitRename(chat.id)}
                  className="bg-gray-600 text-white w-full focus:outline-none"
                  autoFocus
                />
              ) : (
                <>
                  <span className="truncate">{chat.title}</span>
                  <div className="flex items-center shrink-0 pl-2">
                    
                    <span className="text-xs text-gray-400 group-hover:hidden">
                      {formatRelativeTime(chat.created_at)}
                    </span>
                    <div className="hidden group-hover:flex items-center">
                      <button onClick={(e) => { e.stopPropagation(); startRename(chat); }} className="text-gray-400 hover:text-white mr-2">&#x270E;</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }} className="text-gray-400 hover:text-white">&#x1f5d1;</button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}