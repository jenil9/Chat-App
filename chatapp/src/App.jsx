import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Header, Sidebar } from './components/index'
import { initSocket } from '../socket'
import './App.css'

function App() {
  const isAuth = useSelector((state) => state.user.isAuth)
  const userinfo = useSelector((state) => state.user.userinfo)

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (isAuth && userinfo.id) {
      initSocket(userinfo.id)
    }
  }, [isAuth, userinfo.id])

  return (
    <div className='p-4 flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50'>
      <Header />
      <div className='flex flex-1 gap-4 min-h-0 w-full'>
        <div className='w-80 rounded-2xl overflow-hidden backdrop-blur-xl bg-slate-800/40 border border-slate-700/50 shadow-xl shadow-black/40'>
          <Sidebar />
        </div>
        <div className='flex-1 rounded-2xl overflow-hidden backdrop-blur-xl bg-slate-800/40 border border-slate-700/50 shadow-xl shadow-black/40 min-h-0'>
          <Outlet />
        </div>
      </div>
     
    </div>
  )
}

export default App
