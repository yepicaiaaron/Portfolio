export default function PortfolioPreview() {
  return (
    <main className="preview-shell">
      <iframe
        className="portfolio-frame"
        src="/portfolio/index.html"
        title="Aaron Jones interactive portfolio"
        allow="autoplay; fullscreen"
      />
    </main>
  );
}
