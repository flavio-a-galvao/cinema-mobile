import { Page } from '@playwright/test';

/**
 * Helpers and Utilities for E2E Tests
 */

/**
 * Login helper function
 */
export async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="senha"]', password);
  await page.click('button:has-text("Entrar")');

  await Promise.all([
    page.waitForURL('**/', { timeout: 5000 }),
    page.locator('button.usuario-trigger').waitFor({ state: 'visible', timeout: 5000 }),
  ]).catch(() => {});
}

/**
 * Create admin user via API
 */
export async function createAdminUser(page: Page, overrides?: Partial<SignupData>): Promise<SignupData> {
  const timestamp = Date.now();
  const data: SignupData = {
    nome: 'Admin Teste',
    cpf: generateValidCPF(),
    email: `admin-teste-${timestamp}@teste.com`,
    telefone: '11987654321',
    senha: 'AdminTeste123!',
    confirmarSenha: 'AdminTeste123!',
    ...overrides,
  };

  // Create admin user via API
  const response = await page.request.post('https://cinema.local/api/usuarios', {
    data: {
      nome: data.nome,
      email: data.email,
      cpf: data.cpf,
      telefone: data.telefone,
      senha: data.senha,
      tipo_usuario: 'admin', // Important: set as admin
    },
  });

  if (!response.ok()) {
    console.error('Failed to create admin user:', await response.text());
  }

  return data;
}

/**
 * Login as admin
 */
export async function loginAsAdmin(page: Page, adminData?: SignupData) {
  if (adminData) {
    await loginAsUser(page, adminData.email, adminData.senha);
  } else {
    await loginAsUser(page, 'admin@cinema.com', 'Admin123!');
  }
}

