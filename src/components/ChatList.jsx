import { useContext, useState, useMemo } from "react";
import ChatContext from "../context/ChatContext";
import "./ChatList.css";

export default function ChatList({ onChatClick }) {
  const { chats, activeChat } = useContext(ChatContext);

  const [visibleCount, setVisibleCount] = useState(10);
  const isShowingAll = visibleCount >= chats.length;

  const handleToggle = () => {
    setVisibleCount(isShowingAll ? 10 : visibleCount + 10);
  };

  const sortedChats = useMemo(() => {
    if (!activeChat) return chats;
    return [
      ...chats.filter(chat => chat.id === activeChat),
      ...chats.filter(chat => chat.id !== activeChat),
    ];
  }, [chats, activeChat]);

  const visibleChats = sortedChats.slice(0, visibleCount);

  return (
    <div className="main-chat-list">
      <h2>Recent Chat List</h2>
      <ul>
        {visibleChats.length > 0 ? (
          visibleChats.map((chat, index) => (
            <li
              key={chat.id}
              onClick={() => {
                onChatClick?.(chat.id);
              }}
              style={{ cursor: "pointer" }}>
              <span className="chat-title">
                {chat.displayId || `Chat ${index + 1}`}
              </span>
            </li>
          ))
        ) : (
          <li>채팅 없음</li>
        )}
      </ul>

      {chats.length > 10 && (
        <button onClick={handleToggle} style={{ marginTop: "1rem" }}>
          {isShowingAll ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}
