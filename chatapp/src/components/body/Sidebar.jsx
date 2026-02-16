import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { selectUnreadCountForFriend } from '../../store/messagesSlice'
import noFriendsAnimation from '../../animations/No Data Available.json'
import Lottie from 'lottie-react'

// Friend item component to avoid hooks in map
const FriendItem = ({ friend, location }) => {
  const unreadCount = useSelector((state) => selectUnreadCountForFriend(state, friend.id))
  
  return (
    <li key={friend.id}>
      <Link
        to={{ pathname: `/friends/${friend.id}` }}
        state={{ friend: friend, from: location.pathname }}
        className="flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-xl backdrop-blur-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 hover:translate-x-1 animate-slide-in group"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0 shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-shadow duration-300">
          {friend.profilePic ? (
            <img src={friend.profilePic} alt="profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-white">{friend.username ? friend.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-slate-100 truncate">{friend.username || 'Unknown'}</div>
          <div className="text-xs text-slate-400 truncate">{friend.email || ''}</div>
        </div>
        {unreadCount > 0 && (
          <div className="ml-2 min-w-[24px] h-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg shadow-cyan-500/50 flex-shrink-0">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </Link>
    </li>
  )
}

const Sidebar = () => {
  const location = useLocation()
  const [friends, setFriends] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const user = useSelector((state)=>state.user.userinfo)

  const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || 'https://localhost:3000'

  useEffect(() => {
    if (!user?.id) return
    let ignore = false
    async function loadFriends() {
      setLoading(true)
      setError('')
      try {
        // Expected response shape: [{ id, username, email,profilePic }]
        const res = await fetch(`${API_BASE}/api/friend/list/${user.id}`, {
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
    <aside className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 text-slate-50">
      <div className="p-4 border-b border-slate-700/50 backdrop-blur-lg bg-white/5">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white overflow-hidden shadow-lg shadow-cyan-500/40 flex-shrink-0 group cursor-pointer hover:shadow-cyan-500/60 transition-shadow duration-300">
            {user.profilePic ? (
              <img src={user.profilePic} alt="profile" className="h-full w-full object-cover" />
            ) : (
              (user.username ? user.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U')
            )}
          </div>
          <div>
            <div className="font-semibold text-slate-100">{user?.username || 'User'}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow"></span>
              online
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search friends..."
              className="w-full px-4 py-3 pl-10 backdrop-blur-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:bg-white/10 rounded-xl text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/20"
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-300 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-cyan-400"></div>
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
              <FriendItem key={f.id} friend={f} location={location} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

export default Sidebar


