export interface CallLog {
  id: string;
  number: string;
  date: Date;
  duration: string;
  type: 'incoming' | 'outgoing' | 'missed';
}

export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
}

export interface CallControlsProps {
  isCallActive: boolean;
  onEndCall: () => void;
  onHold: () => void;
  onMerge: () => void;
  onTransfer: () => void;
}
