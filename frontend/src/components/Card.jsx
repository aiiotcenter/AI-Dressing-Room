import React from 'react'

function Card({ children, className = '', onClick, selected = false }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/5 backdrop-blur-sm border rounded-2xl overflow-hidden
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:bg-white/10 hover:-translate-y-0.5' : ''}
        ${selected ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-900/30' : 'border-white/10'}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export default Card
