import { getSafeMapEmbedUrl } from '../utils/mapEmbed.js';

export default function MapEmbed({ value, title = 'Peta lokasi' }) {
  const mapUrl = getSafeMapEmbedUrl(value);
  if (!mapUrl) return null;

  return (
    <iframe
      className="aspect-video w-full rounded-lg border-0"
      src={mapUrl}
      title={title}
      loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-popups"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}

