import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import {Header} from './components/index'
import './App.css'


function App() {
  return (
    <div className='p-4 flex flex-col h-screen bg-[#1e1f22] text-gray-200 '>
      <Header />
      <div className='flex flex-1 '>
        <div className='w-1/4 p-4 bg-[#2b2d31] border-r border-gray-700 '></div>
        <div className='w-3/4 bg-[#313338]'>
          <Outlet />
        </div>
      </div>
     
    </div>
  )
}

export default App
