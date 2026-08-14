-- 0001_initial: tabelas `event` e `invitation`.
--
-- Escopo deliberado: `rsvp_response` está definida em
-- `specs/001-project-scaffolding/data-model.md` mas NÃO é criada aqui — ela pertence à
-- feature que implementar o envio de RSVP (research.md R-011).

CREATE TABLE event (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  starts_at       TEXT NOT NULL,
  rsvp_deadline   TEXT NOT NULL,
  retention_until TEXT NOT NULL,
  created_at      TEXT NOT NULL,

  CHECK (length(trim(name)) > 0),
  CHECK (rsvp_deadline <= starts_at),
  CHECK (retention_until > starts_at)
);

CREATE TABLE invitation (
  id             TEXT PRIMARY KEY,
  event_id       TEXT NOT NULL REFERENCES event (id) ON DELETE CASCADE,
  -- SHA-256 do token de convite. O token cru NUNCA é persistido: um vazamento do banco
  -- não deve entregar acesso aos convites (Princípio III, research.md R-010).
  token_hash     BLOB NOT NULL,
  guest_name     TEXT NOT NULL,
  guest_email    TEXT,
  max_party_size INTEGER NOT NULL,
  created_at     TEXT NOT NULL,

  CHECK (length(trim(guest_name)) > 0),
  CHECK (length(guest_name) <= 200),
  CHECK (guest_email IS NULL OR length(guest_email) <= 320),
  CHECK (max_party_size >= 1 AND max_party_size <= 20)
);

-- Único caminho de busca do fluxo de convidado. Sem índice por identificador sequencial:
-- não existe listagem de convites acessível a convidado.
CREATE UNIQUE INDEX invitation_token_hash_idx ON invitation (token_hash);

CREATE INDEX invitation_event_id_idx ON invitation (event_id);
