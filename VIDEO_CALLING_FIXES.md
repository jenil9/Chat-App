# Video Calling Feature - Detailed Fixes

## Fix 1: Correct Parameter Names in `createOffer()` Call

**File:** [chatapp/src/components/body/VideoWindow.jsx](chatapp/src/components/body/VideoWindow.jsx#L140-L150)

### Current (Broken):
```javascript
const startCall=async()=>{
  if (!pcRef.current) return;
  await pcRef.current.getStreams();
  if(callingState.didICall==true&& !callSentRef.current)
  {
    await pcRef.current.createConnection();
    pcRef.current.createOffer({userId,friendId})  // ❌ WRONG PARAMS
  }
}
```

### Fixed:
```javascript
const startCall=async()=>{
  if (!pcRef.current) return;
  await pcRef.current.getStreams();
  if(callingState.didICall==true&& !callSentRef.current)
  {
    await pcRef.current.createConnection();
    await pcRef.current.createOffer({callerId: userId, receiverId: friendId})  // ✅ CORRECT
  }
}
```

---

## Fix 2: Add Proper Await and Fix Mute Logic

**File:** [chatapp/src/sevices/RTC.js](chatapp/src/sevices/RTC.js#L110-L125)

### Current (Broken):
```javascript
async answerOffer() {
  try {
    const answer = await this.pc.createAnswer({}); 
    await this.pc.setLocalDescription(answer);
    const offerpack={
        "offer":answer,
        "callerId":this.remoteId,
        "receiverId":this.localId,
        "didIOffer":false
    } 
    await this.socket.emit('newAnswer',offerpack)  // ❌ emit is not async
  } catch(err) {
    console.error("Error answering offer:", err);
  }
}
```

### Fixed:
```javascript
async answerOffer() {
  try {
    const answer = await this.pc.createAnswer({}); 
    await this.pc.setLocalDescription(answer);
    const offerpack={
        "offer":answer,
        "callerId":this.remoteId,
        "receiverId":this.localId,
        "didIOffer":false
    } 
    this.socket.emit('newAnswer', offerpack)  // ✅ NO await on emit
  } catch(err) {
    console.error("Error answering offer:", err);
  }
}
```

---

## Fix 3: Fix Mute and Camera Toggle Logic

**File:** [chatapp/src/components/body/VideoWindow.jsx](chatapp/src/components/body/VideoWindow.jsx#L177-L200)

### Current (Broken):
```javascript
const handleMute = () => {
  if (pcRef.current?.localStream) {
    const audioTracks = pcRef.current.localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !isMuted;  // ❌ LOGIC IS BACKWARDS
    });
    setIsMuted(!isMuted);
  }
};

const handleCameraToggle = () => {
  if (pcRef.current?.localStream) {
    const videoTracks = pcRef.current.localStream.getVideoTracks();
    videoTracks.forEach(track => {
      track.enabled = cameraOff;  // ❌ LOGIC IS BACKWARDS
    });
    setCameraOff(!cameraOff);
  }
};
```

### Fixed:
```javascript
const handleMute = () => {
  if (pcRef.current?.localStream) {
    const audioTracks = pcRef.current.localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = isMuted;  // ✅ If currently muted, enable when toggling
    });
    setIsMuted(!isMuted);
  }
};

const handleCameraToggle = () => {
  if (pcRef.current?.localStream) {
    const videoTracks = pcRef.current.localStream.getVideoTracks();
    videoTracks.forEach(track => {
      track.enabled = !cameraOff;  // ✅ If camera off, enable when toggling
    });
    setCameraOff(!cameraOff);
  }
};
```

---

## Fix 4: Initialize User State in Backend

**File:** [backend/socket/chat.js](backend/socket/chat.js#L302-318)

### Current (Broken):
```javascript
socket.on("call-send",async ({callerId,receiverId})=>{
  if(onlineUsers.has(String(receiverId)) && 
     usersState.has(String(receiverId)) && 
     usersState.get(String(receiverId)).status=="idle")
  {
    usersState.get(String(callerId)).status="calling";  // ❌ callerId might not exist
    usersState.get(String(receiverId)).status="ringing";
```

### Fixed:
```javascript
socket.on("call-send",async ({callerId,receiverId})=>{
  if(onlineUsers.has(String(receiverId)) && 
     usersState.has(String(receiverId)) && 
     usersState.get(String(receiverId)).status=="idle" &&
     usersState.has(String(callerId)))  // ✅ ADD THIS CHECK
  {
    usersState.get(String(callerId)).status="calling";
    usersState.get(String(receiverId)).status="ringing";
```

---

## Fix 5: Fix Disconnect Handler - Undefined Friends Variable

**File:** [backend/socket/chat.js](backend/socket/chat.js#L256-273)

### Current (Broken):
```javascript
socket.on("disconnect", async () => {
  if (onlineUsers.has(userId)) {
    onlineUsers.get(userId).delete(socket.id);
    if (onlineUsers.get(userId).size === 0) {
      onlineUsers.delete(userId);
      friends.forEach(fId => {  // ❌ 'friends' is undefined!
        const fStr = String(fId);
        if (onlineUsers.has(fStr)) {
          onlineUsers.get(fStr).forEach(fSocketId => {
            socket.to(fSocketId).emit("iamoffline", userId);
          });
        }
      });
    }
  }
});
```

### Fixed:
```javascript
socket.on("disconnect", async () => {
  if (onlineUsers.has(userId)) {
    onlineUsers.get(userId).delete(socket.id);
    if (onlineUsers.get(userId).size === 0) {
      onlineUsers.delete(userId);
      usersState.delete(userId);
      
      try {
        const user = await User.findById(userId);  // ✅ FETCH friends from DB
        const friends = user.friends || [];
        
        friends.forEach(fId => {
          const fStr = String(fId);
          if (onlineUsers.has(fStr)) {
            onlineUsers.get(fStr).forEach(fSocketId => {
              socket.to(fSocketId).emit("iamoffline", userId);
            });
          }
        });
      } catch (err) {
        console.error("Error fetching user on disconnect:", err);
      }
    }
  }
});
```

---

## Fix 6: Add Proper Call State Initialization

**File:** [backend/socket/chat.js](backend/socket/chat.js#L315-328)

### Current (Broken):
```javascript
socket.on("call-accept",({callerId,receiverId})=>{
  if(usersState.has(String(callerId))) {
    usersState.get(String(callerId)).status="onCall";
  }
  if(usersState.has(String(receiverId))) {
    usersState.get(String(receiverId)).status="onCall";
  }
```

### Fixed (Add validation):
```javascript
socket.on("call-accept",({callerId,receiverId})=>{
  // Validate both users exist and are in correct state
  if(!usersState.has(String(callerId)) || !usersState.has(String(receiverId))) {
    return socket.emit('error', {message: 'Call state mismatch'});
  }
  
  const callerStatus = usersState.get(String(callerId)).status;
  const receiverStatus = usersState.get(String(receiverId)).status;
  
  if(callerStatus !== 'calling' || receiverStatus !== 'ringing') {
    return socket.emit('error', {message: 'Invalid call state'});
  }
  
  usersState.get(String(callerId)).status="onCall";
  usersState.get(String(receiverId)).status="onCall";
  
  const callerSocketIds = onlineUsers.get(String(callerId));
  if (callerSocketIds) {
    callerSocketIds.forEach(socketId => {
      socket.to(socketId).emit("call-accepted",{callerId,receiverId});
    });
  }
})
```

---

## Fix 7: Implement or Remove Empty videoSocketHandler

**File:** [backend/socket/chat.js](backend/socket/chat.js#L395-401)

### Option A: Remove it entirely
```javascript
module.exports={chatSocketHandler}  // Remove videoSocketHandler
```

Then update backend/index.js:
```javascript
io.on("connection", (socket) => {
  chatSocketHandler(io, socket);
});
```

### Option B: Implement it for video-specific events
```javascript
async function videoSocketHandler(io, socket) {
  const userId = String(socket.handshake?.auth?.userId);
  if (!userId) return;
  
  // Video-specific handlers could go here if needed
  // But currently all video logic is in chatSocketHandler
}
```

---

## Fix 8: Restructure VideoWindow to Prevent Race Conditions

**File:** [chatapp/src/components/body/VideoWindow.jsx](chatapp/src/components/body/VideoWindow.jsx#L113-155)

### Current (Problematic Flow):
```javascript
useEffect(()=>{
  if(friendState==null) return;
  if(friendState=="offline"||friendState=="onOtherCall") return;
  
  if(callingState.didICall==true&& !callSentRef.current) {
    socket.emit("call-send",{...});
    callSentRef.current = true;
  }
},[friendState])

useEffect(()=>{
  if(friendState!="onCall") return;
  const startCall=async()=>{
    if (!pcRef.current) return;
    await pcRef.current.getStreams();
    if(callingState.didICall==true&& !callSentRef.current) {
      await pcRef.current.createConnection();
      pcRef.current.createOffer({userId,friendId})  // ❌ Race condition
    }
  }
  startCall();
},[friendState])
```

### Improved Flow:
```javascript
// After friend accepts call, ensure receiver is ready before creating offer
useEffect(()=>{
  if(friendState != "onCall") return;
  
  const initializeCall = async () => {
    try {
      if (!pcRef.current) return;
      
      // Both sides get media streams
      if (!pcRef.current.localStream) {
        await pcRef.current.getStreams();
      }
      
      // Only the caller creates and sends the offer
      if(callingState.didICall === true && !callSentRef.current) {
        await pcRef.current.createConnection();
        await pcRef.current.createOffer({callerId: userId, receiverId: friendId});
        callSentRef.current = true;
      } else if(callingState.didICall === false) {
        // Receiver prepares connection but waits for offer
        if(!pcRef.current.pc) {
          await pcRef.current.createConnection();
        }
      }
    } catch(err) {
      console.error("Error initializing call:", err);
      onEndCall();
    }
  };
  
  initializeCall();
},[friendState])
```

---

## Recommended Testing Checklist

After applying these fixes, test:

- [ ] Call request sent with correct parameters
- [ ] Caller receives "online" response
- [ ] Receiver gets incoming call notification
- [ ] Receiver can accept/reject call
- [ ] Both users' streams are visible in video window
- [ ] Mute button properly disables audio
- [ ] Camera button properly disables video
- [ ] End call properly closes connection and notifies both sides
- [ ] Call state resets to idle after call ends
- [ ] Multiple calls don't interfere with each other
- [ ] Rejecting a call returns both users to idle state

