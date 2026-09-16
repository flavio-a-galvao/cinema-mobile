import type { Href } from 'expo-router';
export const routes = { home: '/home' as Href, profile: '/profile' as Href, catalog: '/catalog' as Href, tickets: '/my-tickets' as Href, admin: '/admin' as Href, login: '/login' as Href, payment: '/payment' as Href, confirmation: '/ticket-confirmation' as Href };
export const movieRoute = (id: number) => ({ pathname: '/movies/[id]', params: { id: String(id) } }) as Href;
export const sessionRoute = (id: number) => ({ pathname: '/sessions/[id]', params: { id: String(id) } }) as Href;

export const adminMovieRoute = (id?: number) => ({ pathname: '/admin-movie', params: id ? { id: String(id) } : {} }) as Href;

export const adminRoutes = { rooms: '/admin-rooms' as Href, sessions: '/admin-sessions' as Href };
export const adminRoomRoute = (id?: number) => ({ pathname: '/admin-room', params: id ? { id: String(id) } : {} }) as Href;
export const adminSessionRoute = (id?: number) => ({ pathname: '/admin-session', params: id ? { id: String(id) } : {} }) as Href;
