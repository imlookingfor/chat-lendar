import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import ChatContext from "./context/ChatContext";
import ChatBotApp from "./components/ChatBotApp";

export default function App () {
  const { chats, setChats, activeChat, setActiveChat } = useContext(ChatContext);
  const navigate = useNavigate();

  // 최초 진입 시 첫 채팅방 자동 선택
  useEffect(() => {
    if (chats.length > 0 && !activeChat) {
      setActiveChat(chats[0].id);
    }
  }, [chats, activeChat]);

  // 뒤로 가기
  const handleGoBack = () => {
    navigate(-1);
  };

  const createNewChat = (initalMessage = "") => {
    const date = new Date();

    const messages = initalMessage
      ? [{ type: "prompt", text: initalMessage, timestamp: date.toLocaleTimeString() }]
      : [];

    const newChat = {
      id: uuidv4(),
      displayId: `Chat ${date.toLocaleDateString("ko-KR")} ${date.toLocaleTimeString()}`,
      messages,
      createdAt: date.toISOString(), // 캘린더 노출용 날짜
    };

    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setActiveChat(newChat.id);

    return newChat;
  };

  return (
    <div className="container">
      <ChatBotApp
        onGoBack={handleGoBack}
        onNewChat={createNewChat}
      />
    </div>
  );
}
