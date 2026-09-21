const base = import.meta.env.BASE_URL

export function Icon({ name, className }: { name: string; className?: string }) {
  return <img className={className} src={`${base}icons/${name}.svg`} alt="" aria-hidden />
}
