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

  addNewIceCandidate(iceCandidate)
  {
    this.pc.addIceCandidate(iceCandidate);
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
    }catch(err){
        
    }
  }

async answerOffer()
  {
    //  await getStreams()
    // await createPeerConnection(offerObj);
    const answer = await this.pc.createAnswer({}); 
    await this.pc.setLocalDescription(answer); 
   
    const offerpack={
            "offer":answer,
            "callerId":this.remoteId,
            "receiverId":this.localId,
            "didIOffer":false
        } 
    
    await this.socket.emit('newAnswer',offerpack)
  }

  async  addAnswer(offer)
  {
await this.pc.setRemoteDescription(offer);
  }
}