import { afterEach, describe, expect, it } from 'vitest';
import type { Db } from '@server/persistence/db.ts';
import { SqliteInvitationRepository } from '@server/persistence/invitation-repository.sqlite.ts';
import { generateInviteToken, hashInviteToken } from '@server/tokens/invite-token.ts';
import { openTestDatabase, seedInvitation } from '../helpers/seed.ts';

/**
 * Contrato da port `InvitationRepository` (contracts/ports.md), exercitado contra SQLite
 * real. Um repositório testado só contra mock não prova nada sobre o banco — que é
 * exatamente a lacuna descrita pelo Princípio II.
 */

let db: Db | undefined;

afterEach(() => {
  db?.close();
  db = undefined;
});

describe('SqliteInvitationRepository.findByToken', () => {
  it('retorna o agregado para um token válido', async () => {
    db = openTestDatabase();
    const seeded = seedInvitation(db);
    const repo = new SqliteInvitationRepository(db);

    const found = await repo.findByToken(seeded.token);

    expect(found).not.toBeNull();
    expect(found?.guestName).toBe(seeded.guestName);
    expect(found?.maxPartySize).toBe(seeded.maxPartySize);
    expect(found?.event.name).toBe(seeded.eventName);
  });

  it('retorna null para token inexistente, sem lançar', async () => {
    db = openTestDatabase();
    const repo = new SqliteInvitationRepository(db);

    await expect(repo.findByToken(generateInviteToken())).resolves.toBeNull();
  });

  it('retorna null para token malformado, sem lançar', async () => {
    db = openTestDatabase();
    const repo = new SqliteInvitationRepository(db);

    await expect(repo.findByToken('curto-demais')).resolves.toBeNull();
  });

  it('não é satisfeito pelo tokenHash passado como se fosse token cru', async () => {
    db = openTestDatabase();
    const seeded = seedInvitation(db);
    const repo = new SqliteInvitationRepository(db);

    const hashAsToken = hashInviteToken(seeded.token).toString('base64url');

    await expect(repo.findByToken(hashAsToken)).resolves.toBeNull();
  });

  it('o token cru nunca é persistido: a coluna guarda o hash', () => {
    db = openTestDatabase();
    const seeded = seedInvitation(db);

    const row = db
      .prepare<[], { token_hash: Buffer }>('SELECT token_hash FROM invitation')
      .get();

    expect(row?.token_hash).toEqual(hashInviteToken(seeded.token));
    expect(row?.token_hash.toString('utf8')).not.toContain(seeded.token);
  });

  it('não expõe método de listagem de convites (Princípio III / V)', () => {
    db = openTestDatabase();
    const repo = new SqliteInvitationRepository(db);

    expect((repo as unknown as Record<string, unknown>)['findAll']).toBeUndefined();
    expect((repo as unknown as Record<string, unknown>)['query']).toBeUndefined();
  });
});
