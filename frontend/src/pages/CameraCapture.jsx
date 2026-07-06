import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'

const API_URL = 'http://localhost:8000'

function CameraCapture() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Stop camera when leaving page
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [stream])

  const startCamera = async () => {
    setError('')
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      videoRef.current.srcObject = mediaStream
      setStream(mediaStream)
      setCameraActive(true)
    } catch {
      setError(
        'Could not access camera. Please allow camera permissions in your browser and try again.'
      )
    }
  }

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
      setCameraActive(false)
    }
  }, [stream])

  const capturePhoto = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(dataUrl)
    stopCamera()
  }

  const retake = () => {
    setCapturedImage(null)
    startCamera()
  }

  const handleContinue = async () => {
    if (!capturedImage) return
    setUploading(true)
    setError('')
    try {
      const res = await fetch(capturedImage)
      const blob = await res.blob()
      const formData = new FormData()
      formData.append('file', blob, 'user-photo.jpg')

      const response = await axios.post(`${API_URL}/upload-user-photo`, formData)
      localStorage.setItem('userPhotoUrl', response.data.url)
      localStorage.setItem('userPhotoPreview', capturedImage)
      navigate('/collection')
    } catch {
      setError('Failed to upload photo. Make sure the backend is running on port 8000.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Capture Your Photo</h1>
        <p className="text-gray-400">
          Stand in a well-lit area and take a clear front-facing photo.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8 text-xs text-gray-500">
        <span className="px-3 py-1 bg-purple-600 text-white rounded-full font-semibold">1. Photo</span>
        <span className="w-8 h-px bg-gray-700" />
        <span className="px-3 py-1 bg-white/10 rounded-full">2. Select Outfit</span>
        <span className="w-8 h-px bg-gray-700" />
        <span className="px-3 py-1 bg-white/10 rounded-full">3. Result</span>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Camera / Preview */}
      <div className="bg-black border border-white/10 rounded-2xl overflow-hidden mb-6 aspect-[4/3] relative flex items-center justify-center">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
            {!cameraActive && (
              <div className="flex flex-col items-center gap-3 text-gray-600">
                <div className="text-6xl">📷</div>
                <p className="text-sm">Click &quot;Open Camera&quot; to begin</p>
              </div>
            )}
          </>
        ) : (
          <>
            <img
              src={capturedImage}
              alt="Captured photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-green-500/90 text-white text-xs px-3 py-1 rounded-full font-medium">
              ✓ Photo Ready
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {!cameraActive && !capturedImage && (
          <Button onClick={startCamera} className="w-full sm:w-auto">
            Open Camera
          </Button>
        )}
        {cameraActive && (
          <>
            <Button variant="secondary" onClick={stopCamera} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={capturePhoto} className="w-full sm:w-auto">
              📸 Capture Photo
            </Button>
          </>
        )}
        {capturedImage && (
          <>
            <Button variant="secondary" onClick={retake} className="w-full sm:w-auto">
              Retake
            </Button>
            <Button onClick={handleContinue} disabled={uploading} className="w-full sm:w-auto">
              {uploading ? <LoadingSpinner size="sm" label="Uploading..." inline /> : 'Continue →'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default CameraCapture
