import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  githubId: text('github_id').notNull().unique(),
  username: text('username').notNull(),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  githubToken: text('github_token').notNull(),
  vercelToken: text('vercel_token'),
  cloudflareToken: text('cloudflare_token'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  subdomain: text('subdomain').notNull().unique(),
  framework: text('framework'),
  githubRepo: text('github_repo'),
  vercelProjectId: text('vercel_project_id'),
  deploymentUrl: text('deployment_url'),
  status: text('status', { enum: ['created', 'uploading', 'deploying', 'live', 'failed'] })
    .notNull()
    .default('created'),
  customDomain: text('custom_domain'),
  domainStatus: text('domain_status', { enum: ['pending', 'active', 'error'] }),
  description: text('description'),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
  ogImage: text('og_image'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const deployments = sqliteTable('deployments', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  vercelDeploymentId: text('vercel_deployment_id'),
  status: text('status', { enum: ['queued', 'building', 'ready', 'error', 'canceled'] })
    .notNull()
    .default('queued'),
  url: text('url'),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
