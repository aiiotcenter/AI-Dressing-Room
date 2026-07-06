import React from 'react'

const variants = {
  primary:
    'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white focus:ring-purple-500',
  secondary:
    'bg-white/10 hover:bg-white/20 text-white border border-white/20 focus:ring-white/30',
  danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500',
}

function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        px-6 py-3 rounded-xl font-semibold text-sm
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

export default Button
