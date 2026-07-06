import React from 'react'

function LoadingSpinner({ size = 'md', label = 'Loading...', inline = false }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  }

  if (inline) {
    return (
      <span className="inline-flex items-center gap-2">
        <span
          className={`${sizes[size]} border-white/80 border-t-transparent rounded-full animate-spin inline-block`}
        />
        {label && <span>{label}</span>}
      </span>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`${sizes[size]} border-purple-500 border-t-transparent rounded-full animate-spin`}
      />
      {label && <p className="text-gray-400 text-sm">{label}</p>}
    </div>
  )
}

export default LoadingSpinner
