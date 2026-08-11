import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import './styles/main.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App