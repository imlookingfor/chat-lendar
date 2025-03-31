import { createContext, useState, useEffect } from "react";


// undefined 방지용 기본값 설정
const ChatContext = createContext({
  chats: [],
  setChats: () => {},
  activeChat: null,
  setActiveChat: () => {},
});

export const ChatProvider = ({ children }) => {
  // chats 상태를 localStorage에서 불러오면서 초기화 + createdAt 백필
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("chatList");
    let parsed = saved ? JSON.parse(saved) : [];

    // createdAt 백필 (backfill)
    parsed = parsed.map(chat =>
      chat.createdAt ? chat : { ...chat, createdAt: new Date().toISOString() }
    );

    return parsed;
  });

  const [activeChat, setActiveChat] = useState(null);

  // chats가 바뀔 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("chatList", JSON.stringify(chats));
  }, [chats]);

  return (
    <ChatContext.Provider value={{ chats, setChats, activeChat, setActiveChat }}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
