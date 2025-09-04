import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isAuth: null,
  userinfo: {}
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
