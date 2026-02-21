import React from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { getSocket } from "../../../socket";
import { Cable, Menu } from "lucide-react";

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userinfo || {});
  const userId = user.id;
  const handleLogout = async () => {
    try {
    
    let socket = getSocket();
    socket.emit('logout',userId)
     const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )

      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <header className="flex-shrink-0">
      <div className="w-full rounded-2xl backdrop-blur-xl bg-slate-800/40 border border-slate-700/50 text-slate-50 p-4 flex items-center justify-between shadow-xl shadow-black/40 transition-all duration-300 animate-fade-in">
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger menu - visible only on mobile (max-width: 768px) */}
          <button
            onClick={onMenuClick}
            className="md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-slate-100 transition-all duration-300"
            aria-label="Toggle sidebar"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2 truncate">
            ChatOn
            <Cable className="inline-block text-cyan-400 flex-shrink-0" size={24}/>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="px-4 py-2 rounded-xl backdrop-blur-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-medium text-slate-300 transition-all duration-300 hover:scale-105"
          >
            Profile
          </Link>
          <Link
            to="/add-friend"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Add Friend
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white text-sm font-semibold shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
