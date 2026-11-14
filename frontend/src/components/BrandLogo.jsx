export default function BrandLogo({ tagline = false }) {
  return (
    <span className={`brand-logo${tagline ? ' with-tagline' : ''}`} role="img" aria-label="SafalPath">
      <img className="brand-logo-symbol" src="/safalpath-logo.svg" alt="" />
      <span className="brand-logo-type">Safal<span>Path</span></span>
      {tagline && <small className="brand-logo-tagline">CAREER COPILOT</small>}
    </span>
  );
}
