import { useEffect, useRef, useState } from 'react'
import { CheckGlyph, SettingsGlyph, SpeakerGlyph } from '../components/Glyphs'
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
  type LoadProgress,
} from '../lib/kokoro'
import { say } from '../lib/speech'
import type { VoiceSettings } from '../store/voice'

/**
 * Asked once, on the first visit: which voice should read the words out.
 *
 * Nobody can answer that from a description, so no step ends without having
 * heard the thing being chosen — and the last one says where to change it,
 * pointing at the button that will still be there tomorrow.
 */
type Step = 'choose' | 'listen' | 'download' | 'voice' | 'done'

export function Onboarding({
  settings,
  onChange,
  onFinish,
}: {
  settings: VoiceSettings
  onChange: (settings: VoiceSettings) => void
  onFinish: () => void
}) {
  const [step, setStep] = useState<Step>('choose')
  const [progress, setProgress] = useState<LoadProgress | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  /** Already on this device from a previous visit: then it is only a read. */
  const [onDisk, setOnDisk] = useState(false)
  const [ready, setReady] = useState(kokoroReady)
  /** True only when there was something to fetch, so the steps are numbered. */
  const [numbered, setNumbered] = useState(false)

  useEffect(() => {
    void storedBytes().then((bytes) => setOnDisk(bytes > 0))
  }, [])

  const possible = kokoroPossible()
  const percent = progress?.fraction === undefined ? null : Math.round(progress.fraction * 100)

  const chooseSystem = () => {
    onChange({ ...settings, engine: 'system' })
    setStep('listen')
  }

  /** Set while stopping, so the refusal that follows is not read as a fault. */
  const stopping = useRef(false)

  const load = (onDone?: () => void) => {
    setFailed(false)
    stopping.current = false
    setProgress({ loaded: 0, total: 0 })
    loadKokoro(settings.device, setProgress).then(
      () => {
        setReady(true)
        onChange({ ...settings, engine: 'kokoro' })
        onDone?.()
      },
      () => {
        if (stopping.current) setProgress(null)
        else setFailed(true)
      },
    )
  }

  /**
   * Undoes the download. The way back from here is not "the previous screen"
   * but "never mind" — and leaving 326 MB behind after that would be rude.
   */
  const remove = () => {
    forgetKokoro()
    setReady(false)
    setProgress(null)
    setNumbered(false)
    onChange({ ...settings, engine: 'system' })
    void clearStored().then(() => {
      setOnDisk(false)
      setStep('choose')
    })
  }

  const stop = () => {
    stopping.current = true
    cancelKokoroLoad()
    setProgress(null)
  }

  /**
   * Only the first visit has a download to ask about. Afterwards the model is
   * on the machine, and being asked to press "Load it" is being asked to
   * approve something nobody would decline — so it just happens, behind the
   * voices, and there is one step rather than two.
   */
  const chooseKokoro = () => {
    if (ready) return setStep('voice')
    if (onDisk) {
      load()
      return setStep('voice')
    }
    setNumbered(true)
    setStep('download')
  }

  const hearSystem = () => {
    setBusy('system')
    void say(VOICE_SAMPLE).finally(() => setBusy(null))
  }

  const hearVoice = (voice: string) => {
    onChange({ ...settings, voice })
    if (busy) return
    setBusy(voice)
    speakKokoro(VOICE_SAMPLE, voice, settings.device).finally(() => setBusy(null))
  }

  return (
    <div className="overlay onboarding-overlay">
      <div className="sheet onboarding" role="dialog" aria-modal="true" aria-label="Choose a voice">
        {step === 'choose' && (
          <div className="sheet-body">
            <h2>How should the words sound?</h2>
            <p className="lead">
              Every word and every sentence here is read aloud. Pick the voice that reads them.
            </p>

            <button className="voice-engine" onClick={chooseSystem}>
              <span className="engine-name">Your browser&apos;s voice</span>
              <span className="engine-note">
                Ready now, nothing to download. How good it sounds depends on the machine.
              </span>
            </button>

            <button className="voice-engine" onClick={chooseKokoro} disabled={!possible}>
              <span className="engine-name">Kokoro, a voice model</span>
              <span className="engine-note">
                {possible
                  ? 'Much better English, and it runs on this machine — no account, and nothing you type leaves it. Needs a 326 MB download, once.'
                  : 'Not available in this browser.'}
              </span>
            </button>
          </div>
        )}

        {step === 'listen' && (
          <div className="sheet-body">
            <h2>This is how it sounds</h2>
            <p className="lead">Your browser&apos;s own voice, reading a sentence from the app.</p>

            <p className="sample">“{VOICE_SAMPLE}”</p>

            <button className="btn primary wide" onClick={hearSystem} disabled={busy !== null}>
              {busy ? <span className="spinner small" aria-hidden /> : <SpeakerGlyph size={16} />}
              Hear it
            </button>

            <div className="step-actions">
              <button className="btn ghost" onClick={() => setStep('choose')}>
                Back
              </button>
              <button className="btn primary" onClick={() => setStep('done')}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'download' && (
          <div className="sheet-body">
            <p className="step-count">Step 1 of 2</p>
            <h2>Download the voice</h2>
            <p className="lead">
              326 MB, once. It is kept on this device and loads by itself from then on.
            </p>

            {progress === null && !failed ? (
              <button className="btn primary wide" onClick={() => load(() => setStep('voice'))}>
                Download it
              </button>
            ) : (
              <div className="download">
                <div className="bar">
                  <i style={{ width: `${percent ?? 5}%` }} />
                </div>
                <p className="engine-note">
                  {failed
                    ? 'The download did not finish.'
                    : percent === null
                      ? 'Starting…'
                      : percent === 100
                        ? 'Getting it ready…'
                        : `Downloading… ${percent}%`}
                </p>
              </div>
            )}

            {failed && (
              <button className="btn primary wide" onClick={() => load(() => setStep('voice'))}>
                Try again
              </button>
            )}

            <div className="step-actions">
              {progress !== null && !failed ? (
                <button className="btn ghost" onClick={stop}>
                  Cancel
                </button>
              ) : (
                <button className="btn ghost" onClick={() => setStep('choose')}>
                  Back
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'voice' && (
          <div className="sheet-body">
            {numbered && <p className="step-count">Step 2 of 2</p>}
            <h2>Choose a voice</h2>
            <p className="lead">
              {ready
                ? 'Tap one to hear it read the same sentence.'
                : 'Getting it ready — a moment, and you can hear each one.'}
            </p>

            <p className="sample">“{VOICE_SAMPLE}”</p>

            <ul className="voice-list">
              {KOKORO_VOICES.map((voice) => (
                <li key={voice.id}>
                  <button
                    className={`voice ${settings.voice === voice.id ? 'on' : ''}`}
                    onClick={() => hearVoice(voice.id)}
                    disabled={!ready || (busy !== null && busy !== voice.id)}
                  >
                    <span className="voice-name">{voice.name}</span>
                    <span className="voice-meta">
                      {voice.accent} · {voice.gender}
                    </span>
                    {busy === voice.id ? (
                      <span className="spinner small" aria-hidden />
                    ) : (
                      <SpeakerGlyph size={15} />
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <div className="step-actions">
              <button className="btn ghost" onClick={remove} disabled={!ready}>
                Delete
              </button>
              <button className="btn primary" onClick={() => setStep('done')} disabled={!ready}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="sheet-body">
            <h2>
              <CheckGlyph size={22} /> All set
            </h2>
            <p className="lead">
              You can change the voice whenever you like. It lives behind this button, on this
              screen and inside every exercise:
            </p>

            <p className="where">
              <span className="iconbtn gear fake">
                <SettingsGlyph />
                <span>Voices</span>
              </span>
            </p>

            <button className="btn primary wide" onClick={onFinish}>
              Start
            </button>

            <div className="step-actions">
              <button
                className="btn ghost"
                onClick={() => setStep(settings.engine === 'kokoro' ? 'voice' : 'listen')}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
