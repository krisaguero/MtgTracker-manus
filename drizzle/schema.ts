import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const savedDecks = mysqlTable("saved_decks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deckKey: varchar("deckKey", { length: 160 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 64 }).notNull().default("commander-precon"),
  deckJson: text("deckJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ savedDeckUserKey: uniqueIndex("saved_decks_user_key").on(table.userId, table.deckKey) }));

/** Retained for compatibility with existing databases; no current route writes to this table. */
/** Retained for compatibility with existing databases; no current route writes to this table. */
export const collectionImportAudits = mysqlTable("collection_import_audits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sourceHash: varchar("sourceHash", { length: 128 }).notNull(),
  sourceName: varchar("sourceName", { length: 255 }),
  incomingEntries: int("incomingEntries").notNull(),
  duplicateEntries: int("duplicateEntries").notNull().default(0),
  unresolvedPrintings: int("unresolvedPrintings").notNull().default(0),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
}, (table) => ({ collectionImportUserHash: uniqueIndex("collection_import_user_hash").on(table.userId, table.sourceHash) }));

export type SavedDeck = typeof savedDecks.$inferSelect;
export type CollectionImportAudit = typeof collectionImportAudits.$inferSelect;
