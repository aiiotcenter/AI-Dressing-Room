import React, { useRef, useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:8000'

const TOP_STEPS = [
  { n: 1, label: 'Add Photo',      desc: 'Capture or upload your photo' },
  { n: 2, label: 'Choose Shirt',   desc: 'Pick one here or upload your own' },
  { n: 3, label: 'Generate',       desc: 'Create your virtual try-on' },
  { n: 4, label: 'Get Result',     desc: 'Preview and download your look' },
]

export default function TryOnStudio() {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const fileInputRef = useRef(null)
  const clothInputRef = useRef(null)

  const [cameraActive,  setCameraActive]  = useState(false)
  const [photoPreview,  setPhotoPreview]  = useState(null)
  const [photoUrl,      setPhotoUrl]      = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [clothes,       setClothes]       = useState([])
  const [selectedCloth, setSelectedCloth] = useState(null)
  const [uploadingCloth, setUploadingCloth] = useState(false)

  const [processing,  setProcessing]  = useState(false)
  const [result, setResult] = useState(null)
  const [error,  setError]  = useState('')

  useEffect(() => {
    fetchClothes()
    const savedPreview = localStorage.getItem('userPhotoPreview')
    const savedUrl     = localStorage.getItem('userPhotoUrl')
    if (savedPreview && savedUrl) {
      setPhotoPreview(savedPreview)
      setPhotoUrl(savedUrl)
    }
    return () => stopCamera()
  }, [])

  const fetchClothes = async () => {
    try {
      const res = await axios.get(`${API_URL}/clothes/today`)
      setClothes(res.data)
      if (res.data.length > 0) setSelectedCloth(res.data[0])
    } catch {
      setError('Could not load clothes collection.')
    }
  }

  const handleClothFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file for the shirt.')
      return
    }

    setUploadingCloth(true)
    setError('')
    setResult(null)

    const todayISO = new Date().toISOString().split('T')[0]
    const formData = new FormData()
    formData.append('name', file.name?.replace(/\.[^.]+$/, '') || 'Uploaded Shirt')
    formData.append('category', 'Top')
    formData.append('available_date', todayISO)
    formData.append('file', file)

    try {
      const res = await axios.post(`${API_URL}/clothes`, formData)
      const uploadedCloth = res.data
      setClothes((current) => [uploadedCloth, ...current])
      setSelectedCloth(uploadedCloth)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload shirt. Make sure the backend is running.')
    } finally {
      setUploadingCloth(false)
    }
  }

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      videoRef.current.srcObject = stream
      streamRef.current = stream
      setCameraActive(true)
    } catch {
      setError('Could not access camera. Please allow camera permissions.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  const capturePhoto = () => {
    const canvas = canvasRef.current
    const video  = videoRef.current
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setPhotoPreview(dataUrl)
    stopCamera()
    uploadPhoto(dataUrl)
  }

  const readFileAsDataUrl = (file) => (
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  )

  const uploadPhotoBlob = async (blob, filename, previewDataUrl) => {
    setUploadingPhoto(true)
    try {
      const fd   = new FormData()
      fd.append('file', blob, filename)
      const res = await axios.post(`${API_URL}/upload-user-photo`, fd)
      setPhotoUrl(res.data.url)
      localStorage.setItem('userPhotoUrl',     res.data.url)
      localStorage.setItem('userPhotoPreview', previewDataUrl)
    } catch {
      setPhotoUrl(null)
      localStorage.removeItem('userPhotoUrl')
      localStorage.removeItem('userPhotoPreview')
      setError('Failed to upload photo. Make sure the backend is running.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const uploadPhoto = async (dataUrl) => {
    const blob = await (await fetch(dataUrl)).blob()
    uploadPhotoBlob(blob, 'photo.jpg', dataUrl)
  }

  const handlePhotoFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }

    setError('')
    setResult(null)
    setPhotoUrl(null)
    stopCamera()

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setPhotoPreview(dataUrl)
      uploadPhotoBlob(file, file.name || 'uploaded-photo.jpg', dataUrl)
    } catch {
      setError('Could not read that image. Please try another photo.')
    }
  }

  const retakePhoto = () => {
    setPhotoPreview(null)
    setPhotoUrl(null)
    setResult(null)
    localStorage.removeItem('userPhotoUrl')
    localStorage.removeItem('userPhotoPreview')
    startCamera()
  }

  const handleTryOn = async () => {
    if (!photoUrl || !selectedCloth || processing) return
    setResult(null)
    setProcessing(true)
    setError('')

    try {
      const res = await axios.post(`${API_URL}/try-on`, {
        user_photo_url: photoUrl,
        cloth_id:       selectedCloth.id,
        provider_api_key: null,
      })
      setResult(res.data)
      setProcessing(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Try-on failed. Please try again.')
      setProcessing(false)
    }
  }

  const tryOnButtonLabel = () => {
    if (processing) return 'Processing...'
    if (!photoUrl) return 'Add Photo First'
    if (!selectedCloth) return 'Select or Upload Shirt First'
    return 'Try This Shirt'
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href     = result.generated_image_url
    a.download = 'virtual-try-on.jpg'
    a.target   = '_blank'
    a.click()
  }

  const handleTryAnother = () => {
    setResult(null)
    setProcessing(false)
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-[1440px] mx-auto">

      {/* ── Top step indicators ── */}
      <div className="flex items-start justify-center gap-6 mb-8 flex-wrap">
        {TOP_STEPS.map(s => (
          <div key={s.n} className="flex items-start gap-2 min-w-[110px]">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
              {s.n}
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{s.label}</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-tight">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl p-3 mb-5 text-sm text-center">
          {error}
        </div>
      )}

      {/* ── 4-panel grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ── Panel 1: Your Photo ── */}
        <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Your Photo</h3>
            <span className="text-gray-500">📷</span>
          </div>

          <div className="relative flex-1 bg-black rounded-xl overflow-hidden" style={{ minHeight: 260 }}>
            {photoPreview ? (
              <img src={photoPreview} alt="Your photo" className="w-full h-full object-cover absolute inset-0" />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className={`w-full h-full object-cover absolute inset-0 ${cameraActive ? 'block' : 'hidden'}`}
                />
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <div className="text-5xl mb-2">👤</div>
                    <p className="text-xs">No photo yet</p>
                  </div>
                )}
              </>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label="Upload Photo"
            className="hidden"
            onChange={handlePhotoFileChange}
          />

          <div className="mt-3 space-y-2">
            {!photoPreview && !cameraActive && (
              <>
                <button onClick={startCamera}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
                  📷 Open Camera
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
                  ⬆ Upload Photo
                </button>
              </>
            )}
            {cameraActive && (
              <>
                <button onClick={capturePhoto}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-opacity">
                  Capture
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
                  ⬆ Upload Instead
                </button>
              </>
            )}
            {photoPreview && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={retakePhoto}
                  className="py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
                  📷 Retake
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
                  ⬆ Upload New
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Panel 2: Select Outfit ── */}
        <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Select or Upload Shirt</h3>
            <span className="text-gray-500">👕</span>
          </div>

          <input
            ref={clothInputRef}
            type="file"
            accept="image/*"
            aria-label="Upload Shirt"
            className="hidden"
            onChange={handleClothFileChange}
          />

          <div className="relative flex-1 bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: 260 }}>
            {selectedCloth ? (
              <img src={selectedCloth.image_url} alt={selectedCloth.name}
                className="w-full h-full object-contain p-3" />
            ) : (
              <div className="text-gray-600 text-center">
                <div className="text-4xl mb-2">👗</div>
                <p className="text-xs">Choose a built-in shirt or upload one</p>
              </div>
            )}
            {uploadingCloth && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {clothes.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {clothes.map(cloth => (
                <button key={cloth.id} onClick={() => setSelectedCloth(cloth)}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedCloth?.id === cloth.id ? 'border-purple-500' : 'border-white/10 hover:border-white/30'
                  }`}>
                  <img src={cloth.image_url} alt={cloth.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <button onClick={() => clothInputRef.current?.click()}
            disabled={uploadingCloth || processing}
            className="mt-3 w-full py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors">
            {uploadingCloth ? 'Uploading Shirt...' : 'Upload Your Shirt'}
          </button>

          <button onClick={handleTryOn}
            disabled={!photoUrl || !selectedCloth || processing}
            className="mt-3 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all">
            {tryOnButtonLabel()}
          </button>
        </div>

        {/* ── Panel 4: Virtual Try-On Result ── */}
        <div className="bg-gray-900/70 border border-white/10 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Virtual Try-On Result</h3>
            {result && (
              <span className="px-2 py-0.5 bg-green-600/20 border border-green-600/40 text-green-400 text-xs rounded-full font-medium">
                Generated
              </span>
            )}
          </div>

          <div className="relative flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: 260 }}>
            {result ? (
              <img src={result.generated_image_url} alt="Try-on result"
                className="w-full h-full object-cover absolute inset-0" />
            ) : processing ? (
              <div className="flex flex-col items-center gap-3 text-gray-600">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Generating...</p>
              </div>
            ) : (
              <div className="text-center text-gray-600">
                <div className="text-5xl mb-3">✨</div>
                <p className="text-xs">Result will appear here</p>
              </div>
            )}
          </div>

          {result && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={handleDownload}
                className="py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
                ⬇ Download
              </button>
              <button onClick={handleTryAnother}
                className="py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-opacity flex items-center justify-center gap-1.5">
                🔄 Try Another
              </button>
            </div>
          )}

          {!result && !processing && (
            <div className="mt-3 py-2.5 bg-white/5 rounded-xl text-center text-gray-600 text-xs">
              Waiting for try-on...
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
