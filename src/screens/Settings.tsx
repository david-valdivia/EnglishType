import { useEffect, useRef, useState } from 'react'
import { CheckGlyph, CloseGlyph, SpeakerGlyph, TrashGlyph } from '../components/Glyphs'
import { KOKORO_VOICES, VOICE_SAMPLE } from '../lib/kokoroVoices'
import {
  cancelKokoroLoad,
  clearStored,
  forgetKokoro,
  kokoroPossible,
  kokoroReady,
  loadKokoro,
  speakKokoro,
  storedBytes,
  webgpuAvailable,
  type Device,
  type LoadProgress,
} from '../lib/kokoro'
import type { VoiceSettings } from '../store/voice'

const mb = (bytes: number) => `${Math.round(bytes / 1_000_000)} MB`

/**
 * Which voice reads the words out.
 *
 * Two cards to choose between, and nothing else unless it is needed: the
 * download button exists only while there is something to download, and where
 * the model runs is a question almost nobody should have to answer, so it
 * waits under "Advanced".
 */
export function Settings({
  settings,
  onChange,
  onClose,
}: {
  settings: VoiceSettings
  onChange: (settings: VoiceSettings) => void
  onClose: () => void
}) {
  const [stored, setStored] = useState<number | null>(null)
  const [progress, setProgress] = useState<LoadProgress | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>(
    kokoroReady() ? 'ready' : 'idle',
  )
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [advanced, setAdvanced] = useState(false)

  const measure = () => void storedBytes().then(setStored)
  useEffect(measure, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const possible = kokoroPossible()
  const downloaded = (stored ?? 0) > 0
  const onKokoro = settings.engine === 'kokoro'

  /** Set while stopping, so the refusal that follows is not read as a fault. */
  const stopping = useRef(false)

  const use = () => {
    if (state === 'ready') return onChange({ ...settings, engine: 'kokoro' })

    stopping.current = false
    setState('loading')
    setProgress(null)
    loadKokoro(settings.device, setProgress).then(
      () => {
        setState('ready')
        measure()
        onChange({ ...settings, engine: 'kokoro' })
      },
      () => setState(stopping.current ? 'idle' : 'failed'),
    )
  }

  const stop = () => {
    stopping.current = true
    cancelKokoroLoad()
    setState('idle')
  }

  const preview = (voice: string) => {
    onChange({ ...settings, voice })
    if (!kokoroReady() || previewing) return
    setPreviewing(voice)
    speakKokoro(VOICE_SAMPLE, voice, settings.device).finally(() => setPreviewing(null))
  }

  const clear = () => {
    forgetKokoro()
    void clearStored().then(() => {
      setStored(0)
      setState('idle')
      onChange({ ...settings, engine: 'system' })
    })
  }

  const percent = progress?.fraction === undefined ? null : Math.round(progress.fraction * 100)

  return (
    <div className="overlay settings-overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Voices"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-head">
          <h2>Voices</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            <CloseGlyph />
          </button>
        </div>

        <div className="sheet-body">
          <button
            className={`voice-engine ${onKokoro ? '' : 'on'}`}
            onClick={() => onChange({ ...settings, engine: 'system' })}
          >
            <span className="engine-name">
              System voice
              {!onKokoro && <CheckGlyph size={16} />}
            </span>
            <span className="engine-note">
              The one your browser already has. Instant, and nothing to download.
            </span>
          </button>

          <div className={`voice-engine block ${onKokoro ? 'on' : ''}`}>
            {/* Selectable as a whole once the model is here. Before that the
                only thing to do with it is fetch it. */}
            <button
              className="engine-pick"
              disabled={!possible || (!downloaded && state !== 'ready')}
              onClick={use}
            >
              <span className="engine-name">
                Kokoro (AI in the browser)
                {onKokoro && <CheckGlyph size={16} />}
              </span>
              <span className="engine-note">
                An open speech model that runs on this machine: no key, no account, and the
                text never leaves the computer. English only.
              </span>
            </button>

            {!possible ? (
              <p className="engine-warn">
                This browser cannot keep a model of this size, so Kokoro is not available here.
              </p>
            ) : state === 'loading' ? (
              <div className="download">
                <div className="bar">
                  <i style={{ width: `${percent ?? 5}%` }} />
                </div>
                <p className="engine-note">
                  {percent === null
                    ? 'Starting the download…'
                    : percent === 100
                      ? 'Getting it ready…'
                      : `Downloading… ${percent}%`}
                </p>
                <button className="btn ghost small" onClick={stop}>
                  Cancel
                </button>
              </div>
            ) : downloaded ? (
              <p className="engine-note kept">{mb(stored ?? 0)} kept on this device</p>
            ) : (
              <button className="btn primary" onClick={use}>
                Download it (326 MB)
              </button>
            )}

            {state === 'failed' && (
              <p className="engine-warn">
                The model could not be loaded. Check the connection and try again.
              </p>
            )}
          </div>

          {possible && onKokoro && (
            <>
              <h3 className="voices-head">
                Voice
                <small>
                  Tap one to hear it. The three best of the twenty-eight Kokoro ships with,
                  by its author's own grading.
                </small>
              </h3>
              <ul className="voice-list">
                {KOKORO_VOICES.map((voice) => (
                  <li key={voice.id}>
                    <button
                      className={`voice ${settings.voice === voice.id ? 'on' : ''}`}
                      onClick={() => preview(voice.id)}
                      disabled={previewing !== null && previewing !== voice.id}
                    >
                      <span className="voice-name">{voice.name}</span>
                      <span className="voice-meta">
                        {voice.accent} · {voice.gender} · {voice.grade}
                      </span>
                      {previewing === voice.id ? (
                        <span className="spinner small" aria-hidden />
                      ) : (
                        <SpeakerGlyph size={15} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Only ever about Kokoro: with the system voice there is nothing
              here to advance. */}
          {possible && onKokoro && (
            <div className="advanced">
              <button
                className="advanced-toggle"
                aria-expanded={advanced}
                onClick={() => setAdvanced((was) => !was)}
              >
                {advanced ? '▾' : '▸'} Advanced settings
              </button>

              {advanced && (
                <div className="advanced-body">
                  <div className="device-row" role="group" aria-label="Where to run it">
                    {(['webgpu', 'wasm'] as Device[]).map((device) => (
                      <button
                        key={device}
                        className={`chip ${settings.device === device ? 'on' : ''}`}
                        disabled={device === 'webgpu' && !webgpuAvailable()}
                        onClick={() => onChange({ ...settings, device })}
                      >
                        {device === 'webgpu' ? 'GPU' : 'CPU'}
                        <small>
                          {device === 'webgpu'
                            ? webgpuAvailable()
                              ? '~1 s a sentence'
                              : 'not available here'
                            : '~40 s a sentence'}
                        </small>
                      </button>
                    ))}
                  </div>

                  {downloaded && (
                    <button className="btn ghost small" onClick={clear}>
                      <TrashGlyph />
                      Clear cache ({mb(stored ?? 0)})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
