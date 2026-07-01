export default function FieldError({ error }) {
  if (!error) return null
  return <p className="text-red-400 text-xs mt-1 flex items-center gap-1">⚠️ {error}</p>
}
