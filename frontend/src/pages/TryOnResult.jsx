import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'

const API_URL = 'http://localhost:8000'

function TryOnResult() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const userPhotoUrl = localStorage.getItem('userPhotoUrl')
  const clothId = localStorage.getItem('selectedClothId')
  const clothName = localStorage.getItem('selectedClothName')

  useEffect(() => {
    if (!userPhotoUrl || !clothId) {
      navigate('/')
      return
    }
    generateTryOn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateTryOn = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_URL}/try-on`, {
        user_photo_url: userPhotoUrl,
        cloth_id: parseInt(clothId),
      })
      setResult(res.data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to generate try-on. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <p className="text-white text-xl font-semibold">Generating your try-on...</p>
          <p className="text-gray-400 text-sm mt-2">
            Our AI is compositing the outfit onto your photo ✨
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Try-On Result</h1>
        <p className="text-gray-400">Here&apos;s a preview of the outfit on you.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8 text-xs text-gray-500">
        <span className="px-3 py-1 bg-green-600/40 text-green-400 rounded-full">✓ Photo</span>
        <span className="w-8 h-px bg-gray-700" />
        <span className="px-3 py-1 bg-green-600/40 text-green-400 rounded-full">✓ Outfit</span>
        <span className="w-8 h-px bg-gray-700" />
        <span className="px-3 py-1 bg-purple-600 text-white rounded-full font-semibold">3. Result</span>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl p-4 mb-6 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={generateTryOn} className="underline hover:text-red-200 ml-4">
            Retry
          </button>
        </div>
      )}

      {result && (
        <>
          {/* Try-on result — side by side: your photo + selected outfit */}
          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <span className="inline-block px-4 py-1 bg-purple-600/30 border border-purple-600/30 text-purple-300 rounded-full text-sm font-medium">
                ✨ Virtual Try-On Preview
              </span>
              {clothName && (
                <span className="text-gray-400 text-sm">
                  Outfit: <span className="text-white font-semibold">{clothName}</span>
                </span>
              )}
            </div>

            {/* AI-generated try-on result — main output */}
            <div className="mb-4">
              <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider mb-2">AI Generated Try-On</p>
              <img
                src={result.generated_image_url}
                alt="AI try-on result"
                className="w-full rounded-xl object-cover max-h-[480px]"
              />
            </div>

            {/* Comparison: original photo vs selected outfit */}
            <div className="grid grid-cols-2 gap-4">
              {/* User photo */}
              <div className="relative">
                <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider mb-2">You</p>
                <img
                  src={result.user_photo_url}
                  alt="Your photo"
                  className="w-full rounded-xl object-cover aspect-[3/4]"
                />
              </div>

              {/* Selected outfit */}
              <div className="relative">
                <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider mb-2">Selected Outfit</p>
                <img
                  src={result.cloth_image_url}
                  alt="Selected outfit"
                  className="w-full rounded-xl object-cover aspect-[3/4] bg-gray-900"
                />
              </div>
            </div>


          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/">
              <Button variant="secondary">Home</Button>
            </Link>
            <Button variant="secondary" onClick={() => navigate('/collection')}>
              Try Another Outfit
            </Button>
            <Button onClick={() => navigate('/camera')}>New Photo →</Button>
          </div>
        </>
      )}
    </div>
  )
}

export default TryOnResult
