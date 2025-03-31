import { useState, useContext, useMemo, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatContext from "../context/ChatContext";
import "./Calendar.css";


const Calendar = ({ onChatClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [popupInfo, setPopupInfo] = useState(null); // { top, left, dateKey }
  const containerRef = useRef(null);
  const { chats, setChats, setActiveChat } = useContext(ChatContext);
  
  const today = new Date();

  const chatMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(chats)) return map;
    chats.forEach((chat) => {
      if (!chat.createdAt) return;
      const dateKey = new Date(chat.createdAt).toDateString();
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(chat);
    });
    return map;
  }, [chats]);

  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDayClick = (event, dateKey) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    const offsetTop = rect.top - containerRect.top;
    const offsetLeft = rect.right - containerRect.left + 10;

    setPopupInfo({
      dateKey,
      top: offsetTop,
      left: offsetLeft,
    });
  };

  useEffect(() => {
    const closePopup = () => setPopupInfo(null);

    document.addEventListener("click", closePopup);
    return () => document.removeEventListener("click", closePopup);
  }, []);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const handleAddChat = (dateObj) => {
    const newChat = {
      id: uuidv4(),
      displayId: `Chat ${dateObj.toLocaleDateString("ko-KR")}`,
      createdAt: dateObj.toISOString(),
      messages: [],
    };
  
    setChats([...chats, newChat]);
    setActiveChat(newChat.id);
  };

  return (
    <div className="calendar-container" ref={containerRef}>
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-button">&lt;</button>
        <h3 className="month-title">
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </h3>
        <button onClick={nextMonth} className="nav-button">&gt;</button>
        <button onClick={() => setCurrentDate(new Date())} className="today-button">Today</button>
      </div>

      <div className="calendar-grid">
        {daysOfWeek.map((day) => (
          <div key={day} className="day-header">{day}</div>
        ))}

        {Array(firstDay).fill(null).map((_, index) => (
          <div key={`empty-${index}`} className="empty-cell" />
        ))}

        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dateKey = dateObj.toDateString();
          const chatsOnThisDay = chatMap[dateKey] || [];

          const isToday =
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();

          return (
            <div
              key={day}
              className={`day-cell ${isToday ? "today" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleDayClick(e, dateKey);
              }}
            >
              <div className="date-number">{day}
              <button
                className="add-chat-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddChat(dateObj);
                }}
              >
                ＋
              </button>
              </div>

              <div className="chat-preview-container">
                {chatsOnThisDay.slice(0, 4).map((chat) => (
                  <div key={chat.id} className="chat-label">{chat.displayId}</div>
                ))}
                {chatsOnThisDay.length > 4 && (
                  <div className="more-indicator">+{chatsOnThisDay.length - 4} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 채팅 목록 팝업 */}
      {popupInfo && (
        <div
          className="chat-full-list"
          style={{
            top: `${popupInfo.top}px`,
            left: `${popupInfo.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(chatMap[popupInfo.dateKey] || []).map((chat) => (
            <div
              key={chat.id}
              className="chat-label full"
              onClick={(e) => {
                e.stopPropagation();
                setActiveChat(chat.id);
                setTimeout(() => {
                  onChatClick?.(chat.id);
                }, 0);
              }}
            >
              {chat.displayId}
            </div>

          ))}
        </div>
      )}
    </div>
  );
};

export default Calendar;
