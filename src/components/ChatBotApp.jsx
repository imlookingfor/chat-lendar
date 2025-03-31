import { v4 as uuidv4 } from "uuid";
import { useState, useEffect, useContext, useRef } from "react";
import { OPENAI_API_KEY, OPENWEATHER_API_KEY } from "../env";
import ReactMarkdown from "react-markdown";
import ChatContext from "../context/ChatContext";
import GoogleMapComponent from "./GoogleMap";
import "./ChatBotApp.css";


export default function ChatBotApp({ onGoBack, onNewChat }) {
  const { chats, setChats, activeChat, setActiveChat } = useContext(ChatContext);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedDisplayId, setEditedDisplayId] = useState("");
  const [editingDateId, setEditingDateId] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null); // 드롭다운 메뉴
  const [isLoading, setIsLoading] = useState(false);  // 응답 생성 중 표시
  const msgAreaRef = useRef(null);

  // 활성 채팅방 메시지 로딩
  useEffect(() => {
    const activeChatObj = chats.find((chat) => chat.id === activeChat);
    setMessages(activeChatObj ? activeChatObj.messages : []);
  }, [activeChat, chats]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // 메시지 입력이나 응답 생성 시 스크롤 다운
  useEffect(() => {
    if (msgAreaRef.current) {
      msgAreaRef.current.scrollTop = msgAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputValue = (event) => setInputValue(event.target.value);

  const startEditing = (chatId, currentDisplayId) => {
    setEditingId(chatId);
    setEditedDisplayId(currentDisplayId);
  };

  const saveEditedDisplayId = (chatId) => {
    const updatedChats = chats.map((chat) =>
      chat.id === chatId ? { ...chat, displayId: editedDisplayId } : chat
    );
    setChats(updatedChats);
    setEditingId(null);
    setEditedDisplayId("");
  };

  const deleteChat = (chatId) => {
    const filteredChats = chats.filter((chat) => chat.id !== chatId);
    setChats(filteredChats);

    if (activeChat === chatId) {
      setActiveChat(filteredChats.length > 0 ? filteredChats[0].id : null);
    }
  };

  // 1. 지역명으로 날씨 호출 -> 한국어 미지원으로 영어 맵핑 필요
  // const getWeatherInfo = async (location = "서울") => {
  //   const cityNameMap = {
  //     "서울": "Seoul",
  //     "부산": "Busan",
  //     "인천": "Incheon",
  //     "대구": "Daegu",
  //     "대전": "Daejeon",
  //     "광주": "Gwangju",
  //     "울산": "Ulsan",
  //     "제주": "Jeju",
  //     "수원": "Suwon",
  //     "청주": "Cheongju",
  //     "전주": "Jeonju",
  //   };
  
  //   const cleaned = location.trim();
  //   const engLocation = cityNameMap[cleaned] || cleaned;

  //   const apiKey = OPENWEATHER_API_KEY;
  //   const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(engLocation)}&units=metric&appid=${apiKey}&lang=ko`;

  //   try {
  //     const res = await fetch(url);
  //     const data = await res.json();
  //     if (data.cod !== 200) throw new Error(data.message);

  //     const desc = data.weather[0].description;
  //     const temp = data.main.temp;
  //     return `${location}의 현재 날씨는 '${desc}', 기온은 ${temp}°C입니다.`;
  //   } catch (err) {
  //     return `${location}의 날씨 정보를 가져오지 못했습니다.`;
  //   }
  // };

  // 2. 위도 경도로 변환하여 날씨 호출
  const getWeatherInfo = async (locationInput) => {
    const apiKey = OPENWEATHER_API_KEY;
    console.log("openweatherkey: ", OPENWEATHER_API_KEY)
  
    // 도시 이름 → 위도/경도 변환
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationInput)}&limit=1&appid=${apiKey}`;
    try {
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
  
      if (!geoData || geoData.length === 0) {
        throw new Error("해당 지역을 찾을 수 없습니다.");
      }
  
      const { lat, lon, name } = geoData[0];
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=kr`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();
  
      if (weatherData.cod !== 200) throw new Error(weatherData.message);
  
      const desc = weatherData.weather[0].description;
      const temp = weatherData.main.temp;
      return `${name}의 현재 날씨는 '${desc}', 기온은 ${temp}°C입니다.`;
    } catch (err) {
      return `날씨 정보를 가져오는 중 오류가 발생했습니다: ${err.message}`;
    }
  };

  const sendMessage = async () => {
    if (chats.length === 0) return handleNewChat();
    if (inputValue.trim() === "") return;

    const newMessage = {
      id: uuidv4(),
      type: "prompt",
      text: inputValue,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputValue("");

    const updatedChats = chats.map((chat) =>
      chat.id === activeChat ? { ...chat, messages: updatedMessages } : chat
    );
    setChats(updatedChats);

    setIsLoading(true);

    let weatherMessage = null;
    if (inputValue.includes("날씨")) {
      const match = inputValue.match(/([가-힣a-zA-Z\s]+)\s*날씨/);
      let location = match?.[1]?.trim() || "서울";
      location = location.replace(/현재|지금|오늘/gi, "").trim();

      const weather = await getWeatherInfo(location);

      weatherMessage = {
        role: "system",
        content: `[실시간 날씨 정보] ${weather}`,
      };
    }

    const contextMessages = updatedChats.find(chat => chat.id === activeChat)?.messages || [];

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
              "role": "system",
              "content": "당신은 유저 친화적인 assistant AI입니다. 친절하고 자연스러운 대화를 유지하면서, 사용자의 의도를 파악하여 유용하고 정확한 정보를 제공합니다. 장소에 대한 요청이 오면 지도도 함께 제공할 수 있습니다. 사용자가 특정 장소의 위치를 요청할 경우, '@map(위도,경도)' 형식을 응답 끝에 포함하세요. 논리적인 흐름을 유지하며, 전문적인 질문에는 심층적인 답변을, 일상적인 대화에는 인간적인 반응을 보이도록 설정되어 있습니다."
            },
            ...(weatherMessage ? [weatherMessage] : []),
            ...contextMessages.map(chat => ({
                role: chat.type === "response" ? "assistant" : "user",
                content: chat.text
            })),
            { role: "user", content: inputValue }   
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

      // 지도
      let mapLocation = null;
      const match = chatResponse.match(/@map\(([^,]+),\s*([^)]+)\)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        mapLocation = { lat, lng };
      }

      const newResponse = {
        id: uuidv4(),
        type: "response",
        text: chatResponse.replace(/@map\(.*?\)/, ""),
        mapLocation,
        timestamp: new Date().toLocaleTimeString(),
      };

      const finalMessages = [...updatedMessages, newResponse];
      setMessages(finalMessages);

      const updatedChatsWithResponse = chats.map((chat) =>
        chat.id === activeChat ? { ...chat, messages: finalMessages } : chat
      );
      setChats(updatedChatsWithResponse);

    } catch (error) {
      console.error("Error fetching AI response:", error);

    } finally {
      setIsLoading(false);
    }   
  };

  const handleNewChat = () => {
    const newChat = onNewChat();
    setActiveChat(newChat.id);
  };

  return (
    <div className="chatbot-wrapper">
    <div className="chat-app">
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>Chat List</h2>
          <button onClick={handleNewChat}>New Chat</button>
        </div>

        <div className="chat-list-scroll">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-list-item ${chat.id === activeChat ? "active" : ""}`}
              onClick={() => {
                if (editingId === chat.id || editingDateId === chat.id) return;
                setActiveChat(chat.id);
              }}>
              {editingId === chat.id ? (
                <>
                  <input
                    type="text"
                    value={editedDisplayId}
                    onChange={(event) => setEditedDisplayId(event.target.value)}
                    onClick={(event) => event.stopPropagation()}/>
                  <button onClick={(event) => {
                    event.stopPropagation();
                    saveEditedDisplayId(chat.id);
                  }}>
                    저장
                  </button>
                </>
              ) : (
                <>
                  <span className="chat-title">{chat.displayId}</span>
                  <button
                    className="menu-toggle-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId(chat.id === openMenuId ? null : chat.id);
                    }}>
                    ⋯
                  </button>

                  {openMenuId === chat.id && (
                    <div className="chat-menu" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => {
                        startEditing(chat.id, chat.displayId);
                        setOpenMenuId(null);
                      }}>이름 변경</button>

                      <button onClick={() => {
                        setEditingDateId(chat.id);
                        setNewDate(chat.createdAt?.slice(0, 10) || "");
                        setOpenMenuId(null);
                      }}>날짜 수정</button>

                      <button onClick={() => {
                        deleteChat(chat.id);
                        setOpenMenuId(null);
                      }}>삭제</button>
                    </div>
                  )}
                </>
              )}

              {editingDateId === chat.id && (
                <div style={{ marginTop: "0.5rem" }}>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(event) => setNewDate(event.target.value)}/>
                  <button
                    onClick={() => {
                      const updatedChats = chats.map((c) =>
                        c.id === chat.id
                          ? { ...c, createdAt: new Date(newDate).toISOString() }
                          : c
                      );
                      setChats(updatedChats);
                      setEditingDateId(null);
                      setNewDate("");
                    }}>
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditingDateId(null);
                      setNewDate("");
                    }}>
                    취소
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-window">
        <div className="chat-title-bar">
          <button className="back-button" onClick={onGoBack}>Home</button>
        </div>

        <div className="msg-area" ref={msgAreaRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={msg.type === "prompt" ? "prompt" : "response"}>
            {msg.type === "response" ? (
              <>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
                {msg.mapLocation && (
                  <div className="google-map">
                    <GoogleMapComponent
                      lat={msg.mapLocation.lat}
                      lng={msg.mapLocation.lng}
                    />
                  </div>
                )}
                <span className="timestamp">{msg.timestamp}</span>
              </>
            ) : (
              <>
                <p>{msg.text}</p>
                <span className="timestamp">{msg.timestamp}</span>
              </>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="response loading-response">
            <em>응답 생성 중...</em>
          </div>
        )}
        </div>

        <form className="msg-box" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            className="msg-input"
            placeholder="무엇이든 물어보세요"
            value={inputValue}
            onChange={handleInputValue}/>
          <button type="submit" onClick={sendMessage}>
            보내기
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}
