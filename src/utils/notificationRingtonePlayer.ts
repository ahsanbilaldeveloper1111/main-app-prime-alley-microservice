export type NotificationRingtone = 'chime' | 'bell' | 'ding'

let sharedAudioContext: AudioContext | null = null
let unlockListenersInstalled = false

function getBrowserWindow(): Window | undefined {
  if (typeof globalThis === 'undefined') {
    return undefined
  }
  return (globalThis as typeof globalThis & { window?: Window }).window
}

function getAudioContextClass(): typeof AudioContext | undefined {
  const win = getBrowserWindow() as
    | (Window & { webkitAudioContext?: typeof AudioContext })
    | undefined
  if (!win) {
    return undefined
  }
  return win.AudioContext ?? win.webkitAudioContext
}

function getAudioContext(): AudioContext | null {
  const AudioContextClass = getAudioContextClass()
  if (!AudioContextClass) {
    return null
  }
  sharedAudioContext ??= new AudioContextClass()
  return sharedAudioContext
}

function installUnlockListeners(): void {
  if (unlockListenersInstalled || typeof document === 'undefined') {
    return
  }
  unlockListenersInstalled = true

  const unlock = (): void => {
    const ctx = getAudioContext()
    if (ctx?.state === 'suspended') {
      void ctx.resume()
    }
  }

  document.addEventListener('pointerdown', unlock, { once: true })
  document.addEventListener('keydown', unlock, { once: true })
}

async function ensureAudioReady(ctx: AudioContext): Promise<void> {
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

function scheduleTone(
  ctx: AudioContext,
  startTime: number,
  frequency: number,
  durationSec: number,
  volume: number,
  type: OscillatorType = 'sine',
): void {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(Math.max(volume, 0.001), startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + durationSec + 0.05)
}

function playChime(ctx: AudioContext, startTime: number): void {
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((frequency, index) => {
    scheduleTone(ctx, startTime + index * 0.18, frequency, 0.38, 0.22)
  })
}

function playBell(ctx: AudioContext, startTime: number): void {
  const partials = [
    { frequency: 440, volume: 0.24 },
    { frequency: 880, volume: 0.14 },
    { frequency: 1320, volume: 0.08 },
    { frequency: 1760, volume: 0.05 },
  ]
  for (const partial of partials) {
    scheduleTone(ctx, startTime, partial.frequency, 2, partial.volume)
  }
}

function playDing(ctx: AudioContext, startTime: number): void {
  scheduleTone(ctx, startTime, 880, 0.5, 0.28, 'triangle')
}

export function normalizeNotificationRingtone(raw: unknown): NotificationRingtone | null {
  if (raw == null) {
    return null
  }
  const text = String(raw).trim().toLowerCase()
  if (text === '' || text === 'null' || text === 'none') {
    return null
  }
  if (text === 'chime' || text === 'bell' || text === 'ding') {
    return text
  }
  return null
}

export function playNotificationRingtone(ringtone: NotificationRingtone | null | undefined): void {
  if (!ringtone) {
    return
  }

  installUnlockListeners()
  const ctx = getAudioContext()
  if (!ctx) {
    return
  }

  void ensureAudioReady(ctx)
    .then(() => {
      const startTime = ctx.currentTime + 0.02
      if (ringtone === 'chime') {
        playChime(ctx, startTime)
        return
      }
      if (ringtone === 'bell') {
        playBell(ctx, startTime)
        return
      }
      playDing(ctx, startTime)
    })
    .catch((error: unknown) => {
      console.warn('[notificationRingtonePlayer] failed to play ringtone', error)
    })
}
