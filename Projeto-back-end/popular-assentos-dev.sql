SET NAMES utf8mb4;
-- Apenas dados de desenvolvimento das salas 1 e 2; preserva IDs e ingressos existentes.
SELECT GET_LOCK('cinemax_dev_assentos', 30) INTO @seed_lock;
START TRANSACTION;
INSERT INTO assentos (id_sala, fila, numero)
SELECT s.id_sala, f.fila, CAST(n.numero AS CHAR)
FROM salas s
CROSS JOIN (SELECT 'A' fila UNION ALL SELECT 'B' UNION ALL SELECT 'C' UNION ALL SELECT 'D' UNION ALL SELECT 'E' UNION ALL SELECT 'F') f
CROSS JOIN (SELECT 1 numero UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8) n
WHERE @seed_lock = 1 AND s.id_sala IN (1,2) AND NOT EXISTS (SELECT 1 FROM assentos a WHERE a.id_sala=s.id_sala AND a.fila=f.fila AND a.numero=CAST(n.numero AS CHAR));
UPDATE salas s SET capacidade=(SELECT COUNT(*) FROM assentos a WHERE a.id_sala=s.id_sala) WHERE @seed_lock=1 AND s.id_sala IN (1,2);
INSERT INTO sessoes (id_filme,id_sala,horario,preco)
SELECT f.id_filme,s.id_sala,TIMESTAMP(DATE_ADD(CURRENT_DATE,INTERVAL 7 DAY),'19:00:00'),25.00
FROM filmes f JOIN salas s ON s.id_sala=f.id_filme
WHERE @seed_lock=1 AND f.id_filme IN (1,2) AND NOT EXISTS (SELECT 1 FROM sessoes x WHERE x.id_filme=f.id_filme AND x.id_sala=s.id_sala AND x.horario>NOW());
COMMIT;
SELECT RELEASE_LOCK('cinemax_dev_assentos');
