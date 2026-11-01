export type WhatsAppMode = 'auto' | 'local' | 'bridge' | 'direct';

export interface WhatsAppConfig {
  mode: WhatsAppMode;
  bridgeUrl: string;
  autoDetect: boolean;
}

const SETTINGS_KEY = 'aurea_whatsapp_config_v1';

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  mode: 'auto',
  bridgeUrl: 'https://huntress-pulp-trifle.ngrok-free.dev',
  autoDetect: true,
};

/**
 * Loads current WhatsApp configuration from localStorage with safe fallbacks.
 */
export function getWhatsAppConfig(): WhatsAppConfig {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.bridgeUrl || parsed.bridgeUrl.trim() === '') {
        parsed.bridgeUrl = DEFAULT_WHATSAPP_CONFIG.bridgeUrl;
      }
      return { ...DEFAULT_WHATSAPP_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load WhatsApp config from localStorage:', e);
  }
  return DEFAULT_WHATSAPP_CONFIG;
}

/**
 * Persists WhatsApp configuration updates.
 */
export function saveWhatsAppConfig(config: Partial<WhatsAppConfig>): WhatsAppConfig {
  try {
    const current = getWhatsAppConfig();
    const updated: WhatsAppConfig = { ...current, ...config };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save WhatsApp config to localStorage:', e);
    return DEFAULT_WHATSAPP_CONFIG;
  }
}

/**
 * Resolves the effective operational mode:
 * - 'local': Sends to local server via relative path or localhost.
 * - 'bridge': Sends to the clinic's local machine via secure tunnel URL from Vercel.
 * - 'direct': Opens WhatsApp chat directly with pre-filled text & image download.
 */
export function getEffectiveWhatsAppMode(config = getWhatsAppConfig()): 'local' | 'bridge' | 'direct' {
  if (config.mode !== 'auto') {
    return config.mode;
  }

  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocal) {
      return 'local';
    }

    if (config.bridgeUrl && config.bridgeUrl.trim().length > 7) {
      return 'bridge';
    }
  }

  return 'direct';
}

/**
 * Returns the base URL for WhatsApp API calls based on effective mode.
 */
export function getWhatsAppApiBaseUrl(config = getWhatsAppConfig()): string {
  const mode = getEffectiveWhatsAppMode(config);
  if (mode === 'bridge' && config.bridgeUrl) {
    return config.bridgeUrl.trim().replace(/\/+$/, '');
  }
  return '';
}
