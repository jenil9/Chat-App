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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/profile/update-username`, {
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
      `${import.meta.env.VITE_API_BASE_URL}/api/profile/profilepic/remove`, // ✅ add user id in URL
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
        `${import.meta.env.VITE_API_BASE_URL}/api/profile/profilepic`, // ✅ add user id in URL
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
        body: JSON.stringify({ requesterid: id }),
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
        body: JSON.stringify({ requesterid: id }),
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
          `${import.meta.env.VITE_API_BASE_URL}/api/friend/pendingRequest`,
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
    <div className="h-full w-full bg-[#0d1117] text-slate-50 min-h-full p-6 overflow-auto">
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* User Header */}
        <div className="flex items-center gap-6 mb-8 bg-[#161b22] border border-white/[0.08] rounded-xl p-5">
          <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden flex-shrink-0 ring-2 ring-blue-500/40 ring-offset-2 ring-offset-[#161b22]">
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
                className={`text-xl font-semibold tracking-tight px-3 py-1 rounded-lg transition-all duration-300 ${
                  isEditing 
                    ? "bg-white/10 border border-blue-500/40 text-slate-100" 
                    : "bg-transparent border border-transparent text-slate-100"
                }`}
              />
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveusername}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-3 py-1.5 transition-colors duration-150"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setNewUsername(username); }}
                    className="border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] text-sm rounded-lg px-3 py-1.5 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm transition-colors duration-150"
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
          <div className="bg-[#161b22] border border-white/[0.08] rounded-xl p-5 animate-slide-up">
            <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">Friend Code</div>
            <div className="text-slate-100 text-2xl font-bold font-mono tracking-[0.2em]">{friendCode || 'XXXX-XXXX'}</div>
            <div className="text-slate-500 text-sm mt-1">Share this code so others can add you.</div>
          </div>

          {/* Profile Picture Upload */}
          <div className="bg-[#161b22] border border-white/[0.08] rounded-xl p-5 flex flex-col items-center justify-center animate-slide-up">
            <h3 className='mb-4 font-semibold text-slate-100'>Update Profile Pic</h3>
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/[0.12] hover:border-blue-500/50 bg-[#1c2128] flex items-center justify-center overflow-hidden cursor-pointer transition-colors duration-150">
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
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 p-2.5 rounded-full cursor-pointer transition-colors duration-150"
              >
                ✏️
              </label>
            </div>

            {selectedFile && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg px-3 py-1.5 text-sm transition-colors duration-150 disabled:opacity-50"
                >
                  {uploading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  className="border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>
            )}
            {
              profilePic && (
              <button
                onClick={handleRemove}
                className="text-red-400 text-sm hover:text-red-300 transition-colors duration-150 mt-5"
              >
                {removing ? "Removing..." : "Remove"}
              </button>
              )
            }
            
          </div>
        </div>

        {/* Pending Friend Requests */}
        <div className="mt-10">
          <h2 className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">Pending Requests</h2>
          {failmsg && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
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
              <div className="text-slate-600 text-sm text-center py-8">No pending requests</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileView
