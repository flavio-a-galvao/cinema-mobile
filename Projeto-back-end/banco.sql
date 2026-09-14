-- =========================
-- CRIAÇÃO DO BANCO
-- =========================
CREATE DATABASE IF NOT EXISTS cinema_db;
USE cinema_db;

-- =========================
-- TABELA USUARIOS (LOGIN)
-- =========================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('admin','funcionario','cliente') DEFAULT 'cliente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABELA CLIENTES
-- =========================
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    email VARCHAR(150),
    telefone VARCHAR(20),
    data_nascimento DATE
);

-- =========================
-- TABELA FILMES
-- =========================
CREATE TABLE filmes (
    id_filme INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    genero VARCHAR(50),
    classificacao_etaria VARCHAR(10),
    duracao INT,
    sinopse TEXT,
    poster_url VARCHAR(255),
    data_lancamento DATE
);

-- =========================
-- TABELA SALAS
-- =========================
CREATE TABLE salas (
    id_sala INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50),
    capacidade INT NOT NULL
);

-- =========================
-- TABELA ASSENTOS
-- =========================
CREATE TABLE assentos (
    id_assento INT AUTO_INCREMENT PRIMARY KEY,
    id_sala INT,
    numero VARCHAR(10),
    fila VARCHAR(5),
    FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
);

-- =========================
-- TABELA SESSOES
-- =========================
CREATE TABLE sessoes (
    id_sessao INT AUTO_INCREMENT PRIMARY KEY,
    id_filme INT,
    id_sala INT,
    horario DATETIME,
    preco DECIMAL(6,2),
    FOREIGN KEY (id_filme) REFERENCES filmes(id_filme),
    FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
);

-- =========================
-- TABELA INGRESSOS
-- =========================
CREATE TABLE ingressos (
    id_ingresso INT AUTO_INCREMENT PRIMARY KEY,
    id_sessao INT,
    id_cliente INT,
    id_assento INT,
    data_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_assento) REFERENCES assentos(id_assento)
);

-- =========================
-- TABELA PAGAMENTOS
-- =========================
CREATE TABLE pagamentos (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_ingresso INT,
    valor DECIMAL(6,2),
    metodo_pagamento ENUM('cartao','pix','dinheiro'),
    data_pagamento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ingresso) REFERENCES ingressos(id_ingresso)
);

-- =========================
-- DADOS DE EXEMPLO
-- =========================

INSERT INTO usuarios (nome,email,senha,tipo_usuario)
VALUES
('Administrador','admin@cinema.com','$2b$10$.nm6Nzm59gLEn78EQJnie.8gHAnlP/JuRm/Vuxv6riPjFKABuHY.u','admin'),
('Funcionario','func@cinema.com','$2b$10$OFdNkHF2o/7O7smuszBheuCQWwGAJ3KCl8qZOY6EIn5/GdxOomKtq','funcionario');

INSERT INTO clientes (nome,cpf,email,telefone,data_nascimento)
VALUES
('Joao Silva','123.456.789-00','joao@email.com','44999999999','1995-05-10'),
('Maria Souza','987.654.321-00','maria@email.com','44988888888','1998-09-21');

INSERT INTO filmes (titulo,genero,classificacao_etaria,duracao,sinopse,poster_url,data_lancamento)
VALUES
('Vingadores','Ação','12',140,'Heróis salvando o mundo','https://i.imgur.com/8w1NikM.jpg','2019-04-25'),
('Batman','Ação','14',150,'História do cavaleiro das trevas','https://i.imgur.com/cH3kBRq.jpg','2022-03-04');

INSERT INTO salas (nome,capacidade)
VALUES
('Sala 1',100),
('Sala 2',80);

INSERT INTO assentos (id_sala,numero,fila)
VALUES
(1,'1','A'),
(1,'2','A'),
(1,'3','A'),
(2,'1','A'),
(2,'2','A');

INSERT INTO sessoes (id_filme,id_sala,horario,preco)
VALUES
(1,1,'2026-04-01 19:00:00',25.00),
(2,2,'2026-04-01 21:00:00',28.00);

INSERT INTO ingressos (id_sessao,id_cliente,id_assento)
VALUES
(1,1,1),
(2,2,4);

INSERT INTO pagamentos (id_ingresso,valor,metodo_pagamento)
VALUES
(1,25.00,'pix'),
(2,28.00,'cartao');