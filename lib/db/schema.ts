import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 32 }).notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 120 }).notNull(),
  lastName: varchar("last_name", { length: 120 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  organization: varchar("organization", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  linesOfBusiness: jsonb("lines_of_business").$type<string[]>().notNull(),
  memberCount: varchar("member_count", { length: 64 }),
  challenge: text("challenge"),
  preferredDate: varchar("preferred_date", { length: 32 }).notNull(),
  preferredTime: varchar("preferred_time", { length: 64 }).notNull(),
  timezone: varchar("timezone", { length: 64 }).notNull(),
  howHeard: varchar("how_heard", { length: 255 }),
  alternateDate: varchar("alternate_date", { length: 32 }),
  additionalNotes: text("additional_notes"),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  notes: text("notes"),
  ip: varchar("ip", { length: 64 }),
  userAgent: text("user_agent"),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  referrer: text("referrer"),
  visitorId: varchar("visitor_id", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitorId: varchar("visitor_id", { length: 64 }).notNull(),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  eventType: varchar("event_type", { length: 32 }).notNull(),
  path: text("path"),
  referrer: text("referrer"),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  country: varchar("country", { length: 8 }),
  region: varchar("region", { length: 128 }),
  city: varchar("city", { length: 128 }),
  deviceType: varchar("device_type", { length: 64 }),
  browser: varchar("browser", { length: 64 }),
  os: varchar("os", { length: 64 }),
  ip: varchar("ip", { length: 64 }),
  userAgent: text("user_agent"),
  properties: jsonb("properties").$type<Record<string, unknown>>(),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ip: varchar("ip", { length: 64 }),
  userAgent: text("user_agent"),
});

export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
