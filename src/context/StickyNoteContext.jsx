import { createContext, useContext, useState, useEffect } from "react";

const StickyNoteContext = createContext();
const STORAGE_KEY = "stickyNotesData";

export function StickyNoteProvider({ children }) {
  const [notes, setNotes] = useState([]);

  // 초기 로딩
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  // 저장 동기화
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes]);

  return (
    <StickyNoteContext.Provider value={{ notes, setNotes }}>
      {children}
    </StickyNoteContext.Provider>
  );
}

export function useStickyNotes() {
  return useContext(StickyNoteContext);
}
