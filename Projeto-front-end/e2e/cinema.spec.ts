import { test, expect } from '@playwright/test';
import { signupNewUser, createAdminUser, loginAsAdmin } from './helpers';
import { trackUser, cleanupAllTestData } from './cleanup';

// Limpeza automática após cada teste
test.afterEach(async ({ page }) => {
  await cleanupAllTestData(page);
});

// Marca todos os testes como "lentos" - multiplica timeout por 3
test.describe('Login', () => {
  test('✅ Caso de sucesso: login com credenciais válidas', async ({ page }) => {
    test.slow();
    console.log('📝 Iniciando: Login com credenciais válidas');
    
    const userData = await signupNewUser(page);
    trackUser(userData.email);
    console.log(`📧 Email criado: ${userData.email}`);
    
    await page.goto('/login');
    console.log('📍 Navegou para /login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', userData.email);
    console.log('✏️ Email preenchido');
    await page.waitForTimeout(500);
    
    await page.fill('input[name="senha"]', userData.senha);
    console.log('✏️ Senha preenchida');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Entrar")');
    console.log('🔐 Clique no botão Entrar');
    await page.waitForTimeout(2000);

    await expect(page.locator('button.usuario-trigger')).toBeVisible({ timeout: 10000 });
    console.log('✅ Botão usuário-trigger encontrado');
    
    await expect(page).toHaveURL('https://cinema.local/');
    console.log('✅ Login realizado com sucesso!');
  });

  test('❌ Caso de falha: login com email inválido', async ({ page }) => {
    test.slow();
    console.log('📝 Iniciando: Login com email inválido');
    
    await page.goto('/login');
    console.log('📍 Navegou para /login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', 'email-invalido');
    console.log('✏️ Email inválido preenchido');
    await page.waitForTimeout(500);
    
    await page.fill('input[name="senha"]', 'Senha123!');
    console.log('✏️ Senha preenchida');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Entrar")');
    console.log('🔐 Clique no botão Entrar');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=Informe um e-mail valido')).toBeVisible();
    console.log('✅ Mensagem de erro exibida corretamente');
  });

  test('❌ Caso de falha: login com senha vazia', async ({ page }) => {
    test.slow();
    console.log('📝 Iniciando: Login com senha vazia');
    
    await page.goto('/login');
    console.log('📍 Navegou para /login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', 'teste@teste.com');
    console.log('✏️ Email preenchido');
    await page.waitForTimeout(500);
    
    await page.fill('input[name="senha"]', '');
    console.log('✏️ Senha deixada vazia');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Entrar")');
    console.log('🔐 Clique no botão Entrar');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=Informe sua senha')).toBeVisible();
    console.log('✅ Mensagem de erro exibida corretamente');
  });

  test('❌ Caso de falha: credenciais incorretas', async ({ page }) => {
    test.slow();
    console.log('📝 Iniciando: Login com credenciais incorretas');
    
    await page.goto('/login');
    console.log('📍 Navegou para /login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', 'naoexiste@teste.com');
    console.log('✏️ Email preenchido');
    await page.waitForTimeout(500);
    
    await page.fill('input[name="senha"]', 'SenhaErrada123!');
    console.log('✏️ Senha preenchida');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Entrar")');
    console.log('🔐 Clique no botão Entrar');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=Email ou senha')).toBeVisible();
    console.log('✅ Mensagem de erro exibida corretamente');
  });
});


