import { Loader2 } from 'lucide-react'
import { useGymInfo } from '../../context/GymInfoContext'

export default function TraineeBranches() {
  const { gymInfo: info, loading } = useGymInfo()

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={36} className="animate-spin text-gym-primary" /></div>
  if (!info) return null

  const gymName = info.gymName || 'GymPro'

  let branches = []
  try { branches = info.branchesJson ? JSON.parse(info.branchesJson) : [] } catch {}

  const yearsExp = info.yearsExperience || 0

  const aboutParagraph = info.aboutText ||
    `${gymName} is more than just a gym — it's your destination towards a better version of yourself. We believe real transformation starts from within, completed through willpower and proper training. Our team of professional coaches is always ready to help you achieve your goals in the fastest time with the best results.`

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gym-text">{gymName}</h1>
        <p className="text-gym-muted text-sm mt-1">Our branches and contact info</p>
      </div>

      {/* About */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gym-text text-lg">About Us</h2>
        <p className="text-gym-muted leading-relaxed text-sm">{aboutParagraph}</p>

        {yearsExp > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { val: `+${yearsExp}`, label: 'Years Experience' },
              { val: '24/7', label: 'Ongoing Support' },
              { val: '100%', label: 'Committed to Results' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl text-center py-5" style={{ background: 'rgb(var(--gym-bg))' }}>
                <div className="text-3xl font-black text-gym-primary">{s.val}</div>
                <div className="text-xs text-gym-muted mt-1 tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Branches */}
      {branches.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-bold text-gym-text text-lg">
            {branches.length === 1 ? 'Our Location' : 'Our Branches'}
          </h2>
          <div className="space-y-3">
            {branches.map((br, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgb(var(--gym-bg))' }}>
                <div className="w-9 h-9 rounded-xl bg-gym-primary/10 flex items-center justify-center flex-shrink-0 text-gym-primary font-black text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gym-text">{br.name}</div>
                  {br.address && <div className="text-gym-muted text-sm mt-0.5">📍 {br.address}</div>}
                  {br.mapsUrl && (
                    <a href={br.mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gym-primary text-xs mt-2 hover:underline font-semibold">
                      View on Map ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gym-text text-lg">Contact Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {info.phone && (
            <a href={`tel:${info.phone}`} className="no-underline">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gym-border hover:border-gym-primary transition-colors" style={{ background: 'rgb(var(--gym-bg))' }}>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl flex-shrink-0">📞</div>
                <div>
                  <div className="text-xs text-gym-muted mb-0.5">Call Us</div>
                  <div className="font-bold text-gym-text">{info.phone}</div>
                </div>
              </div>
            </a>
          )}

          {info.whatsApp && (
            <a href={`https://wa.me/${info.whatsApp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="no-underline">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gym-border hover:border-gym-primary transition-colors" style={{ background: 'rgb(var(--gym-bg))' }}>
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-xl flex-shrink-0">💬</div>
                <div>
                  <div className="text-xs text-gym-muted mb-0.5">WhatsApp</div>
                  <div className="font-bold text-gym-text">{info.whatsApp}</div>
                </div>
              </div>
            </a>
          )}

          {info.workingHours && (
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gym-border" style={{ background: 'rgb(var(--gym-bg))' }}>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl flex-shrink-0">🕐</div>
              <div>
                <div className="text-xs text-gym-muted mb-0.5">Working Hours</div>
                <div className="font-bold text-gym-text">{info.workingHours}</div>
              </div>
            </div>
          )}

          {info.email && (
            <a href={`mailto:${info.email}`} className="no-underline">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gym-border hover:border-gym-primary transition-colors" style={{ background: 'rgb(var(--gym-bg))' }}>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl flex-shrink-0">✉️</div>
                <div>
                  <div className="text-xs text-gym-muted mb-0.5">Email</div>
                  <div className="font-bold text-gym-text text-sm">{info.email}</div>
                </div>
              </div>
            </a>
          )}

        </div>
      </div>

    </div>
  )
}
