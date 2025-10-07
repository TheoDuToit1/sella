import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatWeight(grams: number): string {
  if (grams < 1000) {
    return `${grams}g`
  }
  return `${(grams / 1000).toFixed(1)}kg`
}

export function calculateDeliveryFee(distance: number, baseFee: number, perKmFee: number): number {
  return baseFee + (distance * perKmFee)
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `MS60-${timestamp}-${random}`.toUpperCase()
}

export function isValidSouthAfricanPhone(phone: string): boolean {
  // South African phone number validation
  const phoneRegex = /^(\+27|0)[1-9][0-9]{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function formatSouthAfricanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('27')) {
    return `+${cleaned}`
  }
  if (cleaned.startsWith('0')) {
    return `+27${cleaned.slice(1)}`
  }
  return `+27${cleaned}`
}

export function calculateVAT(amount: number, vatRate: number = 0.15): number {
  return amount * vatRate
}

export function calculateRewardPoints(amount: number, rate: number = 0.01): number {
  return Math.floor(amount * rate * 100) // Convert to points (1 point = 1 cent)
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getDeliveryTimeSlots(): string[] {
  const slots = []
  const now = new Date()
  const startHour = now.getHours() + 2 // 2 hours from now minimum
  
  for (let i = 0; i < 8; i++) {
    const hour = (startHour + i) % 24
    const nextHour = (hour + 1) % 24
    slots.push(`${hour.toString().padStart(2, '0')}:00 - ${nextHour.toString().padStart(2, '0')}:00`)
  }
  
  return slots
}
