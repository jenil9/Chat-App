import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isAuth: null,
  userinfo: {}//{ id: user._id, username: user.username,friendCode:user.friendCode ,email:user.email}
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
  }
})

export const { setAuth, setUser } = userSlice.actions
export default userSlice.reducer
