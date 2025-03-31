import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { OPENAI_API_KEY } from "./env";
import ChatContext from "./context/ChatContext";
import Calendar from "./components/Calendar";
import ChatList from "./components/ChatList";
import StickyNote from "./components/StickyNote";
import "./Main.css";


export default function Main () {
  
  const { chats, setChats, setActiveChat } = useContext(ChatContext);
  const navigate = useNavigate();
  const [quickInput, setQuickInput] = useState("");

  const handleGoToChat = (chatId) => {
    setActiveChat(chatId);
    navigate("/chat"); 
  };

  // Quick Chat Enter로 채팅 생성
  const handleQuickInputKeyDown = async (e) => {
    if (e.key === "Enter" && quickInput.trim()) {
      const date = new Date();

      const newChat = {
        id: uuidv4(),
        displayId: `Chat ${date.toLocaleDateString("ko-KR")} ${date.toLocaleTimeString()}`,
        createdAt: date.toISOString(),
        messages: [{
          id: uuidv4(),
          type: "prompt",
          text: quickInput,
          timestamp: date.toLocaleTimeString(),
        }],
      };
  
      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      setActiveChat(newChat.id);
      setQuickInput("");

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "당신은 유저 친화적인 assistant AI입니다.",
              },
              { role: "user", content: quickInput },
            ],
            temperature: 0.5,
            top_p: 0.5,
            frequency_penalty: 0.2,
            presence_penalty: 0.1,
            max_tokens: 1024,
          }),
        });
  
        const data = await response.json();
        const chatResponse = data.choices?.[0]?.message?.content?.trim() ?? "응답을 받을 수 없습니다.";
  
        const aiMessage = {
          id: uuidv4(),
          type: "response",
          text: chatResponse,
          timestamp: new Date().toLocaleTimeString(),
        };
  
        const updatedWithResponse = updatedChats.map((chat) =>
          chat.id === newChat.id
            ? { ...chat, messages: [...chat.messages, aiMessage] }
            : chat
        );
  
        setChats(updatedWithResponse);

        navigate("/chat");

      } catch (err) {
        console.error("응답 요청 실패:", err);
      }
    }
  };  

  return (
    <div className="main-container">

      {/* <ChatList /> */}
      <div className="chatlist-area">
        <ChatList onChatClick={handleGoToChat} />
      </div>

      {/* <Calendar /> */}
      <div className="calendar-area">
        <Calendar onChatClick={handleGoToChat} />
      </div>

      {/* Quick Chat */}
      <div className="direct-msg-area">
        <input className="direct-msg-input" 
               type="text" 
               placeholder="메시지를 입력 후 Enter"
               value={quickInput}
               onChange={(e) => setQuickInput(e.target.value)}
               onKeyDown={handleQuickInputKeyDown} />
      </div>

      <div className="go-chat-area">
        <Link to="/chat">
          <button className="go-chat-app">💬</button>
        </Link>
      </div>

      <StickyNote />
    </div>
  );
}
