import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { selectUnreadCountForFriend } from '../../store/messagesSlice'
import noFriendsAnimation from '../../animations/No Data Available.json'
import Lottie from 'lottie-react'

// Friend item component to avoid hooks in map
const FriendItem = ({ friend, location, onLinkClick }) => {
  const unreadCount = useSelector((state) => selectUnreadCountForFriend(state, friend.id))
  
  return (
    <li key={friend.id}>
      <Link
        to={{ pathname: `/friends/${friend.id}` }}
        state={{ friend: friend, from: location.pathname }}
        onClick={onLinkClick}
        className="flex items-center gap-3 rounded-lg mx-2 px-3 py-2.5 hover:bg-white/[0.05] transition-colors duration-150 cursor-pointer animate-slide-in group"
      >
        <div className="h-10 w-10 rounded-full bg-[#2d333b] flex items-center justify-center text-sm font-semibold overflow-hidden flex-shrink-0">
          {friend.profilePic ? (
            <img src={friend.profilePic} alt="profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-slate-300">{friend.username ? friend.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-slate-200 text-[14px] font-medium truncate">{friend.username || 'Unknown'}</div>
          <div className="text-slate-500 text-[12px] truncate">{friend.email || ''}</div>
        </div>
        {unreadCount > 0 && (
          <div className="ml-2 min-w-[24px] h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </Link>
    </li>
  )
}

const Sidebar = ({ onLinkClick }) => {
  const location = useLocation()
  const [friends, setFriends] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const user = useSelector((state)=>state.user.userinfo)

  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  
  if (!API_BASE) {
    console.error('VITE_API_BASE_URL is not defined in environment variables');
  }

  useEffect(() => {
    if (!user?.id) return
    let ignore = false
    async function loadFriends() {
      setLoading(true)
      setError('')
      try {
        // Expected response shape: [{ id, username, email,profilePic }]
        const res = await fetch(`${API_BASE}/api/friend/list?userId=${user.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
        if (!res.ok) throw new Error('Failed to load friends')
        const data = await res.json()
        if (!ignore) setFriends(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!ignore) setError('Could not fetch friends')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    loadFriends()
    return () => { ignore = true }
  }, [user?.id, API_BASE])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return friends
    return friends.filter(f =>
      f.username?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q)
    )
  }, [friends, query])

  return (
    <aside className="h-full flex flex-col bg-[#161b22] border-r border-white/[0.08] text-slate-50">
      <div className="border-b border-white/[0.08] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold text-white overflow-hidden flex-shrink-0 cursor-pointer">
            {user.profilePic ? (
              <img src={user.profilePic} alt="profile" className="h-full w-full object-cover" />
            ) : (
              (user.username ? user.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U')
            )}
          </div>
          <div>
            <div className="text-slate-100 font-semibold text-[15px]">{user?.username || 'User'}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 ring-2 ring-[#161b22] animate-pulse-slow"></span>
              online
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="relative bg-[#1c2128] border border-white/[0.08] rounded-full px-3 py-2 flex items-center gap-2 focus-within:border-blue-500/50 transition-colors duration-150">
            <input
              type="text"
              placeholder="Search friends..."
              className="bg-transparent text-slate-200 text-sm placeholder:text-slate-500 outline-none w-full pl-7"
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors duration-300 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Friends list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#1c2128] border-t-blue-400"></div>
              <p className="mt-2">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full w-full flex items-center justify-center text-red-400 text-sm p-4 text-center">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-sm p-4">
            <Lottie animationData={noFriendsAnimation} style={{ height: 180, width: 180 }} />
            <h2 className="text-slate-200 font-semibold mt-3">No friends yet!</h2>
            <p className="text-xs text-slate-500 mt-1">Share your unique code to add friends.</p>
          </div>
        ) : (
          <ul className="py-2 space-y-1">
            {filtered.map((f) => (
              <FriendItem key={f.id} friend={f} location={location} onLinkClick={onLinkClick} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

export default Sidebar


