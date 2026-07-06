import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/history', label: 'History' },
]

function Navbar() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-black/40 backdrop-blur-md border-b border-purple-900/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
        >
          AI Dressing Room
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'text-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/studio"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Try On →
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-gray-400 hover:text-white text-xl"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-black/70 border-t border-white/5 px-4 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-gray-300 hover:text-white text-sm"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/studio"
            className="text-purple-400 font-semibold text-sm"
            onClick={() => setOpen(false)}
          >
            Try On →
          </Link>
        </div>
      )}
    </nav>
  )
}

export default Navbar
