export function buildWhatsAppLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}

export function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10
}
