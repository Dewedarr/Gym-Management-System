import { useRef } from 'react'
import { Camera, User } from 'lucide-react'
import { validateImageFile, fileToBase64 } from '../services/validation'
import toast from 'react-hot-toast'

export default function PhotoUpload({ currentImage, onUpload, size = 'md' }) {
  const ref = useRef()

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { toast.error(err); return }
    const base64 = await fileToBase64(file)
    onUpload(base64)
  }

  return (
    <div className="relative inline-block">
      <div className={`${sizes[size]} rounded-2xl overflow-hidden bg-gym-bg border-2 border-gym-border flex items-center justify-center`}>
        {currentImage ? (
          <img src={currentImage} alt="profile" className="w-full h-full object-cover" />
        ) : (
          <User size={size === 'lg' ? 40 : size === 'md' ? 28 : 20} className="text-gym-muted" />
        )}
      </div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="absolute bottom-0 left-0 w-7 h-7 bg-gym-primary rounded-full flex items-center justify-center hover:bg-gym-primary-dark transition-colors shadow-lg"
      >
        <Camera size={13} className="text-white" />
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
