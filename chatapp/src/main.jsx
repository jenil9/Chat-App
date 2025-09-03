import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {Routes,Route, BrowserRouter} from 'react-router-dom'
import './index.css'
import {Layout,LoginForm,SignupForm} from './components/index.js'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    
   <BrowserRouter>
    <Routes>
      <Route path='/' element={<App />}></Route>
       <Route path='/login' element={<LoginForm />}></Route>
      <Route path='/signup' element={<SignupForm />}></Route>
    </Routes>
    </BrowserRouter>
  </StrictMode>
)
