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
    <div className='p-4 flex flex-col h-screen bg-[#1e1f22] text-gray-200 '>
      <Header />
      <div className='flex flex-1 gap-4 min-h-0'>
        <div className='w-1/4 rounded-2xl overflow-hidden border border-gray-800'>
          <Sidebar />
        </div>
        <div className='w-3/4 rounded-2xl overflow-hidden border border-gray-800 min-h-0'>
          <Outlet />
        </div>
      </div>
     
    </div>
  )
}

export default App
