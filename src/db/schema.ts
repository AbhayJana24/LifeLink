import { relations } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { parseEwkbPoint, type LngLat } from "@/lib/geo";

/* ------------------------------------------------------------------ */
/* PostGIS                                                             */
/* ------------------------------------------------------------------ */

/** PostGIS geography point (WGS84). Distances are in metres and GiST-indexable. */
export const geographyPoint = customType<{ data: LngLat; driverData: string }>({
  dataType() {
    return "geography"; // SRID 4326 by default; distances in metres
  },
  toDriver({ lng, lat }) {
    // EWKT text is implicitly cast to geography by Postgres
    return `SRID=4326;POINT(${Number(lng)} ${Number(lat)})`;
  },
  fromDriver(value) {
    return parseEwkbPoint(value);
  },
});

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const roleEnum = pgEnum("role", ["DONOR", "REQUESTER", "ADMIN"]);
export const bloodGroupEnum = pgEnum("blood_group", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
export const sexEnum = pgEnum("sex", ["MALE", "FEMALE", "OTHER"]);
export const donationTypeEnum = pgEnum("donation_type", ["WHOLE_BLOOD", "PLASMA"]);
export const urgencyEnum = pgEnum("urgency", ["CRITICAL", "URGENT", "STANDARD"]);
export const requestStatusEnum = pgEnum("request_status", ["OPEN", "FULFILLED", "CANCELLED", "EXPIRED"]);
export const responseStatusEnum = pgEnum("response_status", ["NOTIFIED", "ACCEPTED", "DECLINED", "DONATED"]);
export const notificationChannelEnum = pgEnum("notification_channel", ["SMS", "IN_APP"]);
export const notificationStatusEnum = pgEnum("notification_status", ["SENT", "LOGGED", "FAILED", "SKIPPED"]);

/* ------------------------------------------------------------------ */
/* Auth (Better Auth core schema + custom fields)                      */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: roleEnum("role").notNull().default("DONOR"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* ------------------------------------------------------------------ */
/* Domain                                                              */
/* ------------------------------------------------------------------ */

export const donorProfile = pgTable(
  "donor_profile",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    bloodGroup: bloodGroupEnum("blood_group").notNull(),
    sex: sexEnum("sex").notNull(),
    dateOfBirth: date("date_of_birth", { mode: "date" }).notNull(),
    weightKg: integer("weight_kg").notNull(),
    location: geographyPoint("location").notNull(),
    area: text("area").notNull(),
    lastDonatedAt: timestamp("last_donated_at", { withTimezone: true }),
    lastDonationType: donationTypeEnum("last_donation_type"),
    isAvailable: boolean("is_available").notNull().default(true),
    smsOptIn: boolean("sms_opt_in").notNull().default(true),
    /** Seeded demo donors: never sent real SMS. */
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("donor_profile_location_gist").using("gist", t.location),
    index("donor_profile_blood_group_idx").on(t.bloodGroup),
  ],
);

export const bloodRequest = pgTable(
  "blood_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    patientName: text("patient_name").notNull(),
    bloodGroup: bloodGroupEnum("blood_group").notNull(),
    donationType: donationTypeEnum("donation_type").notNull().default("WHOLE_BLOOD"),
    units: integer("units").notNull(),
    hospitalName: text("hospital_name").notNull(),
    hospitalAddress: text("hospital_address").notNull(),
    location: geographyPoint("location").notNull(),
    contactPhone: text("contact_phone").notNull(),
    urgency: urgencyEnum("urgency").notNull().default("URGENT"),
    status: requestStatusEnum("status").notNull().default("OPEN"),
    notes: text("notes"),
    neededBy: timestamp("needed_by", { withTimezone: true }).notNull(),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("blood_request_location_gist").using("gist", t.location),
    index("blood_request_status_idx").on(t.status),
    index("blood_request_requester_idx").on(t.requesterId),
  ],
);

export const donorResponse = pgTable(
  "donor_response",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => bloodRequest.id, { onDelete: "cascade" }),
    donorId: text("donor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: responseStatusEnum("status").notNull().default("NOTIFIED"),
    distanceM: integer("distance_m"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("donor_response_request_donor_uq").on(t.requestId, t.donorId),
    index("donor_response_donor_idx").on(t.donorId),
  ],
);

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    requestId: uuid("request_id").references(() => bloodRequest.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull(),
    status: notificationStatusEnum("status").notNull(),
    to: text("to"),
    body: text("body").notNull(),
    error: text("error"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notification_user_idx").on(t.userId, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const userRelations = relations(user, ({ one, many }) => ({
  donorProfile: one(donorProfile, { fields: [user.id], references: [donorProfile.userId] }),
  requests: many(bloodRequest),
  responses: many(donorResponse),
}));

export const donorProfileRelations = relations(donorProfile, ({ one }) => ({
  user: one(user, { fields: [donorProfile.userId], references: [user.id] }),
}));

export const bloodRequestRelations = relations(bloodRequest, ({ one, many }) => ({
  requester: one(user, { fields: [bloodRequest.requesterId], references: [user.id] }),
  responses: many(donorResponse),
}));

export const donorResponseRelations = relations(donorResponse, ({ one }) => ({
  request: one(bloodRequest, { fields: [donorResponse.requestId], references: [bloodRequest.id] }),
  donor: one(user, { fields: [donorResponse.donorId], references: [user.id] }),
}));

export type User = typeof user.$inferSelect;
export type DonorProfile = typeof donorProfile.$inferSelect;
export type BloodRequest = typeof bloodRequest.$inferSelect;
export type DonorResponse = typeof donorResponse.$inferSelect;
export type Notification = typeof notification.$inferSelect;
