/** The small line icons used in buttons. Everything else is an illustration. */

type Props = { size?: number }

export const SpeakerGlyph = ({ size = 18 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M15.5 9.2a4 4 0 0 1 0 5.6M18 6.8a7.4 7.4 0 0 1 0 10.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export const StarGlyph = ({ size = 18, filled = false }: Props & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden>
    <path
      d="m12 3.6 2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
)

export const EyeGlyph = ({ size = 17 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="2.9" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

export const CheckGlyph = ({ size = 18 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="m4.5 12.5 4.8 4.8L19.5 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const BackGlyph = ({ size = 20 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M14.5 5 8 12l6.5 7" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const SettingsGlyph = ({ size = 19 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 8h10M18 8h2M4 16h4M12 16h8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="16" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="10" cy="16" r="2.4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const TrashGlyph = ({ size = 16 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M4.5 6.5h15M9.5 6.5V4.8h5v1.7M7 6.5l.9 12.2h8.2L17 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CloseGlyph = ({ size = 18 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="m6.5 6.5 11 11m0-11-11 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
