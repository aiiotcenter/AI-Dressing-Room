import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'

const steps = [
  {
    icon: 'Photo',
    title: 'Upload Your Photo',
    desc: 'Use your camera or upload a clear front-facing image.',
  },
  {
    icon: 'Shirt',
    title: 'Choose or Upload a Shirt',
    desc: 'Pick from the built-in shirts or upload your own clothing image.',
  },
  {
    icon: 'AI',
    title: 'AI Try-On',
    desc: 'Use your own provider key to generate the final try-on preview.',
  },
]

function Home() {
  return (
    <div className="flex flex-col">
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 md:py-32">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-purple-900/40 border border-purple-700/40 rounded-full text-purple-300 text-sm font-medium mb-6">
            AI Virtual Try-On
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              Virtual
            </span>{' '}
            <span className="text-white">Dressing</span>
            <br />
            <span className="text-white">Room</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Upload your photo, choose one of the built-in shirts or add your own,
            then generate a try-on preview with your own AI key.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/studio">
              <Button className="text-base px-8 py-4">Start Try-On</Button>
            </Link>
            <Link to="/history">
              <Button variant="secondary" className="text-base px-8 py-4">
                View History
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-white mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center relative"
              >
                <span className="absolute -top-3 -left-3 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="text-purple-300 text-sm font-bold uppercase tracking-wide mb-4">
                  {step.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-center py-10 border-t border-white/5 text-sm text-gray-600">
        <Link to="/history" className="hover:text-purple-400 mx-4 transition-colors">
          Try-On History
        </Link>
        <p className="mt-4 text-gray-700">AI Virtual Dressing Room - Internship Project</p>
      </footer>
    </div>
  )
}

export default Home
