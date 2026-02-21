import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Header, Sidebar } from './components/index'
import { SidebarProvider } from './context/SidebarContext'
import { initSocket } from '../socket'
import './App.css'

function App() {
  const isAuth = useSelector((state) => state.user.isAuth)
  const userinfo = useSelector((state) => state.user.userinfo)
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (isAuth && userinfo.id) {
      initSocket(userinfo.id)
    }
  }, [isAuth, userinfo.id])

  // Close sidebar when a chat is selected (mobile)
  useEffect(() => {
    if (/^\/friends\/[^/]+$/.test(location.pathname)) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <SidebarProvider onMenuClick={toggleSidebar}>
    <div className='p-3 md:p-4 flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 overflow-hidden relative'>
      <Header onMenuClick={toggleSidebar} />
      <div className='flex flex-1 gap-4 min-h-0 w-full relative'>
        {/* Mobile overlay - outside overflow container, high z-index */}
        <div
          className={`
            fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm
            md:hidden transition-opacity duration-300
            ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
          onClick={closeSidebar}
          aria-hidden="true"
        />
        {/* Sidebar: desktop inline, mobile fixed overlay with slide - high z-index for visibility */}
        <div
          className={`
            sidebar-wrapper
            flex-shrink-0 w-80 min-h-0
            fixed left-0 top-0 bottom-0 h-screen z-[110] w-80 max-w-[85vw]
            md:static md:h-full md:z-auto md:translate-x-0
            transform transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className='sidebar-inner h-full rounded-none md:rounded-2xl overflow-hidden backdrop-blur-xl bg-slate-800/40 border-0 md:border border-slate-700/50 shadow-xl shadow-black/40'>
            <Sidebar onLinkClick={closeSidebar} />
          </div>
        </div>
        <div className='flex-1 min-w-0 min-h-0 rounded-2xl overflow-hidden backdrop-blur-xl bg-slate-800/40 border border-slate-700/50 shadow-xl shadow-black/40 flex flex-col'>
          <Outlet />
        </div>
      </div>
    </div>
    </SidebarProvider>
  )
}

export default App
