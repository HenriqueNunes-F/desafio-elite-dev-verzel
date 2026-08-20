# Desafio Elite Dev (Verzel) — Plataforma de Eventos e Ingressos

## Context

O candidato avançou pra uma das últimas etapas do processo seletivo da Verzel (vaga Full Stack Júnior) e recebeu um desafio técnico prático: construir uma plataforma de eventos/ingressos completa em 7 dias corridos. O enunciado permite e recomenda uso de IA, desde que documentado, mas avisa explicitamente contra "AI slop" — projeto gerado de forma genérica sem decisão real do candidato. Este documento estrutura o trabalho como colaboração real: as decisões de arquitetura relevantes passam pelo candidato em pontos de checkpoint, e tudo fica documentado pra ele defender em entrevista depois.

Decisões confirmadas com o candidato: back-end em Node.js/Express (stack real dele), catálogo via API do TMDb (filmes, mais previsível que Ticketmaster), fluxo de reserva por quantidade ("pista", não mapa de assentos, pra entregar o fluxo completo simples primeiro), tentativa de deploy (vale +1 ponto), front-end em Vite + React (não Next.js).

## Estrutura do projeto

```
desafio-elite-dev-verzel/
  README.md
  AI-USAGE.md
  docs/plan.md
  backend/
    package.json
    .env.example
    src/
      server.js
      config/
      middleware/
      routes/
      controllers/
      services/
      data/
      utils/
      db/
        schema.sql
        seed.js
  frontend/
    package.json
    src/
```

## Modelo de dados

SQL puro (`schema.sql`), `mysql2` com pool de conexão — sem ORM. Proposital: SQL/MySQL é a habilidade mais forte do candidato.

- **usuarios**: `id, nome, email, senha_hash, papel ENUM('organizador','cliente','portaria'), criado_em`
- **eventos**: `id, organizador_id FK, tmdb_id, titulo, caminho_poster, sinopse, data_hora, local, capacidade_total, capacidade_reservada DEFAULT 0, preco_centavos, situacao ENUM('publicado','cancelado'), criado_em`
- **reservas**: `id, evento_id FK, cliente_id FK, quantidade, preco_unitario_centavos, situacao ENUM('pendente_pagamento','pago','recusado','cancelado'), criado_em, atualizado_em`
- **ingressos**: `id, reserva_id FK, evento_id FK, titular_id FK, qr_jti CHAR(36) UNIQUE, slug_compartilhamento VARCHAR UNIQUE, situacao ENUM('valido','utilizado'), utilizado_em, utilizado_por FK NULL, criado_em`
- **pagamentos**: `id, reserva_id FK, situacao ENUM('aprovado','recusado'), valor_centavos, criado_em`

> Nota: nomenclatura em português (variáveis, colunas, rotas) foi uma decisão posterior ao planejamento inicial, alinhada ao padrão que o candidato já usa no Sistema Veterinário — ver `docs/codebase-map.md`.

**Capacidade sem overselling**: UPDATE condicional atômico, nunca leitura-depois-escrita:

```sql
UPDATE eventos SET capacidade_reservada = capacidade_reservada + :qtd
WHERE id = :eventoId AND capacidade_reservada + :qtd <= capacidade_total;
```

`affectedRows === 0` → capacidade insuficiente (409). O lock de linha do InnoDB serializa concorrência.

**QR anti-forjadura**: JWT (HS256) assinado com `QR_SECRET` dedicado (diferente do secret de login). Payload `{ idIngresso, idEvento, jti }`. Validação na portaria: assinatura inválida → inválido; ingresso não encontrado → inválido; `evento_id` diferente → evento errado; UPDATE atômico `situacao='valido' → 'utilizado'` com `affectedRows` checado → já utilizado ou válido.

**Compartilhamento**: `share_slug` público, sem autenticação, mostra o ingresso + QR.

## Autenticação

JWT (HS256) via `Authorization: Bearer`, localStorage no front (não cookie httpOnly — origem cruzada Vercel/Render tornaria isso mais complexo sem ganho real). `bcryptjs` (não `bcrypt` nativo, evita `node-gyp` no Windows). `requererAutenticacao` + `requererPapel('organizador'|'cliente'|'portaria')`.

## Integração TMDb

Chave só no backend. `GET /search/movie`, `GET /movie/popular`, `GET /movie/{id}`. TMDb não tem sessão/local — criação de evento em duas partes: escolher filme do catálogo (dados congelados na tabela `events`) + preencher `date_time/location/capacity_total/price_cents` manualmente.

## Deploy

Frontend → Vercel. Backend → Render free (hiberna 15min inatividade). Banco → Aiven MySQL free tier (sempre grátis, sem cartão).

## Ordem de construção (7 dias)

Dia 1: fundação (auth, DB, scaffolds). Dia 2: catálogo TMDb + CRUD evento. Dia 3: reserva + capacidade atômica + pagamento simulado. Dia 4: compartilhamento + portaria + QR câmera. Dia 5: painel organizador + blindagem. Dia 6: polimento + testes opcionais + README. Dia 7: deploy + docs finais.

## Registro de uso de IA

`AI-USAGE.md` na raiz — uma entrada por sessão de trabalho.
