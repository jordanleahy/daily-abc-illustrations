import { DailyPublishedStatus } from './dailyPublished';

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
  generatedAt?: string;
}