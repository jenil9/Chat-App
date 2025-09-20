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
        className="flex items-center gap-3 px-3 py-2 hover:bg-[#1e1f22] transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-semibold overflow-hidden">
        {friend.profilePic ? (
              <img src={friend.profilePic} alt="profile" className="h-full w-full object-cover" />
            ) : (
              (friend.username ? friend.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U')
            )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{friend.username || 'Unknown'}</div>
          <div className="text-xs text-gray-400 truncate">{friend.email || ''}</div>
        </div>
        {unreadCount > 0 && (
          <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
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

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

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
    <aside className="h-full flex flex-col bg-[#2b2d31] text-gray-200">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {/* <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">A</div> */}
          <div className="h-15 w-15 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold overflow-hidden">
            {user.profilePic ? (
              <img src={user.profilePic} alt="profile" className="h-full w-full object-cover" />
            ) : (
              (user.username ? user.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U')
            )}
          </div>
          <div>
            <div className="font-semibold">{user?.username || 'User'}</div>
            <div className="text-xs text-gray-400">online</div>
          </div>
        </div>
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search friends..."
            className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none"
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Friends list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">Loading...</div>
        ) : error ? (
          <div className="h-full w-full flex items-center justify-center text-red-400 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 text-sm">
            <Lottie animationData={noFriendsAnimation} style={{ height: 220, width: 220 }} />
            <h2 style={{ marginTop: 12, fontSize: "1.1rem" }}>No friends yet!</h2>
            <p className="text-xs">Share your unique code to add friends.</p>
          </div>
        ) : (
          <ul className="py-2">
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


