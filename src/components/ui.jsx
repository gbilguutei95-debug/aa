export function Loading({ text = 'Ачаалж байна…' }) {
  return <p className="state">{text}</p>
}
export function ErrorMsg({ message }) {
  return message ? <p className="state error">Алдаа: {message}</p> : null
}
export function Empty({ text = 'Илэрц олдсонгүй.' }) {
  return <p className="state">{text}</p>
}
export function Img({ src, alt, className = '' }) {
  return src
    ? <img className={className} src={src} alt={alt} loading="lazy" />
    : <div className={`placeholder ${className}`} aria-label={alt}>ISM</div>
}
