import { eq, and } from 'drizzle-orm';
import { projects, users } from '../db/schema';
import { decrypt } from './crypto';
import type { Database } from '../db';

export const getProjectByIdAndUser = async (db: Database, projectId: string, userId: string) => {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .get();
};

export const getUserWithTokens = async (db: Database, userId: string) => {
  return db.select().from(users).where(eq(users.id, userId)).get();
};

export const decryptUserToken = async (
  encryptedToken: string | null,
  encryptionKey: string,
): Promise<string> => {
  if (!encryptedToken) {
    throw new Error('Token not found');
  }
  return decrypt(encryptedToken, encryptionKey);
};
