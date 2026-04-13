import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { MessageSquare, Moon, FileText, Clock, LogOut, Info } from "lucide-react";
import Session from "./pages/Session";
import Dreams from "./pages/Dreams";
import PreNotes from "./pages/PreNotes";
import History from "./pages/History";
import About from "./pages/About";
import Auth from "./pages/Auth";
import { isAuthenticated, clearToken } from "./lib/api";
import "./index.css";

function Nav({ onLogout }) {
  const link = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition ${
      isActive
        ? "text-[var(--fg)] bg-[var(--surface)] border border-[var(--border)]"
        : "text-[var(--muted)] hover:text-[var(--fg)]"
    }`;

  return (
    <nav className="flex gap-2 p-3 border-b border-[var(--border)] items-center">
      <NavLink to="/" className={link} end>
        <MessageSquare size={18} /> Session
      </NavLink>
      <NavLink to="/history" className={link}>
        <Clock size={18} /> History
      </NavLink>
      <NavLink to="/dreams" className={link}>
        <Moon size={18} /> Dreams
      </NavLink>
      <NavLink to="/notes" className={link}>
        <FileText size={18} /> Notes
      </NavLink>
      <NavLink to="/about" className={link}>
        <Info size={18} /> About
      </NavLink>
      <div className="flex-1" />
      <button
        onClick={onLogout}
        className="text-[var(--muted)] hover:text-red-400 transition p-2"
        title="Logout"
      >
        <LogOut size={18} />
      </button>
    </nav>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
  };

  if (!authed) {
    return <Auth onAuth={() => setAuthed(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col max-w-4xl mx-auto">
        <Nav onLogout={handleLogout} />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Session />} />
            <Route path="/history" element={<History />} />
            <Route path="/dreams" element={<Dreams />} />
            <Route path="/notes" element={<PreNotes />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
