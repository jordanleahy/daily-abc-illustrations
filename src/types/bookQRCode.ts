import { DailyPublishedStatus } from './dailyPublished';

export interface BookQRCode {
  id: string;
  book_id: string;
  user_id: string;
  daily_published_id?: string;
  public_url: string;
  qr_code_config: QRCodeConfig;
  generation_status: 'pending' | 'complete' | 'error';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QRCodeConfig {
  url: string;
  size: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

export type QRCodeDisplayStatus = DailyPublishedStatus | 'not_published';

export interface QRCodeData {
  qrCodeImage: string;
  publicUrl: string;
  status: QRCodeDisplayStatus;
  queuePosition?: number;
  isLoading: boolean;
  error?: string;
}