export default class RTC
{
  
  constructor(socket,localId,remoteId)
  {
    this.pc=null;
    this.localStream=null;
    this.remoteStream=null;
    this.socket=socket;
    this.peerConfiguration = {
    iceServers:[
        {
            urls:[
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302'
            ]
        }
    ]
}
   this.hasCamera = null;
    this.hasMic = null;
    this.localId=localId;
    this.remoteId=remoteId;
    this.pendingIceCandidates = [];
    
  }
  
  async getStreams() {
  if (this.localStream) return;

  const devices = await navigator.mediaDevices.enumerateDevices();
  this.hasCamera = devices.some(d => d.kind === "videoinput");
  this.hasMic = devices.some(d => d.kind === "audioinput");

  this.localStream = await navigator.mediaDevices.getUserMedia({
    video: this.hasCamera,
    audio: this.hasMic
  });
}

  
  async createConnection(offerObj) {
  if (this.pc) return;

  this.pc = new RTCPeerConnection(this.peerConfiguration);
  this.remoteStream = new MediaStream();

  this.localStream.getTracks().forEach(track => {
    this.pc.addTrack(track, this.localStream);
  });

  this.pc.onicecandidate = (e) => {
    if (e.candidate) {
      this.socket.emit("sendIceCandidateToSignalingServer", {
        iceCandidate: e.candidate,
        senderId: this.localId,
        receiverId: this.remoteId,
      });
    }
  };

  this.pc.ontrack = (e) => {
    this.remoteStream.addTrack(e.track);
  };

  if (offerObj) {
    await this.pc.setRemoteDescription(offerObj.offer);
  }
}

async setRemoteOffer(offer) {
  await this.pc.setRemoteDescription(offer);

  // add queued ICE
  for (const candidate of this.pendingIceCandidates) {
    await this.pc.addIceCandidate(candidate);
  }
  this.pendingIceCandidates = [];
}



  async addNewIceCandidate(iceCandidate) {
  if (!this.pc) return;

  if (!this.pc.remoteDescription) {
    // queue ICE until remote description is set
    this.pendingIceCandidates.push(iceCandidate);
    return;
  }

  try {
    await this.pc.addIceCandidate(iceCandidate);
  } catch (err) {
    console.error("Error adding ICE candidate", err);
  }
}

async  createOffer({callerId,receiverId})
  {
     try{
        
        const offer = await this.pc.createOffer();
        
        this.pc.setLocalDescription(offer);
       
        const offerpack={
            "offer":offer,
            "callerId":callerId,
            "receiverId":receiverId,
            "didIOffer":true
        }
        this.socket.emit('newOffer',offerpack); //send offer to signalingServer
        console.log("offer send")
    }catch(err){
        console.error("Error creating offer:", err);
    }
  }

async answerOffer()
  {
    try {
      const answer = await this.pc.createAnswer({}); 
      await this.pc.setLocalDescription(answer); 
      
      const offerpack={
          "offer":answer,
          "callerId":this.remoteId,
          "receiverId":this.localId,
          "didIOffer":false
      } 
      
       this.socket.emit('newAnswer',offerpack)
       console.log("anser sendf")
    } catch(err) {
      console.error("Error answering offer:", err);
    }
  }

  async addAnswer(answer) {
  await this.pc.setRemoteDescription(answer);

  for (const candidate of this.pendingIceCandidates) {
    await this.pc.addIceCandidate(candidate);
  }
  this.pendingIceCandidates = [];
}


  // FIXED: Added missing close() method
  close() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.remoteStream = null;
    this.pendingIceCandidates = [];

  }
}