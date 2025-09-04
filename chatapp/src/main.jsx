import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {Routes,Route, BrowserRouter} from 'react-router-dom'
import './index.css'
import {Layout,LoginForm,SignupForm,ProtectedRoute} from './components/index.js'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './store/store.js'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>

   <BrowserRouter>
    <Routes>

      <Route path='/' element={<ProtectedRoute><App /></ProtectedRoute>}></Route>
       <Route path='/login' element={<LoginForm />}></Route>
      <Route path='/signup' element={<SignupForm />}></Route>
    </Routes>
    </BrowserRouter>
    </Provider>
  </StrictMode>
)
