export type LeadQualificationStatus = 'HOT' | 'WARM' | 'COLD' | 'PENDING' | 'REACH_AGAIN' | 'OPT_OUT';

export interface LeadData {
  interest: string;
  buyer_type: string;
  property_type: string;
  budget: string;
  location: string;
  timeline: string;
  qualification_status: LeadQualificationStatus;
  stage_reached: number;
  notes?: string;
  updated_at?: string;
}

export type CallStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'speaking'
  | 'listening'
  | 'interrupted'
  | 'ended'
  | 'error';

export interface TranscriptTurn {
  id: string;
  role: 'agent' | 'user' | 'system';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  stage?: number;
  interrupted?: boolean;
}

export interface AgentPersona {
  id: string;
  name: string;
  gender: 'female' | 'male';
  language: 'tamil' | 'english' | 'hindi' | 'arabic' | 'bilingual';
  title: string;
  voiceId: string;
  tagline: string;
}

export function getAgentPersona(gender: 'female' | 'male', language: string): AgentPersona {
  const isTamil = language === 'tamil' || language === 'bilingual';
  if (gender === 'female') {
    return {
      id: isTamil ? 'lyka-tamil' : `lyka-${language}`,
      name: 'Lyka',
      gender: 'female',
      language: (language as any) || 'tamil',
      title: 'Senior Property Relationship Manager',
      voiceId: 'Kore',
      tagline: isTamil ? 'வணக்கம், நான் லைகா ரியல் எஸ்டேட்-ல இருந்து லைகா பேசுறேன்' : 'Hello, this is Lyka from Lyka Realty',
    };
  } else {
    return {
      id: isTamil ? 'vinakya-tamil' : `stark-${language}`,
      name: isTamil ? 'Vinakya Mahadev' : 'Stark',
      gender: 'male',
      language: (language as any) || 'tamil',
      title: 'Senior Property Portfolio Executive',
      voiceId: 'Puck',
      tagline: isTamil ? 'வணக்கம், நான் லைகா ரியல் எஸ்டேட்-ல இருந்து விநாயகா மகாதேவ் பேசறேன்' : 'Hello, this is Stark from Lyka Realty',
    };
  }
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  tone: string;
}

export interface LanguageOption {
  id: string;
  name: string;
  desc: string;
}

export interface AudioInputDeviceInfo {
  deviceId: string;
  label: string;
  isBluetooth: boolean;
  isDefault: boolean;
}

export type LeadCallStatus =
  | 'NOT_CALLED'
  | 'CALLING'
  | 'CONNECTED'
  | 'COMPLETED'
  | 'NO_ANSWER'
  | 'REACH_AGAIN'
  | 'FAILED';

export type LeadOutcome =
  | 'HOT'
  | 'WARM'
  | 'COLD'
  | 'OPT_OUT'
  | 'NO_ANSWER'
  | 'WRONG_NUMBER'
  | 'REACH_AGAIN'
  | 'PENDING';

export interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  consent: boolean;
  callStatus: LeadCallStatus;
  outcome?: LeadOutcome;
  interest?: string;
  buyerType?: string;
  propertyType?: string;
  budget?: string;
  location?: string;
  timeline?: string;
  lastCalledAt?: string;
  createdAt: string;
  notes?: string;
  isOptedOut?: boolean;
}

export interface CallRecord {
  callId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  startedAt: string;
  endedAt: string;
  duration: number; // in seconds
  callStatus: LeadCallStatus;
  interest: string;
  buyerType: string;
  propertyType: string;
  budget: string;
  location: string;
  timeline: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'opt_out';
  outcome: LeadOutcome;
  summary: string;
  transcript: TranscriptTurn[];
  nextAction: string;
}

export interface DashboardStats {
  totalLeads: number;
  callsMade: number;
  callsConnected: number;
  noAnswer: number;
  interested: number;
  notInterested: number;
  hot: number;
  warm: number;
  cold: number;
  reachAgain: number;
  optOut: number;
  // Rates in percentages
  answerRate: number;
  interestedRate: number;
  qualificationRate: number;
  hotLeadRate: number;
}

export interface ApiUsageData {

  model: string;
  tier: string;
  quotaStatus: 'HEALTHY' | 'WARNING' | 'EXHAUSTED';
  daily: {
    limit: number;
    used: number;
    remaining: number;
    percentUsed: number;
    nextRefillIso: string;
    secondsUntilRefill: number;
    refillPolicy: string;
  };
  rateLimit: {
    minuteLimit: number;
    usedThisMinute: number;
    remainingThisMinute: number;
    secondsUntilMinuteRefill: number;
    refillPolicy: string;
  };
  activity: {
    totalRequestsAllTime: number;
    totalSessions: number;
    totalTurns: number;
    totalToolCalls: number;
    totalAudioMinutesStreamed: number;
    audioSecondsSent: number;
    audioSecondsReceived: number;
    lastRequestTime: string;
  };
  timestamp: string;
}



