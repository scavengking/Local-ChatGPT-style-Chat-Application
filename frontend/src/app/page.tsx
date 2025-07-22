'use client';

import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import { useState, useEffect } from "react";


export interface Chat {
  id: number;
  title: string;
  created_at: string;
}

export default function Home() {
  
  const [chats, setChats] = useState<Chat[]>([]);
  
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/chats');
        const data = await response.json();
        setChats(data);
      } catch (error) {
        console.error("Failed to fetch chats:", error);
      }
    };
    fetchChats();
  }, []); 

  
  const activeChat = chats.find(chat => chat.id === activeChatId);

  
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

  
  const handleDeleteChat = async (chatIdToDelete: number) => {
    try {
      await fetch(`http://localhost:3001/api/chat/${chatIdToDelete}`, {
        method: 'DELETE',
      });
      
    
      setChats(prev => prev.filter(c => c.id !== chatIdToDelete));

      
      if (activeChatId === chatIdToDelete) {
        setActiveChatId(null);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

 
  const handleRenameChat = async (chatIdToRename: number, newTitle: string) => {
    try {
      await fetch(`http://localhost:3001/api/chat/${chatIdToRename}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      
      setChats(prev => prev.map(c => c.id === chatIdToRename ? { ...c, title: newTitle } : c));
    } catch (error) {
      console.error("Failed to rename chat:", error);
    }
  };

  return (
    <main className="flex h-screen bg-gray-900">
      <Sidebar 
        chats={chats}
        setActiveChatId={setActiveChatId}
        handleDeleteChat={handleDeleteChat}
        handleRenameChat={handleRenameChat}
        handleNewChat={handleNewChat} 
      />
      <ChatArea 
        activeChat={activeChat}
        setChats={setChats}
      />
    </main>
  );
}