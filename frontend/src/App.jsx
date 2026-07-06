import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import TryOnStudio from './pages/TryOnStudio'
import CameraCapture from './pages/CameraCapture'
import ClothesCollection from './pages/ClothesCollection'
import TryOnResult from './pages/TryOnResult'
import History from './pages/History'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<TryOnStudio />} />
          <Route path="/camera" element={<CameraCapture />} />
          <Route path="/collection" element={<ClothesCollection />} />
          <Route path="/result" element={<TryOnResult />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
