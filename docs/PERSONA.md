# Persona e conexão com a proposta — Cinemax

> Esta é uma **persona de projeto**, criada para representar o público-alvo do Cinemax com base no problema e nas funcionalidades desenvolvidas. Não representa uma pesquisa quantitativa ou entrevista real.

## Persona

**Nome fictício:** Lucas Almeida  
**Perfil:** jovem adulto, estudante, usuário frequente de smartphone.  
**Contexto:** costuma decidir qual filme assistir pelo celular e valoriza rapidez para verificar horários e lugares disponíveis.

### Necessidades

- saber quais filmes estão disponíveis;
- encontrar rapidamente uma sessão futura;
- escolher assentos antes de chegar ao cinema;
- visualizar o valor da compra;
- manter os ingressos organizados no celular;
- conseguir identificar compras pendentes;
- cancelar um ingresso quando a regra permitir;
- usar uma interface simples e legível.

### Dores

- não saber se ainda existem assentos disponíveis;
- precisar repetir etapas por falta de informação;
- perder o controle de ingressos já comprados;
- encontrar horários e dados espalhados;
- perceber somente no local que o assento desejado não está disponível.

### Objetivos

- resolver a compra em poucos passos;
- evitar conflito de assentos;
- visualizar todas as informações importantes antes da confirmação;
- consultar o ingresso depois da compra.

## Conexão entre persona e funcionalidades

| Necessidade / dor | Resposta do Cinemax |
|---|---|
| Consultar opções de filmes | Home e catálogo de filmes |
| Encontrar um filme específico | Pesquisa por título/gênero |
| Saber horários disponíveis | Sessões vinculadas ao filme |
| Evitar chegar sem lugar | Consulta de ocupação e escolha antecipada do assento |
| Comprar para mais de uma pessoa | Seleção de múltiplos assentos, até 10 por operação |
| Diferenciar tipos de ingresso | Inteira e meia |
| Saber o valor correto | Cálculo do valor no backend |
| Acompanhar compras | Tela "Meus Ingressos" |
| Retomar uma compra incompleta | Recuperação de pagamento pendente |
| Desistir antes da sessão | Cancelamento com liberação do assento |
| Ter comprovante visual | Ticket digital com QR ilustrativo |
| Usar o app confortavelmente | Temas claro/escuro e interface mobile |

## Segundo ator: Administrador

Embora a persona principal represente o cliente, o sistema possui um ator administrativo com necessidades diferentes:

- manter filmes atualizados;
- enviar pôsteres;
- organizar salas e assentos;
- cadastrar sessões;
- impedir que clientes acessem funções administrativas.

Essas necessidades são atendidas pelo painel Admin e pelas proteções `requireAuth + requireAdmin`.
