CREATE DATABASE IF NOT EXISTS elite_dev_ingressos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE elite_dev_ingressos;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS pagamentos;
DROP TABLE IF EXISTS ingressos;
DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS eventos;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(150)  NOT NULL,
  email         VARCHAR(190)  NOT NULL UNIQUE,
  senha_hash    VARCHAR(255)  NOT NULL,
  papel         ENUM('organizador', 'cliente', 'portaria') NOT NULL,
  criado_em     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE eventos (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  organizador_id       INT           NOT NULL,
  tmdb_id              INT           NOT NULL,
  titulo               VARCHAR(255)  NOT NULL,
  caminho_poster       VARCHAR(255)  NULL,
  sinopse              TEXT          NULL,
  data_hora            DATETIME      NOT NULL,
  local                VARCHAR(255)  NOT NULL,
  capacidade_total     INT           NOT NULL,
  capacidade_reservada INT           NOT NULL DEFAULT 0,
  preco_centavos       INT           NOT NULL,
  situacao             ENUM('publicado', 'cancelado') NOT NULL DEFAULT 'publicado',
  criado_em            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eventos_organizador FOREIGN KEY (organizador_id) REFERENCES usuarios(id),
  CONSTRAINT chk_capacidade_nao_negativa CHECK (capacidade_total >= 0 AND capacidade_reservada >= 0)
) ENGINE=InnoDB;

CREATE TABLE reservas (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  evento_id                INT           NOT NULL,
  cliente_id               INT           NOT NULL,
  quantidade               INT           NOT NULL,
  preco_unitario_centavos  INT           NOT NULL,
  situacao                 ENUM('pendente_pagamento', 'pago', 'recusado', 'cancelado') NOT NULL DEFAULT 'pendente_pagamento',
  criado_em                TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservas_evento FOREIGN KEY (evento_id) REFERENCES eventos(id),
  CONSTRAINT fk_reservas_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE ingressos (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  reserva_id            INT           NOT NULL,
  evento_id             INT           NOT NULL,
  titular_id            INT           NOT NULL,
  qr_jti                CHAR(36)      NOT NULL UNIQUE,
  slug_compartilhamento VARCHAR(40)   NOT NULL UNIQUE,
  situacao              ENUM('valido', 'utilizado', 'cancelado') NOT NULL DEFAULT 'valido',
  utilizado_em          DATETIME      NULL,
  utilizado_por         INT           NULL,
  criado_em             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ingressos_reserva FOREIGN KEY (reserva_id) REFERENCES reservas(id),
  CONSTRAINT fk_ingressos_evento FOREIGN KEY (evento_id) REFERENCES eventos(id),
  CONSTRAINT fk_ingressos_titular FOREIGN KEY (titular_id) REFERENCES usuarios(id),
  CONSTRAINT fk_ingressos_utilizado_por FOREIGN KEY (utilizado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE pagamentos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  reserva_id     INT           NOT NULL,
  situacao       ENUM('aprovado', 'recusado') NOT NULL,
  valor_centavos INT           NOT NULL,
  criado_em      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pagamentos_reserva FOREIGN KEY (reserva_id) REFERENCES reservas(id)
) ENGINE=InnoDB;

CREATE INDEX idx_eventos_situacao_data ON eventos (situacao, data_hora);
CREATE INDEX idx_reservas_cliente ON reservas (cliente_id);
CREATE INDEX idx_ingressos_titular ON ingressos (titular_id);
