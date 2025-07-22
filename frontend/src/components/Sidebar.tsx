'use client';

import React, { useState, useEffect } from 'react';
import type { Chat } from '../app/page';

interface SidebarProps {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  setActiveChatId: (id: number) => void;
  handleDeleteChat: (id: number) => void;
  handleRenameChat: (id: number, newTitle: string) => void;
}

export default function Sidebar({ chats, setChats, setActiveChatId, handleDeleteChat, handleRenameChat }: SidebarProps) {
  const [renamingChatId, setRenamingChatId] = useState<number | null>(null);
  const [renameText, setRenameText] = useState('');

  const handleNewChat = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
      });
      const newChat = await response.json();
      setChats(prevChats => [newChat, ...prevChats]);
      setActiveChatId(newChat.id);
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

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
    if (e.key === 'Enter') {
      submitRename(chatId);
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white w-64 p-4">
      <button 
        onClick={handleNewChat}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
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
                  <div className="flex items-center opacity-0 group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); startRename(chat);}} className="text-gray-400 hover:text-white mr-2">&#x270E;</button> {/* Pencil emoji */}
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }} className="text-gray-400 hover:text-white">&#x1f5d1;</button> {/* Wastebasket emoji */}
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