import { useState } from 'react';
import placeholder from './catalog-poster-placeholder.svg';

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
};

export default function CatalogPoster({ src, alt, className }: Props) {
  const source = src?.trim();
  const [failedSource, setFailedSource] = useState<string>();
  const showPoster = Boolean(source && source !== failedSource && source !== placeholder);

  return (
    <img
      src={showPoster ? source : placeholder}
      alt={alt}
      className={className}
      onError={showPoster ? () => setFailedSource(source) : undefined}
    />
  );
}
