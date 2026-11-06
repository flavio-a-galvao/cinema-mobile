import { Page } from '@playwright/test';

/**
 * Store for tracking created test data
 */
const testDataStore: {
  users: string[];
  filmes: number[];
  salas: number[];
} = {
  users: [],
  filmes: [],
  salas: [],
};

/**
 * Add user email to cleanup list
 */
export function trackUser(email: string) {
  testDataStore.users.push(email);
}

/**
 * Add filme ID to cleanup list
 */
export function trackFilme(id: number) {
  testDataStore.filmes.push(id);
}

/**
 * Add sala ID to cleanup list
 */
export function trackSala(id: number) {
  testDataStore.salas.push(id);
}

/**
 * Get all tracked data
 */
export function getTrackedData() {
  return { ...testDataStore };
}

/**
 * Clear tracked data
 */
export function clearTrackedData() {
  testDataStore.users = [];
  testDataStore.filmes = [];
  testDataStore.salas = [];
}

/**
 * Encerra o rastreamento local; os dados ficam no ambiente descartável.
 */
export async function cleanupAllTestData(page: Page) {
  console.log('Dados sintéticos permanecem somente no ambiente E2E isolado; não existe DELETE de usuário na API.');
  clearTrackedData();
  console.log('Rastreamento local encerrado, sem exclusões de dados.');
}
