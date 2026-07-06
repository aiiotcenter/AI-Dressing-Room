import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'

const API_URL = 'http://localhost:8000'

function ClothesCollection() {
  const [clothes, setClothes] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('userPhotoUrl')) {
      navigate('/camera')
      return
    }
    fetchClothes()
  }, [navigate])

  const fetchClothes = async () => {
    try {
      const res = await axios.get(`${API_URL}/clothes/today`)
      setClothes(res.data)
    } catch {
      setError('Failed to load clothes. Make sure the backend is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (!selected) return
    localStorage.setItem('selectedClothId', selected.id)
    localStorage.setItem('selectedClothImage', selected.image_url)
    localStorage.setItem('selectedClothName', selected.name)
    navigate('/result')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Today&apos;s Collection</h1>
        <p className="text-gray-400">Select a clothing item you&apos;d like to try on.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8 text-xs text-gray-500">
        <span className="px-3 py-1 bg-green-600/40 text-green-400 rounded-full font-semibold">✓ Photo</span>
        <span className="w-8 h-px bg-gray-700" />
        <span className="px-3 py-1 bg-purple-600 text-white rounded-full font-semibold">2. Select Outfit</span>
        <span className="w-8 h-px bg-gray-700" />
        <span className="px-3 py-1 bg-white/10 rounded-full">3. Result</span>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner label="Loading today's collection..." />
        </div>
      ) : clothes.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <div className="text-6xl mb-4">👗</div>
          <p className="text-lg font-medium">No clothes available for today.</p>
          <p className="text-sm mt-2 text-gray-600">
            Open the Try-On Studio and upload a shirt directly.
          </p>
        </div>
      ) : (
        <>
          {selected && (
            <div className="mb-6 p-4 bg-purple-900/20 border border-purple-700/40 rounded-xl text-sm text-purple-300 flex items-center gap-2">
              <span>✓</span>
              <span>
                Selected: <strong>{selected.name}</strong> ({selected.category})
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
            {clothes.map((cloth) => (
              <Card
                key={cloth.id}
                onClick={() => setSelected(cloth)}
                selected={selected?.id === cloth.id}
              >
                <div className="aspect-[3/4] overflow-hidden bg-gray-900">
                  <img
                    src={cloth.image_url}
                    alt={cloth.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="text-white font-medium text-sm truncate">{cloth.name}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-purple-900/40 text-purple-300 text-xs rounded-full">
                    {cloth.category}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={() => navigate('/camera')}>
          ← Back
        </Button>
        <Button onClick={handleContinue} disabled={!selected}>
          Generate Try-On →
        </Button>
      </div>
    </div>
  )
}

export default ClothesCollection
