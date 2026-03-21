import React from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { getSocket } from "../../socket";
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
      <div className="w-full rounded-2xl bg-[#161b22] border border-white/[0.08] text-slate-50 p-4 flex items-center justify-between shadow-xl transition-all duration-300 animate-fade-in">
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger menu - visible only on mobile (max-width: 768px) */}
          <button
            onClick={onMenuClick}
            className="md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 transition-colors duration-150"
            aria-label="Toggle sidebar"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <div className="text-2xl text-blue-400 font-bold tracking-tight flex items-center gap-2 truncate">
            ChatOn
            <Cable className="inline-block text-blue-400 flex-shrink-0" size={24}/>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="text-slate-400 border border-white/[0.08] hover:bg-white/[0.06] hover:text-slate-200 rounded-lg px-3 py-1.5 text-sm transition-colors duration-150"
          >
            Profile
          </Link>
          <Link
            to="/add-friend"
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150"
          >
            Add Friend
          </Link>
          <button
            onClick={handleLogout}
            className="text-slate-400 border border-white/[0.08] hover:bg-white/[0.06] hover:text-slate-200 rounded-lg px-3 py-1.5 text-sm transition-colors duration-150"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
