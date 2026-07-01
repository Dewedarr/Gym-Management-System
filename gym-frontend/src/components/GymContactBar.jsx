import { useState } from 'react'
import { Phone, MapPin, Clock, ChevronDown } from 'lucide-react'
import { useGymInfo } from '../context/GymInfoContext'

export default function GymContactBar() {
  const { gymInfo: info } = useGymInfo()
  const [openBranch, setOpenBranch] = useState(false)

  if (!info) return null

  let branches = []
  try { branches = info.branchesJson ? JSON.parse(info.branchesJson) : [] } catch {}

  return (
    <div className="bg-gym-card border-b border-gym-border px-4 py-2 relative z-20">
      <div className="flex items-center gap-3 md:gap-6 text-xs text-gym-muted flex-wrap overflow-x-auto">

        {info.phone && (
          <a href={`tel:${info.phone}`} className="flex items-center gap-1.5 hover:text-gym-primary transition-colors">
            <Phone size={12} /> {info.phone}
          </a>
        )}

        {info.workingHours && (
          <span className="flex items-center gap-1.5">
            <Clock size={12} /> {info.workingHours}
          </span>
        )}

        {/* Branches */}
        {branches.length > 0 ? (
          <div className="relative">
            <button
              onClick={() => setOpenBranch(o => !o)}
              className="flex items-center gap-1.5 hover:text-gym-primary transition-colors"
            >
              <MapPin size={12} />
              {branches.length === 1 ? branches[0].name : `${branches.length} branches`}
              <ChevronDown size={11} className={`transition-transform ${openBranch ? 'rotate-180' : ''}`} />
            </button>

            {openBranch && (
              <div className="absolute top-full right-0 mt-1 bg-gym-card border border-gym-border rounded-xl shadow-xl min-w-56 py-2 z-50">
                {branches.map((br, i) => (
                  <div key={i} className="px-4 py-2 hover:bg-gym-bg">
                    <div className="font-semibold text-gym-text text-xs">{br.name}</div>
                    {br.address && <div className="text-gym-muted text-xs mt-0.5">{br.address}</div>}
                    {br.mapsUrl && (
                      <a href={br.mapsUrl} target="_blank" rel="noopener noreferrer"
                        className="text-gym-primary text-xs mt-1 inline-block hover:underline">
                        View on Map ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : info.address ? (
          <span className="flex items-center gap-1.5">
            <MapPin size={12} /> {info.address}
            {info.googleMapsUrl && (
              <a href={info.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                className="hover:text-gym-primary transition-colors underline underline-offset-2 ml-1">
                Map ↗
              </a>
            )}
          </span>
        ) : null}

      </div>
    </div>
  )
}
