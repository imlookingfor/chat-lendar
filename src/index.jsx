import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "./context/ChatContext.jsx";
import { StickyNoteProvider } from "./context/StickyNoteContext.jsx";
import App from "./App.jsx";
import Main from "./Main.jsx";
import NotFound from "./NotFound.jsx";
import "./index.css";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChatProvider>
    <StickyNoteProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="chat" element={<App />} />
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </StickyNoteProvider>
    </ChatProvider>
  </StrictMode>
)
