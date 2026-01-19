import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isAuth: null,
  userinfo: {}//{ id: user._id, username: user.username,friendCode:user.friendCode ,email:user.email,profilePic}
  ,callingState:{"callState":"idle",//idle,calling,ringing,onCall,
    "didICall":false
  }//,
  ,callOffer:{}//callerId,callerName
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.isAuth = action.payload;//pass true or false
    },
    setUser: (state, action) => {
      state.userinfo = action.payload || {};//pass object or {} to set or remove
    },
    setCallingState:(state,action)=>{
      state.callingState=action.payload;
    },
    setCallOffer:(state,action)=>{
      state.callOffer=action.payload;
    },
  }
})

export const { setAuth, setUser ,setCallingState,setCallOffer} = userSlice.actions
export default userSlice.reducer
