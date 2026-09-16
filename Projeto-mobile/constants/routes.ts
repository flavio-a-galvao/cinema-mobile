import type { Href } from 'expo-router';
export const routes = { home: '/home' as Href, profile: '/profile' as Href, catalog: '/catalog' as Href, tickets: '/my-tickets' as Href, admin: '/admin' as Href, login: '/login' as Href, payment: '/payment' as Href, confirmation: '/ticket-confirmation' as Href };
export const movieRoute = (id: number) => ({ pathname: '/movies/[id]', params: { id: String(id) } }) as Href;
export const sessionRoute = (id: number) => ({ pathname: '/sessions/[id]', params: { id: String(id) } }) as Href;
