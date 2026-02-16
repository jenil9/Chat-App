import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PendingRequestCard } from '../index'
import {setUser} from '../../store/userSlice'

const ProfileView = () => {
  const user = useSelector((state) => state.user.userinfo || {})
  const { username, email, friendCode, profilePic } = user
  const [pendingRequests, setpendingRequests] = useState([])
  const [failmsg, setfailmsg] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [removing,setRemoving] =useState(false)
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(username || "");


  const dispatch=useDispatch();
  // ref to reset input field
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file)) // local preview
    }
  }
  const handleSaveusername = async () => {
    if (!newUsername.trim()) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/update-username/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: newUsername }),
      });

      if (res.ok) {
        dispatch(setUser({...user,username:newUsername}));
        setIsEditing(false);
        setfailmsg("");
      } else {
        setfailmsg("Failed to update username");
        setNewUsername(username)
      }
    } catch (err) {
      setfailmsg("Error updating username:", err);
      setNewUsername(username)
    }
    finally{
      setIsEditing(false);
      
    }
  };
  const handleCancel = () => {
    setSelectedFile(null)
    setPreview( null) 
    if (fileInputRef.current) {
      fileInputRef.current.value = "" // reset file input so same file can be re-chosen
    }
  }
  
  const handleRemove=async ()=>{
   setRemoving(true)
   try{
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/profile/profilepic/remove/${user.id}`, // ✅ add user id in URL
      {
        method: "PATCH",
        credentials: "include",
      }
    );

   
    if (!res.ok) {
      setfailmsg(data.message || "Failed to remove picture");
    } else {
      setfailmsg("");
      
      dispatch(setUser({...user,profilePic:null}));//overide the profilepic
      
   }
  }
   catch(err)
   {
    setfailmsg("Something went wrong while removing");
   }
   finally{
    setRemoving(false)
   }
  }

  const handleSave = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile); // ✅ must match backend field name
  
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/profile/profilepic/${user.id}`, // ✅ add user id in URL
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );
  
      const data = await res.json();
      if (!res.ok) {
        setfailmsg(data.message || "Failed to upload picture");
      } else {
        setfailmsg("");
        
        // e.g. update Redux/Context user state:
        // dispatch(updateProfilePic(data.url));
        dispatch(setUser({...user,profilePic:data.url}));
        setSelectedFile(null);
        setPreview(null)
      }
    } catch (err) {
      setfailmsg("Something went wrong while uploading");
    } finally {
      setUploading(false);
    }
  };
  

  const handleAccept = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/friend/accept`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meid: user.id, requesterid: id }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        setfailmsg(data.message || "Failed to accept request")
        return
      }
      setpendingRequests(prev => prev.filter(req => req.id !== id))
    } catch (err) {
      setfailmsg("Something went wrong")
    }
  }

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/friend/reject`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meid: user.id, requesterid: id }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        setfailmsg(data.message || "Failed to reject request")
        return
      }
      setpendingRequests(prev => prev.filter(req => req.id !== id))
    } catch (err) {
      setfailmsg("Something went wrong")
    }
  }

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/friend/pendingRequest/${user.id}`,
          { method: 'GET', credentials: 'include' }
        )
        if (!res.ok) {
          setfailmsg("Something went wrong")
          return
        }
        setpendingRequests(await res.json())
      } catch (err) {
        setfailmsg("Failed to get requests, try reloading the page")
      }
    }
    if (user?.id) fetchRequests()
  }, [user?.id])

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900 to-slate-950 text-slate-50 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* User Header */}
        <div className="flex items-center gap-6 mb-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden flex-shrink-0 shadow-xl shadow-cyan-500/30">
            {profilePic ? (
              <img src={profilePic} alt="profile" className="h-full w-full object-cover" />
            ) : (
              (username ? username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U')
            )}
          </div>
          <div className="flex-1">
            {/* Username Edit */}
            <div className="flex items-center gap-3 mb-2">
              <input
                type="text"
                value={newUsername}
                disabled={!isEditing}
                onChange={(e) => setNewUsername(e.target.value)}
                className={`text-2xl font-bold tracking-tight px-3 py-1 rounded-lg transition-all duration-300 ${
                  isEditing 
                    ? "bg-white/10 border border-cyan-400/50 text-slate-100" 
                    : "bg-transparent border border-transparent text-slate-50"
                }`}
              />
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveusername}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-semibold rounded-lg shadow-lg transition-all duration-300"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setNewUsername(username); }}
                    className="px-4 py-2 backdrop-blur-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-semibold rounded-lg transition-all duration-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 backdrop-blur-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 hover:text-cyan-300 text-sm font-semibold rounded-lg transition-all duration-300"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="text-sm text-slate-400">{email || 'you@example.com'}</div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Friend Code */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl hover:bg-white/10 transition-all duration-300 animate-slide-up">
            <div className="text-sm text-slate-400 font-medium">Friend Code</div>
            <div className="mt-3 text-2xl font-bold tracking-widest text-cyan-400">{friendCode || 'XXXX-XXXX'}</div>
            <div className="mt-3 text-xs text-slate-400">Share this code so others can add you.</div>
          </div>

          {/* Profile Picture Upload */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl hover:bg-white/10 transition-all duration-300 animate-slide-up">
            <h3 className='mb-4 font-semibold text-slate-100'>Update Profile Pic</h3>
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden shadow-lg border-2 border-white/10">
                {preview ? (
                  <img src={preview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm text-slate-500">No Image</span>
                )}
              </div>
              {/* File Input */}
              <input
                type="file"
                id="profilePicInput"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              {/* Overlay Button */}
              <label
                htmlFor="profilePicInput"
                className="absolute bottom-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 p-3 rounded-full cursor-pointer shadow-lg transition-all duration-300 hover:scale-110"
              >
                ✏️
              </label>
            </div>

            {selectedFile && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {uploading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            )}
            {
              profilePic && (
              <button
                onClick={handleRemove}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 mt-5"
              >
                {removing ? "Removing..." : "Remove"}
              </button>
              )
            }
            
          </div>
        </div>

        {/* Pending Friend Requests */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Pending Requests</h2>
          {failmsg && (
            <div className="mb-4 p-4 backdrop-blur-lg bg-red-500/20 border border-red-400/30 rounded-xl">
              <p className="text-red-300 text-sm font-medium">{failmsg}</p>
            </div>
          )}
          <div className="space-y-3">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(req => (
                <PendingRequestCard
                  key={req.id}
                  request={req}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))
            ) : (
              <div className="text-slate-400 text-sm text-center py-8">No pending requests</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileView
