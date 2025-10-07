import crypto from 'crypto'

export interface PayFastConfig {
  merchantId: string
  merchantKey: string
  passphrase: string
  sandbox: boolean
}

export interface PayFastPayment {
  merchant_id: string
  merchant_key: string
  return_url: string
  cancel_url: string
  notify_url: string
  name_first: string
  name_last: string
  email_address: string
  m_payment_id: string
  amount: string
  item_name: string
  item_description?: string
  custom_str1?: string
  custom_str2?: string
  custom_str3?: string
  signature: string
}

export class PayFastService {
  private config: PayFastConfig

  constructor(config: PayFastConfig) {
    this.config = config
  }

  private generateSignature(data: Record<string, string>): string {
    // Create parameter string
    const paramString = Object.keys(data)
      .filter(key => key !== 'signature' && data[key] !== '')
      .sort()
      .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
      .join('&')

    // Add passphrase if provided
    const stringToHash = this.config.passphrase 
      ? `${paramString}&passphrase=${encodeURIComponent(this.config.passphrase)}`
      : paramString

    // Generate MD5 hash
    return crypto.createHash('md5').update(stringToHash).digest('hex')
  }

  public createPayment(params: {
    orderId: string
    amount: number
    customerEmail: string
    customerName: string
    itemName: string
    itemDescription?: string
    returnUrl: string
    cancelUrl: string
    notifyUrl: string
  }): PayFastPayment {
    const [firstName, ...lastNameParts] = params.customerName.split(' ')
    const lastName = lastNameParts.join(' ') || firstName

    const paymentData = {
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      notify_url: params.notifyUrl,
      name_first: firstName,
      name_last: lastName,
      email_address: params.customerEmail,
      m_payment_id: params.orderId,
      amount: params.amount.toFixed(2),
      item_name: params.itemName,
      item_description: params.itemDescription || '',
      custom_str1: params.orderId, // Store order ID for reference
      custom_str2: 'mini-sixty60', // App identifier
      custom_str3: '', // Reserved for future use
    }

    // Remove empty values
    const cleanedData = Object.fromEntries(
      Object.entries(paymentData).filter(([_, value]) => value !== '')
    )

    // Generate signature
    const signature = this.generateSignature(cleanedData)

    return {
      ...cleanedData,
      signature,
    } as PayFastPayment
  }

  public getPaymentUrl(): string {
    return this.config.sandbox 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process'
  }

  public validateSignature(data: Record<string, string>): boolean {
    const receivedSignature = data.signature
    if (!receivedSignature) return false

    const calculatedSignature = this.generateSignature(data)
    return receivedSignature === calculatedSignature
  }

  public validatePayment(data: Record<string, string>): {
    isValid: boolean
    orderId?: string
    paymentStatus?: string
    amount?: number
    error?: string
  } {
    try {
      // Validate signature
      if (!this.validateSignature(data)) {
        return { isValid: false, error: 'Invalid signature' }
      }

      // Validate merchant details
      if (data.merchant_id !== this.config.merchantId) {
        return { isValid: false, error: 'Invalid merchant ID' }
      }

      // Extract payment details
      const orderId = data.m_payment_id || data.custom_str1
      const paymentStatus = data.payment_status
      const amount = parseFloat(data.amount_gross || '0')

      return {
        isValid: true,
        orderId,
        paymentStatus,
        amount,
      }
    } catch (error) {
      return { isValid: false, error: 'Validation error' }
    }
  }

  public createPaymentLink(params: {
    orderId: string
    amount: number
    customerEmail: string
    customerName: string
    itemName: string
    itemDescription?: string
    returnUrl: string
    cancelUrl: string
    notifyUrl: string
  }): string {
    const payment = this.createPayment(params)
    const paymentUrl = this.getPaymentUrl()
    
    const queryParams = new URLSearchParams(payment as any).toString()
    return `${paymentUrl}?${queryParams}`
  }

  // Helper method for delta payments (weight adjustments)
  public createDeltaPayment(params: {
    originalOrderId: string
    deltaAmount: number
    customerEmail: string
    customerName: string
    returnUrl: string
    cancelUrl: string
    notifyUrl: string
  }): PayFastPayment {
    const deltaOrderId = `${params.originalOrderId}-DELTA-${Date.now()}`
    
    return this.createPayment({
      orderId: deltaOrderId,
      amount: Math.abs(params.deltaAmount),
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      itemName: `Weight Adjustment - Order #${params.originalOrderId}`,
      itemDescription: `Additional charge for final weight difference`,
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
      notifyUrl: params.notifyUrl,
    })
  }
}

// Singleton instance
let payFastService: PayFastService | null = null

export function getPayFastService(): PayFastService {
  if (!payFastService) {
    const config: PayFastConfig = {
      merchantId: process.env.PAYFAST_MERCHANT_ID!,
      merchantKey: process.env.PAYFAST_MERCHANT_KEY!,
      passphrase: process.env.PAYFAST_PASSPHRASE!,
      sandbox: process.env.PAYFAST_SANDBOX === 'true',
    }

    payFastService = new PayFastService(config)
  }

  return payFastService
}

// PayFast payment status constants
export const PAYFAST_STATUS = {
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const

export type PayFastStatus = typeof PAYFAST_STATUS[keyof typeof PAYFAST_STATUS]
