// Egyptian phone: 01x-xxxxxxxx (11 digits starting with 010/011/012/015)
export const validatePhone = v => {
  if (!v) return null
  if (!/^01[0125][0-9]{8}$/.test(v))
    return 'Invalid phone number (e.g. 01012345678)'
  return null
}

export const validateEmail = v => {
  if (!v) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return 'Invalid email address'
  return null
}

export const validatePassword = v => {
  if (!v) return 'Password is required'
  if (v.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(v)) return 'Password must contain an uppercase letter'
  if (!/[0-9]/.test(v)) return 'Password must contain a number'
  return null
}

export const validateName = v => {
  if (!v?.trim()) return 'Name is required'
  if (v.trim().length < 2) return 'Name is too short'
  if (v.trim().length > 100) return 'Name is too long'
  return null
}

export const validateHeight = v => {
  if (!v && v !== 0) return null
  if (v < 100 || v > 250) return 'Height must be between 100 and 250 cm'
  return null
}

export const validateWeight = v => {
  if (!v && v !== 0) return null
  if (v < 20 || v > 300) return 'Weight must be between 20 and 300 kg'
  return null
}

export const validateAge = v => {
  if (!v && v !== 0) return null
  if (v < 5 || v > 100) return 'Age must be between 5 and 100'
  return null
}

export const validateRequired = (v, label = 'This field') => {
  if (!v?.toString().trim()) return `${label} is required`
  return null
}

export const validateMaxTrainees = v => {
  if (!v) return 'Max trainees is required'
  if (v < 1 || v > 100) return 'Must be between 1 and 100'
  return null
}

export const validatePrice = v => {
  if (v === null || v === undefined || v === '') return null
  if (v < 0) return 'Price must be a positive number'
  return null
}

// Returns object with field errors
export const runValidations = (rules) => {
  const errors = {}
  for (const [field, result] of Object.entries(rules)) {
    if (result) errors[field] = result
  }
  return errors
}

// ImageFile validation
export const validateImageFile = (file) => {
  if (!file) return null
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) return 'Image size is too large (max 5MB)'
  if (!file.type.startsWith('image/')) return 'File must be an image'
  return null
}

export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
})