test.describe('Cadastro de usuário', () => {
  test('✅ Caso de sucesso: criar novo usuário com dados válidos', async ({ page }) => {
    test.slow();
    console.log('📝 Iniciando: Cadastro com dados válidos');
    
    const userData = await signupNewUser(page);
    trackUser(userData.email);
    console.log(`📧 Novo usuário criado: ${userData.email}`);
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Cadastro concluido com sucesso')).toBeVisible({ timeout: 5000 });
    console.log('✅ Mensagem de sucesso exibida');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveURL(/.*\/login$/);
    console.log('📍 Redirecionado para /login');
    await page.waitForTimeout(1000);

    // Verificar que pode fazer login com a conta criada
    await page.goto('/login');
    console.log('📍 Navegou para /login novamente');
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="email"]', userData.email);
    console.log('✏️ Email preenchido');
    await page.waitForTimeout(500);
    
    await page.fill('input[name="senha"]', userData.senha);
    console.log('✏️ Senha preenchida');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Entrar")');
    console.log('🔐 Clique no botão Entrar');
    await page.waitForTimeout(2000);

    await expect(page.locator('button.usuario-trigger')).toBeVisible({ timeout: 10000 });
    console.log('✅ Login realizado com sucesso!');
  });

  test('❌ Caso de falha: cadastro com CPF inválido', async ({ page }) => {
    test.slow();
    console.log('📝 Iniciando: Cadastro com CPF inválido');
    
    await page.goto('/cadastro');
    console.log('📍 Navegou para /cadastro');
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="nome"]', 'Teste CPF');
    console.log('✏️ Nome preenchido');
    await page.waitForTimeout(300);
    
    await page.fill('input[name="cpf"]', '000.000.000-00');
    console.log('✏️ CPF inválido preenchido');
    await page.waitForTimeout(300);
    
    await page.fill('input[name="email"]', `cpffalha${Date.now()}@teste.com`);
    console.log('✏️ Email preenchido');
    await page.waitForTimeout(300);
    
    await page.fill('input[name="telefone"]', '(11) 99999-9999');
    console.log('✏️ Telefone preenchido');
    await page.waitForTimeout(300);
    
    await page.fill('input[name="senha"]', 'TesteSenha123!');
    console.log('✏️ Senha preenchida');
    await page.waitForTimeout(300);
    
    await page.fill('input[name="confirmarSenha"]', 'TesteSenha123!');
    console.log('✏️ Confirmação de senha preenchida');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Criar conta")');
    console.log('🔐 Clique no botão Criar conta');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=Informe um CPF valido')).toBeVisible();
    console.log('✅ Mensagem de erro exibida corretamente');
  });

  test('❌ Caso de falha: senhas não correspondem', async ({ page }) => {
    test.slow();
    console.log('📝 Iniciando: Cadastro com senhas diferentes');
    
    await page.goto('/cadastro');
    console.log('📍 Navegou para /cadastro');
    await page.waitForTimeout(1000);
    
    await page.fill('input[name="nome"]', 'Teste Senha');
    console.log('✏️ Nome preenchido');
    await page.waitForTimeout(300);
    
    await page.fill('input[name="cpf"]', '12345678901');
    console.log('✏️ CPF preenchido');
    await page.waitForTimeout(300);
    
    await page.fill('input[name="email"]', `senha-diferente${Date.now()}@teste.com`);
    console.log('✏️ Email preenchido');
    await page.waitForTimeout(300);
    
    await page.fill('input[name="telefone"]', '(11) 99999-9999');
    console.log('✏️ Telefone preenchido');
    await page.waitForTimeout(300);
    
    await page.fill('input[name="senha"]', 'TesteSenha123!');
    console.log('✏️ Senha preenchida');
    await page.waitForTimeout(300);
    
    await page.fill('input[name="confirmarSenha"]', 'SenhaErrada123!');
    console.log('✏️ Confirmação de senha DIFERENTE preenchida');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Criar conta")');
    console.log('🔐 Clique no botão Criar conta');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=nao conferem')).toBeVisible();
    console.log('✅ Mensagem de erro exibida corretamente');
  });
});