function generateValidCPF(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));

  function calcDigit(baseDigits: number[]): number {
    const total = baseDigits.reduce((sum, digit, index) => sum + digit * (baseDigits.length + 1 - index), 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  const firstDigit = calcDigit(digits);
  const secondDigit = calcDigit([...digits, firstDigit]);
  return [...digits, firstDigit, secondDigit].join('');
}

/**
 * Signup new user with unique email
 */
export async function signupNewUser(page: Page, overrides?: Partial<SignupData>): Promise<SignupData> {
  const timestamp = Date.now();
  const data: SignupData = {
    nome: 'Teste User',
    cpf: generateValidCPF(),
    email: `user${timestamp}@teste.com`,
    telefone: '11987654321',
    senha: 'TesteSenha123!',
    confirmarSenha: 'TesteSenha123!',
    ...overrides,
  };

  await page.goto('/cadastro');
  
  await page.fill('input[name="nome"]', data.nome);
  await page.fill('input[name="cpf"]', data.cpf);
  await page.fill('input[name="email"]', data.email);
  await page.fill('input[name="telefone"]', data.telefone);
  await page.fill('input[name="senha"]', data.senha);
  await page.fill('input[name="confirmarSenha"]', data.confirmarSenha);
  
  await page.click('button:has-text("Criar conta")');
  
  return data;
}

/**
 * Delete user via API
 */
export async function deleteUserViaAPI(page: Page, email: string): Promise<boolean> {
  try {
    const response = await page.request.delete(`https://cinema.local/api/usuarios/${email}`);
    console.log(`🗑️ Usuário ${email} deletado (${response.status()})`);
    return response.ok();
  } catch (error) {
    console.error(`❌ Erro ao deletar usuário ${email}:`, error);
    return false;
  }
}

/**
 * Delete all test users (clean up database)
 */
export async function cleanupTestUsers(page: Page, userEmails: string[]): Promise<void> {
  for (const email of userEmails) {
    if (email.includes('teste') || email.includes('admin-teste')) {
      await deleteUserViaAPI(page, email);
      await page.waitForTimeout(300);
    }
  }
}

/**
 * Get token for authenticated requests
 */
export async function getAuthToken(page: Page, email: string, senha: string): Promise<string | null> {
  try {
    const response = await page.request.post('https://cinema.local/api/login', {
      data: { email, senha },
    });
    const data = await response.json();
    return data.token || null;
  } catch {
    return null;
  }
}

/**
 * Create a new film
 */
export async function createFilme(page: Page, overrides?: Partial<FilmeData>): Promise<FilmeData> {
  const timestamp = Date.now();
  const data: FilmeData = {
    titulo: `Filme Teste ${timestamp}`,
    descricao: 'Descrição de teste',
    genero: 'Ação',
    duracao: '120',
    classificacao: 'PG-13',
    diretor: 'Diretor Teste',
    ...overrides,
  };

  await page.click('button:has-text("Novo Filme")');
  
  await page.fill('input[name="titulo"]', data.titulo);
  await page.fill('textarea[name="descricao"]', data.descricao);
  await page.fill('input[name="genero"]', data.genero);
  await page.fill('input[name="duracao"]', data.duracao);
  await page.fill('input[name="classificacao"]', data.classificacao);
  await page.fill('input[name="diretor"]', data.diretor);
  
  await page.click('button:has-text("Salvar")');
  
  return data;
}

/**
 * Create a new session (sessão)
 */
export async function createSessao(page: Page, overrides?: Partial<SessaoData>): Promise<SessaoData> {
  const data: SessaoData = {
    filmeIndex: 1,
    salaIndex: 1,
    data: '2024-12-25',
    hora: '20:00',
    preco: '45.00',
    ...overrides,
  };

  await page.click('button:has-text("Nova Sessão")');
  
  // Select film
  const filmeSelect = page.locator('select[name="filme_id"]');
  if (await filmeSelect.isVisible()) {
    await filmeSelect.selectOption({ index: data.filmeIndex });
  }

  // Select room
  const salaSelect = page.locator('select[name="sala_id"]');
  if (await salaSelect.isVisible()) {
    await salaSelect.selectOption({ index: data.salaIndex });
  }

  // Fill date and time
  await page.fill('input[name="data"]', data.data);
  await page.fill('input[name="hora"]', data.hora);
  await page.fill('input[name="preco"]', data.preco);
  
  await page.click('button:has-text("Salvar")');
  
  return data;
}

/**
 * Wait for success message
 */
export async function waitForSuccessMessage(
  page: Page,
  keywords: string[] = ['sucesso', 'criado', 'atualizado', 'deletado'],
  timeout: number = 5000
) {
  const selectors = [
    '.alert-success',
    '.success-message',
    '.toast-success',
    '[class*="success"]',
    'text=' + keywords.join('|'),
  ];

  for (const selector of selectors) {
    try {
      await page.locator(selector).first().waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      // Continue to next selector
    }
  }

  return false;
}

/**
 * Wait for error message
 */
export async function waitForErrorMessage(
  page: Page,
  keywords: string[] = ['erro', 'inválido', 'obrigatório'],
  timeout: number = 5000
) {
  const selectors = [
    '.alert-danger',
    '.error-message',
    '.toast-error',
    '[class*="error"]',
    '.text-danger',
    'text=' + keywords.join('|'),
  ];

  for (const selector of selectors) {
    try {
      await page.locator(selector).first().waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      // Continue to next selector
    }
  }

  return false;
}

/**
 * Get table row count
 */
export async function getTableRowCount(page: Page): Promise<number> {
  const rows = page.locator('tbody tr');
  return await rows.count();
}

/**
 * Delete item from list
 */
export async function deleteItemFromList(page: Page, rowIndex: number = 0) {
  const rows = page.locator('tbody tr');
  const row = rows.nth(rowIndex);
  
  await row.locator('button:has-text("Deletar")').click();
  await page.click('button:has-text("Confirmar")');
}

/**
 * Edit item in list
 */
export async function editItemInList(
  page: Page,
  rowIndex: number = 0,
  fieldUpdates: Record<string, string>
) {
  const rows = page.locator('tbody tr');
  const row = rows.nth(rowIndex);
  
  await row.locator('button:has-text("Editar")').click();
  
  for (const [fieldName, value] of Object.entries(fieldUpdates)) {
    const inputSelector = `input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]`;
    const input = page.locator(inputSelector);
    
    if (await input.isVisible()) {
      if (inputSelector.includes('select')) {
        await input.selectOption(value);
      } else {
        await input.fill(value);
      }
    }
  }
  
  await page.click('button:has-text("Salvar")');
}

// ============================================
// Type Definitions
// ============================================

export interface SignupData {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}

export interface FilmeData {
  titulo: string;
  descricao: string;
  genero: string;
  duracao: string;
  classificacao: string;
  diretor: string;
}

export interface SessaoData {
  filmeIndex: number;
  salaIndex: number;
  data: string;
  hora: string;
  preco: string;
}
