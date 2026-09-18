import type { QueryInterface } from 'sequelize';

/** Atualiza bases existentes sem remover ou mesclar clientes. */
export async function ensureClientesEmailUnique(queryInterface: QueryInterface): Promise<void> {
  const indexes = await queryInterface.showIndex('clientes') as {
    unique?: boolean;
    fields?: { attribute?: string }[];
  }[];
  const hasUniqueEmail = indexes.some((index) => index.unique === true
    && index.fields?.length === 1 && index.fields[0]?.attribute === 'email');
  if (hasUniqueEmail) return;

  try {
    await queryInterface.addIndex('clientes', ['email'], {
      unique: true,
      name: 'clientes_email_unique',
    });
  } catch (cause) {
    const error = new Error('Não foi possível garantir a unicidade de clientes.email. Verifique duplicidades existentes antes de iniciar o servidor. Nenhum cliente foi removido.');
    Object.assign(error, { cause });
    throw error;
  }
}
