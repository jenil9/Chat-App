# Video Calling Feature - Issues & Analysis

## Critical Issues Found

### **Frontend Issues**

#### 1. **Incorrect Parameter in `createOffer()` Call** ⚠️ CRITICAL
**File:** [chatapp/src/components/body/VideoWindow.jsx](chatapp/src/components/body/VideoWindow.jsx#L145)
**Problem:** 
```javascript
await pcRef.current.createConnection();
await pcRef.current.createOffer({userId,friendId})  // ❌ WRONG
```
Should be `callerId` and `receiverId`:
```javascript
await pcRef.current.createOffer({callerId: userId, receiverId: friendId})
```
**Impact:** The RTC class expects `callerId` and `receiverId`, not `userId` and `friendId`. This causes the offer to be sent with undefined values.

---

#### 2. **Incorrect Parameter Names in `createOffer()` Method** ⚠️ CRITICAL
**File:** [chatapp/src/sevices/RTC.js](chatapp/src/sevices/RTC.js#L87)
**Problem:**
```javascript
async createOffer({callerId,receiverId})  // ✅ expects these
```
But called with:
```javascript
createOffer({userId,friendId})  // ❌ sends these instead
```
**Impact:** Variables `callerId` and `receiverId` are undefined inside the method.

---

#### 3. **Missing `await` in `createAnswer()` and `setLocalDescription()`** ⚠️ HIGH
**File:** [chatapp/src/sevices/RTC.js](chatapp/src/sevices/RTC.js#L110-L120)
**Problem:**
```javascript
async answerOffer() {
  const answer = await this.pc.createAnswer({}); 
  await this.pc.setLocalDescription(answer);  // ✅ Good
  await this.socket.emit('newAnswer',offerpack)  // ❌ emit doesn't return promise
}
```
The `await` on `socket.emit()` is incorrect - socket.emit is not async. This may cause timing issues.

---

#### 4. **Race Condition in Offer Creation** ⚠️ HIGH
**File:** [chatapp/src/components/body/VideoWindow.jsx](chatapp/src/components/body/VideoWindow.jsx#L130-L150)
**Problem:**
```javascript
const startCall=async()=>{
  if (!pcRef.current) return;
  await pcRef.current.getStreams();  // Gets local stream
  if(callingState.didICall==true && !callSentRef.current) {
    await pcRef.current.createConnection();  // Creates peer connection WITHOUT remote offer
    pcRef.current.createOffer({userId,friendId})  // Wrong params + missing await
  }
}
```
**Issue:** The offer is created BEFORE receiving the answer. WebRTC requires a specific flow:
1. Caller creates offer → sends to receiver
2. Receiver creates answer → sends back
3. Then ICE candidates are exchanged

Currently, the code doesn't wait for the receiver to receive the offer before sending it.

---

#### 5. **Mute/Unmute Logic Inverted** ⚠️ MEDIUM
**File:** [chatapp/src/components/body/VideoWindow.jsx](chatapp/src/components/body/VideoWindow.jsx#L181-L186)
**Problem:**
```javascript
const handleMute = () => {
  if (pcRef.current?.localStream) {
    const audioTracks = pcRef.current.localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !isMuted;  // ❌ INVERTED LOGIC
    });
    setIsMuted(!isMuted);
  }
};
```
**Should be:**
```javascript
track.enabled = !isMuted;  // When toggling TO muted, disable. When toggling TO unmuted, enable
// OR more clearly:
track.enabled = isMuted;  // If currently muted, enable it when clicking mute button
```

Actually, the logic is confusing. When `isMuted` is `false` (not muted), clicking mute should:
- Set `track.enabled = false`
- Set `isMuted = true`

---

#### 6. **Missing Proper State Initialization** ⚠️ MEDIUM
**File:** [chatapp/src/components/body/VideoWindow.jsx](chatapp/src/components/body/VideoWindow.jsx#L1-30)
**Problem:** The `usersState` map in the backend needs to be initialized when a user connects, but in the component, there's no state being pushed to initialize the caller/receiver in `usersState` before they start calling.

---

### **Backend Issues**

#### 1. **User State Never Initialized Properly** ⚠️ CRITICAL
**File:** [backend/socket/chat.js](backend/socket/chat.js#L24)
**Problem:**
```javascript
usersState.set(userId,{"status":"idle"});
```
This is set when the user connects, but the receiver's `usersState` might not exist when the check happens.

**Additional Issue:**
```javascript
socket.on("call-send", ({callerId,receiverId}) => {
  if(onlineUsers.has(String(receiverId)) && 
     usersState.has(String(receiverId)) &&  // ✅ Checks exist
     usersState.get(String(receiverId)).status == "idle") {
    usersState.get(String(callerId)).status = "calling";
    usersState.get(String(receiverId)).status = "ringing";
```
But `callerId` might NOT be in `usersState` yet! Should check if it exists first.

---

#### 2. **Missing Friendship Validation** ⚠️ MEDIUM
**File:** [backend/socket/chat.js](backend/socket/chat.js#L281-295)
**Problem:** There's no check to ensure the caller and receiver are actually friends before allowing a call. Anyone can call anyone.

---

#### 3. **Empty `videoSocketHandler`** ⚠️ HIGH
**File:** [backend/socket/chat.js](backend/socket/chat.js#L399-403)
```javascript
async function videoSocketHandler(io, socket) {
  // EMPTY - not implemented!
}
```
This handler is registered but does nothing. All video logic is in `chatSocketHandler`.

---

#### 4. **Undefined Variable in `disconnect` Event** ⚠️ MEDIUM
**File:** [backend/socket/chat.js](backend/socket/chat.js#L258-272)
**Problem:**
```javascript
socket.on("disconnect", async () => {
  if (onlineUsers.has(userId)) {
    onlineUsers.get(userId).delete(socket.id);
    if (onlineUsers.get(userId).size === 0) {
      onlineUsers.delete(userId);
      friends.forEach(fId => {  // ❌ 'friends' is undefined!
        // ...
      });
    }
  }
});
```
The `friends` variable is not defined in this scope. It should be fetched from the database.

---

#### 5. **Missing State Cleanup on Call End** ⚠️ MEDIUM
**File:** [backend/socket/chat.js](backend/socket/chat.js#L304-315)
**Problem:** When a call ends, both users' states need to be reset to "idle". Currently it's done, but there's no validation that the users are actually in a call before ending it.

---

### **Integration Issues**

#### 1. **Socket Event Flow Mismatch** ⚠️ CRITICAL
**Expected Flow:**
1. Caller: `emit("call-request", {callerId, receiverId})` 
2. Server: Check if receiver is online/idle → emit response
3. Caller: Receives response → if "online", emit `"call-send"`
4. Server: Emit `"call-receive"` to receiver
5. Receiver: Receives call → displays incoming call UI
6. Receiver: Accepts → emit `"call-accept"`
7. Both: Start creating peer connection + offer/answer

**Current Issues:**
- Step 1: Parameters are wrong in `createOffer()` call
- Step 6-7: No synchronization - both sides might try to create offer

---

#### 2. **No Answer to Initial Offer Reception** ⚠️ HIGH
**File:** [chatapp/src/components/body/VideoWindow.jsx](chatapp/src/components/body/VideoWindow.jsx#L66-69)
**Problem:**
```javascript
const handleNewOffer = async (offerPack)=>{
  if (!pcRef.current) return;
  await pcRef.current.getStreams();
  await pcRef.current.createConnection(offerPack);
  pcRef.current.answerOffer();
}
```
The issue: `createConnection()` takes an optional `offerObj` parameter, but when the caller receives the answer, they call `addAnswer()` not `createConnection()`. The flow is inconsistent.

---

#### 3. **Missing Caller-Side Answer Handling** ⚠️ CRITICAL
The caller never properly receives and processes the answer. In `handleAnswerResponse`:
```javascript
const handleAnswerResponse = (offerObj)=>{
  if (pcRef.current) pcRef.current.addAnswer(offerObj.offer)
}
```
This should be `offerObj.offer` is the answer, but it's named `offerObj` which is confusing.

---

### **Security Issues**

#### 1. **No Authentication on Socket Events** ⚠️ MEDIUM
All video call events should verify the socket user matches the `senderId`/`callerId`.

#### 2. **No Rate Limiting on Call Attempts** ⚠️ LOW
Users can spam call requests without limit.

---

## Summary of Critical Fixes Needed

| Priority | Issue | Location | Fix |
|----------|-------|----------|-----|
| 🔴 CRITICAL | Wrong params in `createOffer()` call | VideoWindow.jsx:145 | Change `{userId,friendId}` to `{callerId:userId, receiverId:friendId}` |
| 🔴 CRITICAL | Offer creation before answer received | VideoWindow.jsx:130-150 | Restructure call flow - caller creates offer after receiver ready |
| 🔴 CRITICAL | User state not initialized for caller | chat.js:310-315 | Add check: `if(!usersState.has(String(callerId))) usersState.set(...)` |
| 🟠 HIGH | Missing await on createOffer | RTC.js:145 | Add `await` before socket.emit |
| 🟠 HIGH | Undefined `friends` in disconnect handler | chat.js:268 | Fetch friends from database in disconnect event |
| 🟠 HIGH | Mute logic inverted | VideoWindow.jsx:181-186 | Fix track.enabled logic |
| 🟡 MEDIUM | Empty videoSocketHandler | chat.js:399 | Implement or remove |
| 🟡 MEDIUM | No friendship validation for calls | chat.js:281 | Add check to verify users are friends |

