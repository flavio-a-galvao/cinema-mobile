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
 * Clean up all test data from database
 */
export async function cleanupAllTestData(page: Page) {
  console.log('🧹 Limpando dados de teste do banco...');
  const data = getTrackedData();

  // Delete test users
  for (const email of data.users) {
    try {
      const response = await page.request.delete(`https://cinema.local/api/usuarios/${email}`);
      if (response.ok()) {
        console.log(`  ✅ Usuário deletado: ${email}`);
      }
    } catch (error) {
      console.log(`  ⚠️ Erro ao deletar: ${email}`);
    }
    await page.waitForTimeout(200);
  }

  clearTrackedData();
  console.log('🧹 Limpeza concluída!\n');
}
