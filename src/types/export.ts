import { ProcessStatus } from './process';

export interface Export {
  id: string;
  user_id: string;
  content_type: 'book' | 'page';
  content_id: string;
  export_type: 'pdf' | 'epub' | 'image';
  export_status: ProcessStatus;
  export_url?: string;
  export_config?: Record<string, any>;
  file_size_bytes?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateExportRequest {
  content_type: 'book' | 'page';
  content_id: string;
  export_type: 'pdf' | 'epub' | 'image';
  export_config?: Record<string, any>;
}