test.describe('CRUD Filmes', () => {
  test('✅ Fluxo completo: criar, listar, editar e excluir filme', async ({ page }) => {
    test.slow();
    console.log('📝 Iniciando: CRUD Filmes - Fluxo Completo');
    
    const adminData = await createAdminUser(page);
    trackUser(adminData.email);
    console.log(`👤 Admin criado: ${adminData.email}`);
    await page.waitForTimeout(1000);

    await loginAsAdmin(page, adminData);
    console.log('🔐 Login como admin realizado');
    await page.waitForTimeout(2000);

    // Navegação para seção de filmes
    await page.goto('/admin/filmes');
    console.log('📍 Navegou para /admin/filmes');
    await page.waitForTimeout(1500);

    // CREATE - Criar novo filme
    const filmTitle = `Filme E2E ${Date.now()}`;
    console.log(`🎬 Criando filme: ${filmTitle}`);
    
    await page.click('button:has-text("Cadastrar novo filme")');
    console.log('🔘 Clique no botão Cadastrar novo filme');
    await page.waitForTimeout(1000);

    await page.fill('input[name="titulo"]', filmTitle);
    console.log('✏️ Título preenchido');
    await page.waitForTimeout(300);

    await page.fill('input[name="genero"]', 'Ação');
    console.log('✏️ Gênero preenchido');
    await page.waitForTimeout(300);

    await page.fill('input[name="classificacao_etaria"]', 'Livre');
    console.log('✏️ Classificação preenchida');
    await page.waitForTimeout(300);

    await page.fill('input[name="duracao"]', '120');
    console.log('✏️ Duração preenchida');
    await page.waitForTimeout(300);

    await page.fill('input[name="data_lancamento"]', '2025-12-25');
    console.log('✏️ Data de lançamento preenchida');
    await page.waitForTimeout(300);

    await page.fill('input[name="poster_url"]', 'https://i.imgur.com/8w1NikM.jpg');
    console.log('✏️ URL do poster preenchida');
    await page.waitForTimeout(300);

    await page.fill('textarea[name="sinopse"]', 'Sinopse de teste para E2E.');
    console.log('✏️ Sinopse preenchida');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Salvar")');
    console.log('💾 Clique no botão Salvar (CREATE)');
    await page.waitForTimeout(2000);

    // READ/LIST - Verificar que o filme aparece na lista
    const filmArticle = page.locator('article', { hasText: filmTitle });
    await expect(filmArticle).toBeVisible({ timeout: 10000 });
    console.log('✅ Filme listado com sucesso');
    await page.waitForTimeout(1000);

    // UPDATE - Editar o filme
    const updatedTitle = `${filmTitle} - ATUALIZADO`;
    console.log(`✏️ Atualizando filme para: ${updatedTitle}`);
    
    await filmArticle.locator('button:has-text("Editar")').click();
    console.log('🔘 Clique no botão Editar');
    await page.waitForTimeout(1000);

    await page.fill('input[name="titulo"]', updatedTitle);
    console.log('✏️ Novo título preenchido');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Salvar")');
    console.log('💾 Clique no botão Salvar (UPDATE)');
    await page.waitForTimeout(2000);

    // Verificar edição
    await page.goto('/admin/filmes');
    await page.waitForTimeout(1000);
    const updatedArticle = page.locator('article', { hasText: updatedTitle });
    await expect(updatedArticle).toBeVisible({ timeout: 10000 });
    console.log('✅ Filme atualizado com sucesso');
    await page.waitForTimeout(1000);

    // DELETE - Excluir o filme
    console.log('🗑️ Deletando filme...');
    page.on('dialog', (dialog) => dialog.accept());
    
    await updatedArticle.locator('button:has-text("Remover")').click();
    console.log('🔘 Clique no botão Remover');
    await page.waitForTimeout(2000);

    // Verificar que foi deletado
    const deletedArticle = page.locator(`article:has-text("${updatedTitle}")`);
    await expect(deletedArticle).toHaveCount(0);
    console.log('✅ Filme deletado com sucesso');
  });

  test('❌ Falha: criar filme sem título', async ({ page }) => {
    test.slow();
    console.log('📝 Iniciando: Filme sem título (deve falhar)');
    
    const adminData = await createAdminUser(page);
    trackUser(adminData.email);
    await loginAsAdmin(page, adminData);
    await page.goto('/admin/filmes');
    await page.waitForTimeout(1500);

    await page.click('button:has-text("Cadastrar novo filme")');
    await page.waitForTimeout(1000);

    // Deixar título vazio e preencher outros campos
    await page.fill('input[name="genero"]', 'Drama');
    await page.fill('input[name="classificacao_etaria"]', 'Livre');
    await page.fill('input[name="duracao"]', '90');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Salvar")');
    console.log('🔘 Tentando salvar filme sem título');
    await page.waitForTimeout(1500);

    // Usar seletor mais específico para mensagem de erro
    await expect(page.locator('text=Preencha titulo')).toBeVisible();
    console.log('✅ Mensagem de erro exibida');
  });
});

