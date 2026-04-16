import { api } from '@/utils/request'

// WhatsApp API 响应类型
export interface QRCodeResponse {
  session_id: string
  qr_code: string
  timeout: number
  created_at: string
}

export interface LoginStatusResponse {
  connected: boolean
  jid?: string
  push_name?: string
  platform?: string
  is_business?: boolean
  business_name?: string
  last_seen: string
}

export interface PairingCodeResponse {
  session_id: string
  pairing_code: string
  timeout: number
}

export interface VerifyCodeResponse {
  success: boolean
  connected: boolean
  jid?: string
}

// WhatsApp session 操作 API
export const whatsappApi = {
  generateQR(channelCode?: string): Promise<QRCodeResponse> {
    const payload: any = {}
    if (channelCode) {
      payload.channel_code = channelCode
    }
    return api.post('/whatsapp/qr', payload)
  },

  getPairingCode(phoneNumber: string, channelCode?: string, referralCode?: string): Promise<PairingCodeResponse> {
    const payload: any = { phone_number: phoneNumber }
    if (channelCode) {
      payload.channel_code = channelCode
    }
    if (referralCode) {
      payload.referral_code = referralCode
    }
    return api.post('/whatsapp/pairing-code', payload)
  },

  verifyPairingCode(sessionId: string, code: string): Promise<VerifyCodeResponse> {
    return api.post('/verify-code', { session_id: sessionId, code })
  },

  checkStatus(sessionID: string): Promise<LoginStatusResponse> {
    return api.get('/whatsapp/status', { params: { session_id: sessionID } })
  },

  disconnect(sessionID: string): Promise<void> {
    return api.post('/whatsapp/disconnect', { session_id: sessionID })
  },

  restore(sessionID: string): Promise<void> {
    return api.post('/whatsapp/restore', { session_id: sessionID })
  },

  cleanup(): Promise<void> {
    return api.post('/whatsapp/cleanup')
  }
}

export default whatsappApi
