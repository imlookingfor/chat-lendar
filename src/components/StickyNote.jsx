import { useRef, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useStickyNotes } from "../context/StickyNoteContext";
import "./StickyNote.css";


export default function StickyNote() {
  const { notes, setNotes } = useStickyNotes();
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(null);

  const handleDragStart = (event, id) => {
    draggingRef.current = {
      id,
      offsetX: event.clientX,
      offsetY: event.clientY
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (event) => {
      if (!draggingRef.current) return;

      const { id, offsetX, offsetY } = draggingRef.current;
      const dx = event.clientX - offsetX;
      const dy = event.clientY - offsetY;

      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, x: note.x + dx, y: note.y + dy } : note
        )
      );

      draggingRef.current.offsetX = event.clientX;
      draggingRef.current.offsetY = event.clientY;
    };

    const handleUp = () => {
      draggingRef.current = null;
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [setNotes]);

  const handleTextChange = (id, value) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, text: value } : note))
    );
  };

  const deleteNote = (id) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const addNote = () => {
    setNotes((prev) => [
      ...prev,
      {
        id: uuidv4(),
        text: "",
        x: 200,
        y: 150,
      },
    ]);
  };

  return (
    <div className={`sticky-note-container ${isDragging ? "blur-background" : ""}`}>
      {notes.map((note) => (
        <div
          key={note.id}
          className="sticky-note"
          style={{ left: note.x, top: note.y }}
          onMouseDown={(event) => handleDragStart(event, note.id)}>
          <div className="note-header">
            <button className="delete-note" onClick={() => deleteNote(note.id)}>X</button>
            </div>
          <textarea
            value={note.text}
            onChange={(event) => handleTextChange(note.id, event.target.value)}/>          
        </div>
      ))}

      <button className="add-note" onClick={addNote}>+ 메모 추가</button>
    </div>
  );
}
