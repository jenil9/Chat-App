import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import {Header, Sidebar} from './components/index'
import './App.css'


function App() {
  return (
    <div className='p-4 flex flex-col h-screen bg-[#1e1f22] text-gray-200 '>
      <Header />
      <div className='flex flex-1 gap-4'>
        <div className='w-1/4 rounded-2xl overflow-hidden border border-gray-800'>
          <Sidebar />
        </div>
        <div className='w-3/4 rounded-2xl overflow-hidden border border-gray-800'>
          <Outlet />
        </div>
      </div>
     
    </div>
  )
}

export default App
