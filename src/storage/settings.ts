const SETTINGS_STORAGE_KEY = 'lyka_realty_settings_v1';

export interface AppSettings {
  companyName: string;
  agentName: string;
  callingHoursStart: string;
  callingHoursEnd: string;
  killSwitchEnabled: boolean;
  autoGreetingEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Lyka Realty',
  agentName: 'Lyka',
  callingHoursStart: '09:00',
  callingHoursEnd: '20:00',
  killSwitchEnabled: false,
  autoGreetingEnabled: true,
};

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    if (parsed.companyName === 'Chennai Real Estate') {
      parsed.companyName = 'Lyka Realty';
    }
    if (parsed.agentName === 'Priya') {
      parsed.agentName = 'Lyka';
    }
    return parsed;
  } catch (err) {
    console.error('[Storage] Error reading settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('[Storage] Error saving settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function isWithinCallingHours(settings: AppSettings = getSettings()): boolean {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMins = currentHour * 60 + currentMin;

    const [startH, startM] = settings.callingHoursStart.split(':').map(Number);
    const [endH, endM] = settings.callingHoursEnd.split(':').map(Number);

    const startTotal = startH * 60 + (startM || 0);
    const endTotal = endH * 60 + (endM || 0);

    return currentTotalMins >= startTotal && currentTotalMins <= endTotal;
  } catch {
    return true;
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem('lyka_realty_leads_v1');
    localStorage.removeItem('lyka_realty_calls_v1');
    localStorage.removeItem('lyka_realty_settings_v1');
  } catch (err) {
    console.error('[Storage] Error clearing all data:', err);
  }
}
