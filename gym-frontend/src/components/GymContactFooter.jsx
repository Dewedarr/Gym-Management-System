import { useGymInfo } from '../context/GymInfoContext'

export default function GymContactFooter() {
  const { gymInfo: info } = useGymInfo()

  if (!info) return null

  const gymName = (info.gymName || 'GymPro').toUpperCase()
  const year = new Date().getFullYear()

  return (
    <div style={{
      marginTop: 64,
      borderTop: '1px solid var(--sep, #e5e5e5)',
      background: 'rgb(var(--gym-card))',
    }}>
      {/* Main contact section */}
      <div style={{ padding: '56px 32px 40px', maxWidth: 900, margin: '0 auto' }}>

        {/* Headline */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <p style={{
            color: 'var(--gym-primary, #ff7800)', fontSize: 10, fontWeight: 800,
            letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12
          }}>Contact Us</p>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900,
            color: 'rgb(var(--gym-text))', lineHeight: 1.1, letterSpacing: -1
          }}>
            {gymName}
          </h2>
          {info.aboutText && (
            <p style={{
              color: 'rgb(var(--gym-muted))', fontSize: 14, marginTop: 12,
              maxWidth: 520, margin: '12px auto 0', lineHeight: 1.7
            }}>
              {info.aboutText}
            </p>
          )}
        </div>

        {/* Stats row */}
        {info.yearsExperience > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 1,
            background: 'rgb(var(--gym-border))',
            marginBottom: 48,
          }}>
            {[
              { val: info.yearsExperience, label: 'Years Experience' },
              { val: '24/7', label: 'Ongoing Support' },
              { val: '100%', label: 'Guaranteed Results' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, background: 'rgb(var(--gym-card))',
                padding: '28px 16px', textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 36, fontWeight: 900,
                  color: 'rgb(var(--gym-text))', lineHeight: 1
                }}>{s.val}</div>
                <div style={{
                  fontSize: 11, color: 'rgb(var(--gym-muted))',
                  marginTop: 6, letterSpacing: 1, textTransform: 'uppercase'
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Contact cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>

          {info.phone && (
            <a href={`tel:${info.phone}`} style={{ textDecoration: 'none' }}>
              <div className="contact-card" style={{
                border: '1px solid rgb(var(--gym-border))',
                borderRadius: 16, padding: '24px 20px',
                display: 'flex', flexDirection: 'column', gap: 10,
                transition: 'all 0.2s', cursor: 'pointer',
                background: 'rgb(var(--gym-bg))',
              }}>
                <span style={{ fontSize: 24 }}>📞</span>
                <div style={{ fontSize: 11, color: 'rgb(var(--gym-muted))', letterSpacing: 1 }}>Call Us</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'rgb(var(--gym-text))' }}>{info.phone}</div>
              </div>
            </a>
          )}

          {info.whatsApp && (
            <a href={`https://wa.me/${info.whatsApp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="contact-card" style={{
                border: '1px solid rgb(var(--gym-border))',
                borderRadius: 16, padding: '24px 20px',
                display: 'flex', flexDirection: 'column', gap: 10,
                transition: 'all 0.2s', cursor: 'pointer',
                background: 'rgb(var(--gym-bg))',
              }}>
                <span style={{ fontSize: 24 }}>💬</span>
                <div style={{ fontSize: 11, color: 'rgb(var(--gym-muted))', letterSpacing: 1 }}>WhatsApp</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'rgb(var(--gym-text))' }}>{info.whatsApp}</div>
              </div>
            </a>
          )}

          {info.workingHours && (
            <div style={{
              border: '1px solid rgb(var(--gym-border))',
              borderRadius: 16, padding: '24px 20px',
              display: 'flex', flexDirection: 'column', gap: 10,
              background: 'rgb(var(--gym-bg))',
            }}>
              <span style={{ fontSize: 24 }}>🕐</span>
              <div style={{ fontSize: 11, color: 'rgb(var(--gym-muted))', letterSpacing: 1 }}>Working Hours</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'rgb(var(--gym-text))' }}>{info.workingHours}</div>
            </div>
          )}

          {info.email && (
            <a href={`mailto:${info.email}`} style={{ textDecoration: 'none' }}>
              <div className="contact-card" style={{
                border: '1px solid rgb(var(--gym-border))',
                borderRadius: 16, padding: '24px 20px',
                display: 'flex', flexDirection: 'column', gap: 10,
                transition: 'all 0.2s', cursor: 'pointer',
                background: 'rgb(var(--gym-bg))',
              }}>
                <span style={{ fontSize: 24 }}>✉️</span>
                <div style={{ fontSize: 11, color: 'rgb(var(--gym-muted))', letterSpacing: 1 }}>Email</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'rgb(var(--gym-text))' }}>{info.email}</div>
              </div>
            </a>
          )}

        </div>
      </div>

      {/* Footer bar */}
      <div style={{
        borderTop: '1px solid rgb(var(--gym-border))',
        padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8
      }}>
        <span style={{ fontSize: 11, color: 'rgb(var(--gym-muted))' }}>
          © {year} {gymName} — All Rights Reserved
        </span>
        {info.address && (
          <span style={{ fontSize: 11, color: 'rgb(var(--gym-muted))' }}>
            📍 {info.address}
          </span>
        )}
      </div>

      <style>{`
        .contact-card:hover {
          border-color: #ff7800 !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}
