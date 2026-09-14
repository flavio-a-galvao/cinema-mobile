import sequelize from "../config/database";

type CountRow = { total: number };

async function run() {
  const [beforeRows] = await sequelize.query(`
    SELECT COUNT(*) AS total
    FROM ingressos i
    JOIN assentos a ON a.id_assento = i.id_assento
    JOIN sessoes s ON s.id_sessao = i.id_sessao
    WHERE s.id_sala <> a.id_sala
  `);

  const totalBefore = Number((beforeRows as CountRow[])[0]?.total || 0);
  console.log(`Inconsistencias antes: ${totalBefore}`);

  const [result] = await sequelize.query(`
    UPDATE ingressos i
    JOIN assentos a ON a.id_assento = i.id_assento
    JOIN (
      SELECT id_sala, MIN(id_sessao) AS id_sessao_corrigida
      FROM sessoes
      GROUP BY id_sala
    ) sfix ON sfix.id_sala = a.id_sala
    SET i.id_sessao = sfix.id_sessao_corrigida
    WHERE i.id_sessao <> sfix.id_sessao_corrigida
  `);

  const affectedRows = (result as { affectedRows?: number }).affectedRows || 0;
  console.log(`Ingressos corrigidos: ${affectedRows}`);

  const [afterRows] = await sequelize.query(`
    SELECT COUNT(*) AS total
    FROM ingressos i
    JOIN assentos a ON a.id_assento = i.id_assento
    JOIN sessoes s ON s.id_sessao = i.id_sessao
    WHERE s.id_sala <> a.id_sala
  `);

  const totalAfter = Number((afterRows as CountRow[])[0]?.total || 0);
  console.log(`Inconsistencias depois: ${totalAfter}`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro ao corrigir ingressos:", error);
    process.exit(1);
  });
