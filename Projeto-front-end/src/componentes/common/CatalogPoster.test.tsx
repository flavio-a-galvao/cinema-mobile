import { fireEvent, render, screen } from '@testing-library/react';
import CatalogPoster from './CatalogPoster';
import placeholder from './catalog-poster-placeholder.svg';

const poster = () => screen.getByRole('img', { name: 'Filme de teste' });

it('preserva o pôster válido, o texto alternativo e a classe do layout', () => {
  render(<CatalogPoster src="/posters/filme.webp" alt="Filme de teste" className="detalhes-poster" />);
  expect(poster().getAttribute('src')).toBe('/posters/filme.webp');
  expect(poster().classList.contains('detalhes-poster')).toBe(true);
});

it.each([undefined, null, '', '   '])('usa o SVG local quando não há pôster (%p)', src => {
  render(<CatalogPoster src={src} alt="Filme de teste" />);
  expect(poster().getAttribute('src')).toBe(placeholder);
});

it('troca uma imagem que falha pelo SVG, sem repetir a troca se o SVG falhar', () => {
  const { rerender } = render(<CatalogPoster src="/posters/invalido" alt="Filme de teste" />);
  fireEvent.error(poster());
  expect(poster().getAttribute('src')).toBe(placeholder);
  fireEvent.error(poster());
  expect(poster().getAttribute('src')).toBe(placeholder);

  rerender(<CatalogPoster src="/posters/novo.webp" alt="Filme de teste" />);
  expect(poster().getAttribute('src')).toBe('/posters/novo.webp');
});
