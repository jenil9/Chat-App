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
      
      dispatch(setUser({...user,profilePic:null}));
      
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
    <div className="h-full w-full bg-[#313338] text-gray-200 p-6">
      <div className="max-w-2xl mx-auto">
        {/* User Header */}
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-xl font-semibold overflow-hidden">
            {profilePic ? (
              <img src={profilePic} alt="profile" className="h-full w-full object-cover" />
            ) : (
              (username ? username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U')
            )}
          </div>
          <div>
            {/* <div className="text-2xl font-semibold">{username || 'Your Name'}</div> */}
            <div className="flex items-center gap-2">
          <input
            type="text"
            value={newUsername}
            disabled={!isEditing}   // initially disabled
            onChange={(e) => setNewUsername(e.target.value)}
            className={`border px-2 py-1 text-2xl font-semibold rounded ${
              isEditing ? "border-blue-600" : "border-transparent bg-transparent"
            }`}
          />
          {isEditing ? (
            <>
              <button
                onClick={handleSaveusername}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={() => { setIsEditing(false); setNewUsername(username); }}
                className="text-gray-500 px-2 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 text-sm underline ml-2"
            >
              Update
            </button>
          )}
        </div>
            <div className="text-sm text-gray-400">{email || 'you@example.com'}</div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Friend Code */}
          <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400">Friend Code</div>
            <div className="mt-1 text-lg font-semibold tracking-widest">{friendCode || 'XXXX-XXXX'}</div>
            <div className="mt-2 text-xs text-gray-400">Share this code so others can add you.</div>
          </div>

          {/* Profile Picture Upload */}
          <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="h-28 w-28 rounded-full bg-[#2b2d31] flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img src={preview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm text-gray-500">No Image</span>
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
                className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700"
              >
                ✎
              </label>
            </div>

            {selectedFile && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="px-4 py-1 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {uploading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-1 bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Cancel
                </button>
              </div>
            )}
            {
             profilePic && (
              <button
              onClick={handleRemove}
              className="px-4 py-1 bg-red-600 rounded-lg hover:bg-red-700 mt-5"
            >
              {removing ? "Removing..." : "Remove"}
            </button>
             )
            }
            
          </div>
        </div>

        {/* Pending Friend Requests */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Pending Friend Requests</h2>
          {failmsg && <div className="text-red-400 text-sm mb-3">{failmsg}</div>}
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
              <div className="text-gray-400 text-sm">No pending requests</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileView
