import { useState } from 'react'
import api from '../services/api'
import { Image, Video, Loader2, X } from 'lucide-react'

// endpoint: e.g. '/coach/exercises/5/media' or '/trainee/exercises/5/media'
export default function ExerciseMediaThumb({ exerciseId, mediaUrl, mediaType, hasMedia, endpoint }) {
  const [state, setState] = useState('idle') // idle | loading | loaded | error
  const [media, setMedia] = useState(mediaUrl ? { url: mediaUrl, type: mediaType } : null)
  const [modal, setModal] = useState(false)

  if (!hasMedia && !mediaUrl) return (
    <div className="w-full h-36 bg-gym-bg rounded-lg mb-3 flex items-center justify-center">
      <span className="text-gym-muted/30 text-4xl">💪</span>
    </div>
  )

  const load = async (e) => {
    e.stopPropagation()
    if (media) { setModal(true); return }
    setState('loading')
    try {
      const r = await api.get(endpoint)
      setMedia({ url: r.data.mediaUrl, type: r.data.mediaType })
      setState('loaded')
      setModal(true)
    } catch {
      setState('error')
    }
  }

  return (
    <>
      {/* Thumbnail / placeholder */}
      <div
        className="w-full h-36 rounded-lg mb-3 overflow-hidden cursor-pointer relative group bg-gym-bg flex items-center justify-center"
        onClick={load}
      >
        {media?.url && !media.url.startsWith('data:') ? (
          // URL media — show thumbnail directly
          media.type === 'video'
            ? <video src={media.url} className="w-full h-full object-cover" />
            : <img src={media.url} alt="exercise" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          // base64 or not loaded — show icon placeholder
          <div className="flex flex-col items-center gap-2 text-gym-muted/50">
            {mediaType === 'video' ? <Video size={32} /> : <Image size={32} />}
            <span className="text-xs">Click to view</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {state === 'loading'
            ? <Loader2 size={28} className="text-white animate-spin" />
            : mediaType === 'video'
              ? <Video size={28} className="text-white" />
              : <Image size={28} className="text-white" />
          }
        </div>
      </div>

      {/* Full Modal */}
      {modal && media && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(false)}
        >
          <button className="absolute top-4 left-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20 z-10">
            <X size={24} />
          </button>
          {media.type === 'video'
            ? <video src={media.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl" onClick={e => e.stopPropagation()} />
            : <img src={media.url} alt="exercise" className="max-w-full max-h-[85vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          }
        </div>
      )}
    </>
  )
}