test.describe('CRUD Salas', () => {
  test('✅ Fluxo completo: criar, listar e editar sala', async ({ page }) => {
    test.slow();
    console.log('📝 Iniciando: CRUD Salas - Fluxo Criar/Listar/Editar');
    
    const adminData = await createAdminUser(page);
    trackUser(adminData.email);
    console.log(`👤 Admin criado: ${adminData.email}`);
    await page.waitForTimeout(1000);

    await loginAsAdmin(page, adminData);
    console.log('🔐 Login como admin realizado');
    await page.waitForTimeout(2000);

    // Navegação para seção de salas
    await page.goto('/admin/salas');
    console.log('📍 Navegou para /admin/salas');
    await page.waitForTimeout(1500);

    // CREATE - Criar nova sala
    const roomName = `Sala E2E ${Date.now()}`;
    console.log(`🎪 Criando sala: ${roomName}`);
    
    await page.click('button:has-text("Cadastrar nova sala")');
    console.log('🔘 Clique no botão Cadastrar nova sala');
    await page.waitForTimeout(1000);

    await page.fill('input[name="nome"]', roomName);
    console.log('✏️ Nome da sala preenchido');
    await page.waitForTimeout(300);

    await page.fill('input[name="capacidade"]', '60');
    console.log('✏️ Capacidade preenchida');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Salvar")');
    console.log('💾 Clique no botão Salvar (CREATE)');
    await page.waitForTimeout(2000);

    // READ/LIST - Verificar que a sala aparece na lista
    const roomArticle = page.locator('article', { hasText: roomName });
    await expect(roomArticle).toBeVisible({ timeout: 10000 });
    console.log('✅ Sala listada com sucesso');
    await page.waitForTimeout(1000);

    // UPDATE - Editar a sala
    const updatedRoomName = `${roomName} - ATUALIZADA`;
    console.log(`✏️ Atualizando sala para: ${updatedRoomName}`);
    
    await roomArticle.locator('button:has-text("Editar")').click();
    console.log('🔘 Clique no botão Editar');
    await page.waitForTimeout(1000);

    await page.fill('input[name="nome"]', updatedRoomName);
    console.log('✏️ Novo nome preenchido');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Salvar")');
    console.log('💾 Clique no botão Salvar (UPDATE)');
    await page.waitForTimeout(2000);

    // Verificar edição
    await page.goto('/admin/salas');
    await page.waitForTimeout(1000);
    const updatedArticle = page.locator('article', { hasText: updatedRoomName });
    await expect(updatedArticle).toBeVisible({ timeout: 10000 });
    console.log('✅ Sala atualizada com sucesso (CREATE/READ/UPDATE)');
  });

  test('❌ Falha: criar sala com capacidade inválida (0)', async ({ page }) => {
    test.slow();
    console.log('📝 Iniciando: Sala com capacidade 0 (deve falhar)');
    
    const adminData = await createAdminUser(page);
    trackUser(adminData.email);
    await loginAsAdmin(page, adminData);
    await page.goto('/admin/salas');
    await page.waitForTimeout(1500);

    await page.click('button:has-text("Cadastrar nova sala")');
    await page.waitForTimeout(1000);

    await page.fill('input[name="nome"]', 'Sala Inválida');
    await page.fill('input[name="capacidade"]', '0');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Salvar")');
    console.log('🔘 Tentando salvar sala com capacidade 0');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=capacidade')).toBeVisible();
    console.log('✅ Mensagem de erro exibida');
  });
});

