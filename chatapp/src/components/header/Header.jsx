import React from "react";
import { Link, useNavigate } from "react-router-dom";


const Header =  () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
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
    <header>
      <div className="w-full rounded-2xl bg-[#1e1f22] text-gray-200 p-4 flex items-center justify-between">
        <div className="text-xl font-semibold">Header</div>
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="px-3 py-1.5 rounded-lg bg-[#2b2d31] border border-gray-700 text-sm hover:bg-[#34363b]"
          >
            Profile
          </Link>
          <Link
            to="/add-friend"
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500"
          >
            Add Friend
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-500"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
