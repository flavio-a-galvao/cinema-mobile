-- Idempotente: remove apenas os links antigos do seed; preserva posters enviados.
UPDATE filmes SET poster_url = NULL
WHERE poster_url IN ('https://i.imgur.com/8w1NikM.jpg', 'https://i.imgur.com/cH3kBRq.jpg');
