import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const GymInfoContext = createContext(null)

export function GymInfoProvider({ children }) {
  const cached = (() => { try { return JSON.parse(localStorage.getItem('gymInfo')) } catch { return null } })()
  const [gymInfo, setGymInfo] = useState(cached)
  const [heroMedia, setHeroMedia] = useState(localStorage.getItem('gymHeroMedia') || null)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    api.get('/payment/gym-info')
      .then(r => {
        setGymInfo(r.data)
        localStorage.setItem('gymInfo', JSON.stringify(r.data))
        if (r.data?.heroImageBase64) {
          setHeroMedia(r.data.heroImageBase64)
          localStorage.setItem('gymHeroMedia', r.data.heroImageBase64)
        } else {
          api.get('/payment/gym-hero')
            .then(h => {
              if (h.data?.heroImageBase64) {
                setHeroMedia(h.data.heroImageBase64)
                localStorage.setItem('gymHeroMedia', h.data.heroImageBase64)
              }
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <GymInfoContext.Provider value={{ gymInfo, heroMedia, loading }}>
      {children}
    </GymInfoContext.Provider>
  )
}

export function useGymInfo() {
  return useContext(GymInfoContext)
}
