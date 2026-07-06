import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'

const API_URL = 'http://localhost:8000'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function History() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/try-on/history`)
      setResults(res.data)
    } catch {
      setError('Failed to load history. Make sure the backend is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Try-On History</h1>
          <p className="text-gray-400">All previous virtual try-on sessions.</p>
        </div>
        <Link to="/camera">
          <Button>New Try-On</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner label="Loading history..." />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <div className="text-6xl mb-4">🕐</div>
          <p className="text-lg font-medium">No try-on history yet.</p>
          <p className="text-sm mt-2 text-gray-600">
            Complete your first virtual try-on to see results here.
          </p>
          <Link to="/camera">
            <Button className="mt-6">Start Your First Try-On</Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="text-gray-500 text-sm mb-6">{results.length} session{results.length !== 1 ? 's' : ''} recorded</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item) => (
              <Card key={item.id}>
                {/* Generated image */}
                <div className="aspect-[3/4] overflow-hidden bg-gray-900">
                  <img
                    src={item.generated_image_url}
                    alt="Try-on result"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4">
                  {/* Status + ID */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        item.status === 'completed'
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-yellow-900/40 text-yellow-400'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-gray-600 text-xs">#{item.id}</span>
                  </div>

                  {/* Cloth name */}
                  {item.cloth_name && (
                    <p className="text-white text-sm font-medium mb-1 truncate">
                      {item.cloth_name}
                    </p>
                  )}

                  {/* Date */}
                  <p className="text-gray-500 text-xs mb-3">{formatDate(item.created_at)}</p>

                  {/* Thumbnails */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="text-gray-600 text-xs mb-1">User</p>
                      <img
                        src={item.user_photo_url}
                        alt="User"
                        className="w-full h-14 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-600 text-xs mb-1">Outfit</p>
                      <img
                        src={item.cloth_image_url}
                        alt="Outfit"
                        className="w-full h-14 object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default History
