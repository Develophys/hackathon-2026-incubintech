#!/usr/bin/env node
/**
 * create-monorepo.js
 * Deterministic monorepo scaffold: npm workspaces + Node/Express backend + React/Vite frontend
 * Architecture: Clean Architecture (domain → application → infrastructure)
 * Includes: Docker, docker-compose (backend + frontend + PostgreSQL), Prisma ORM
 *
 * Usage:
 *   node create-monorepo.js <project-name>
 *   node create-monorepo.js my-app
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

async function getProjectName() {
  if (args[0]) return args[0].trim();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question('Project name: ', answer => { rl.close(); resolve(answer.trim()); });
  });
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function run(cmd, cwd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function step(msg) {
  console.log(`\n\x1b[36m▶ ${msg}\x1b[0m`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  const projectName = await getProjectName();
  if (!projectName) { console.error('Project name is required.'); process.exit(1); }
  if (!/^[a-z0-9][a-z0-9\-_]*$/.test(projectName)) {
    console.error('Project name must be lowercase alphanumeric, hyphens or underscores only.');
    process.exit(1);
  }

  const root = path.resolve(projectName);
  if (fs.existsSync(root)) {
    console.error(`Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  console.log(`\n\x1b[1m🚀 Creating monorepo: ${projectName}\x1b[0m`);

  // ── 1. Root workspace ────────────────────────────────────────────────────────
  step('Root workspace');

  write(path.join(root, 'package.json'), JSON.stringify({
    name: projectName,
    version: '1.0.0',
    private: true,
    workspaces: ['packages/*'],
    scripts: {
      dev: 'npm run dev --workspaces --if-present',
      build: 'npm run build --workspaces --if-present',
      lint: 'npm run lint --workspaces --if-present',
      test: 'npm run test --workspaces --if-present',
      'dev:backend': 'npm run dev --workspace=packages/backend',
      'dev:frontend': 'npm run dev --workspace=packages/frontend',
      'build:backend': 'npm run build --workspace=packages/backend',
      'build:frontend': 'npm run build --workspace=packages/frontend',
      'docker:up': 'docker compose up --build',
      'docker:down': 'docker compose down',
      'docker:logs': 'docker compose logs -f',
      'db:migrate': 'npm run db:migrate --workspace=packages/backend',
      'db:generate': 'npm run db:generate --workspace=packages/backend',
      'db:studio': 'npm run db:studio --workspace=packages/backend',
    },
    engines: { node: '>=20.0.0' },
  }, null, 2));

  write(path.join(root, '.nvmrc'), '20\n');

  write(path.join(root, '.gitignore'), [
    'node_modules/',
    'dist/',
    'build/',
    '.env',
    '.env.local',
    '*.log',
    '.DS_Store',
    'coverage/',
    'postgres_data/',
  ].join('\n') + '\n');

  write(path.join(root, '.env.example'), `# Copy to .env and fill in your values
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${projectName}?schema=public"
PORT=3001
NODE_ENV=development
`);

  write(path.join(root, 'tsconfig.base.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      lib: ['ES2022'],
      strict: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      skipLibCheck: true,
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
    },
  }, null, 2));

  // ── 2. docker-compose.yml ────────────────────────────────────────────────────
  step('docker-compose.yml  (postgres + backend + frontend)');

  write(path.join(root, 'docker-compose.yml'), `services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${projectName}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: packages/backend/Dockerfile
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/${projectName}?schema=public
      PORT: 3001
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: packages/frontend/Dockerfile
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
`);

  // ── 3. packages/shared ──────────────────────────────────────────────────────
  step('packages/shared  (pure domain — zero framework deps)');
  const shared = path.join(root, 'packages', 'shared');

  write(path.join(shared, 'package.json'), JSON.stringify({
    name: `@${projectName}/shared`,
    version: '1.0.0',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': {
        import: './dist/index.js',
        types: './dist/index.d.ts',
      },
    },
    scripts: {
      build: 'tsc --build',
      dev: 'tsc --build --watch',
      clean: 'rm -rf dist',
    },
    devDependencies: {
      typescript: '^5.4.5',
    },
  }, null, 2));

  write(path.join(shared, 'tsconfig.json'), JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: {
      rootDir: './src',
      outDir: './dist',
      composite: true,
    },
    include: ['src'],
  }, null, 2));

  write(path.join(shared, 'src', 'domain', 'entities', 'Entity.ts'), `export abstract class Entity<T> {
  protected readonly _id: T;

  constructor(id: T) {
    this._id = id;
  }

  get id(): T {
    return this._id;
  }

  equals(other: Entity<T>): boolean {
    return this._id === other._id;
  }
}
`);

  write(path.join(shared, 'src', 'domain', 'value-objects', 'ValueObject.ts'), `export abstract class ValueObject<T extends object> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze({ ...props });
  }

  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
`);

  write(path.join(shared, 'src', 'domain', 'repositories', 'IRepository.ts'), `export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}
`);

  write(path.join(shared, 'src', 'domain', 'errors', 'DomainError.ts'), `export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: unknown) {
    super(\`\${resource} with id "\${id}" not found\`);
    this.name = 'NotFoundError';
  }
}
`);

  write(path.join(shared, 'src', 'application', 'use-cases', 'UseCase.ts'), `export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}
`);

  write(path.join(shared, 'src', 'application', 'services', 'ApplicationService.ts'), `export interface ApplicationService {}
`);

  write(path.join(shared, 'src', 'index.ts'), `// Domain
export * from './domain/entities/Entity.js';
export * from './domain/value-objects/ValueObject.js';
export * from './domain/repositories/IRepository.js';
export * from './domain/errors/DomainError.js';

// Application
export * from './application/use-cases/UseCase.js';
export * from './application/services/ApplicationService.js';
`);

  // ── 4. packages/backend ─────────────────────────────────────────────────────
  step('packages/backend  (Node LTS + Express + Prisma + TypeScript)');
  const backend = path.join(root, 'packages', 'backend');

  write(path.join(backend, 'package.json'), JSON.stringify({
    name: `@${projectName}/backend`,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'ts-node-dev --respawn --transpile-only src/main.ts',
      build: 'tsc --build',
      start: 'node dist/main.js',
      clean: 'rm -rf dist',
      'db:migrate': 'prisma migrate dev',
      'db:migrate:prod': 'prisma migrate deploy',
      'db:generate': 'prisma generate',
      'db:studio': 'prisma studio',
      'db:seed': 'ts-node-dev --transpile-only prisma/seed.ts',
      'db:reset': 'prisma migrate reset',
    },
    dependencies: {
      express: '^4.19.2',
      '@prisma/client': '^5.15.0',
      dotenv: '^16.4.5',
      [`@${projectName}/shared`]: '*',
    },
    devDependencies: {
      '@types/express': '^4.17.21',
      '@types/node': '^20.14.0',
      'ts-node-dev': '^2.0.0',
      typescript: '^5.4.5',
      prisma: '^5.15.0',
    },
  }, null, 2));

  write(path.join(backend, 'tsconfig.json'), JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: {
      rootDir: './src',
      outDir: './dist',
      composite: true,
    },
    references: [{ path: '../shared' }],
    include: ['src'],
  }, null, 2));

  // Prisma schema
  write(path.join(backend, 'prisma', 'schema.prisma'), `// https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add your models here.
// Example:
// model User {
//   id        String   @id @default(cuid())
//   email     String   @unique
//   name      String?
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }
`);

  write(path.join(backend, 'prisma', 'seed.ts'), `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  // Add your seed data here
  console.log('Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
`);

  // PrismaClient singleton — prevents connection pool exhaustion on hot-reload
  write(path.join(backend, 'src', 'infrastructure', 'persistence', 'prisma.ts'), `import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
`);

  // backend domain
  write(path.join(backend, 'src', 'domain', 'entities', '.gitkeep'), '');
  write(path.join(backend, 'src', 'domain', 'repositories', '.gitkeep'), '');

  write(path.join(backend, 'src', 'application', 'services', 'HealthService.ts'), `import { ApplicationService } from '@${projectName}/shared';

export class HealthService implements ApplicationService {
  check(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
`);

  write(path.join(backend, 'src', 'infrastructure', 'http', 'router.ts'), `import { Router } from 'express';
import { HealthService } from '../../application/services/HealthService.js';

const router = Router();
const healthService = new HealthService();

router.get('/health', (_req, res) => {
  res.json(healthService.check());
});

export default router;
`);

  write(path.join(backend, 'src', 'infrastructure', 'http', 'createApp.ts'), `import express from 'express';
import router from './router.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
}
`);

  write(path.join(backend, 'src', 'main.ts'), `import 'dotenv/config';
import { createApp } from './infrastructure/http/createApp.js';

const PORT = process.env.PORT ?? 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(\`Backend running on http://localhost:\${PORT}\`);
});
`);

  write(path.join(backend, '.env.example'), `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${projectName}?schema=public"
PORT=3001
NODE_ENV=development
`);

  // Backend Dockerfile
  write(path.join(backend, 'Dockerfile'), `# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

RUN npm install --ignore-scripts

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

RUN npm run db:generate --workspace=packages/backend
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/backend

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

RUN npm install --omit=dev --ignore-scripts

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/backend/prisma/schema.prisma && node packages/backend/dist/main.js"]
`);

  // ── 5. packages/frontend ────────────────────────────────────────────────────
  step('packages/frontend  (React + Vite + TypeScript)');
  const frontend = path.join(root, 'packages', 'frontend');

  write(path.join(frontend, 'package.json'), JSON.stringify({
    name: `@${projectName}/frontend`,
    version: '1.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc --noEmit && vite build',
      preview: 'vite preview',
      lint: 'eslint src --ext ts,tsx',
    },
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      [`@${projectName}/shared`]: '*',
    },
    devDependencies: {
      '@types/react': '^18.3.3',
      '@types/react-dom': '^18.3.0',
      '@vitejs/plugin-react': '^4.3.0',
      typescript: '^5.4.5',
      vite: '^5.3.1',
    },
  }, null, 2));

  write(path.join(frontend, 'tsconfig.json'), JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      jsx: 'react-jsx',
      noEmit: true,
      allowImportingTsExtensions: true,
    },
    references: [{ path: '../shared' }],
    include: ['src'],
  }, null, 2));

  write(path.join(frontend, 'vite.config.ts'), `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
`);

  write(path.join(frontend, 'index.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

  // nginx: SPA fallback + reverse proxy to backend service
  write(path.join(frontend, 'nginx.conf'), `server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass http://backend:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
`);

  // Frontend Dockerfile
  write(path.join(frontend, 'Dockerfile'), `# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/frontend/package*.json ./packages/frontend/

RUN npm install --ignore-scripts

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/frontend

# ── Stage 2: serve with nginx ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
`);

  // frontend source
  write(path.join(frontend, 'src', 'domain', '.gitkeep'), '');

  write(path.join(frontend, 'src', 'application', 'hooks', 'useHealth.ts'), `import { useState, useEffect } from 'react';
import { healthApiService } from '../../infrastructure/api/healthApiService.js';

interface HealthState {
  status: string | null;
  loading: boolean;
  error: string | null;
}

export function useHealth(): HealthState {
  const [state, setState] = useState<HealthState>({ status: null, loading: true, error: null });

  useEffect(() => {
    healthApiService.check()
      .then(data => setState({ status: data.status, loading: false, error: null }))
      .catch(err => setState({ status: null, loading: false, error: err.message }));
  }, []);

  return state;
}
`);

  write(path.join(frontend, 'src', 'infrastructure', 'api', 'healthApiService.ts'), `export const healthApiService = {
  async check(): Promise<{ status: string; timestamp: string }> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },
};
`);

  write(path.join(frontend, 'src', 'ui', 'components', 'HealthBadge.tsx'), `import { useHealth } from '../../application/hooks/useHealth.js';

export function HealthBadge() {
  const { status, loading, error } = useHealth();

  if (loading) return <span>Checking backend…</span>;
  if (error) return <span style={{ color: 'red' }}>Backend offline</span>;
  return <span style={{ color: 'green' }}>Backend: {status}</span>;
}
`);

  write(path.join(frontend, 'src', 'ui', 'App.tsx'), `import { HealthBadge } from './components/HealthBadge.js';

export default function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>${projectName}</h1>
      <HealthBadge />
    </main>
  );
}
`);

  write(path.join(frontend, 'src', 'main.tsx'), `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`);

  // ── 6. Install + generate + build ───────────────────────────────────────────
  step('Installing dependencies (npm install — workspaces)');
  run('npm install', root);

  step('Generating Prisma client');
  run('npm run db:generate --workspace=packages/backend', root);

  step('Building shared package');
  run('npm run build --workspace=packages/shared', root);

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log(`
\x1b[32m✅ Monorepo ready!\x1b[0m

  \x1b[1mProject:\x1b[0m  ${root}
  \x1b[1mLayout:\x1b[0m
    packages/shared    ← pure domain & application contracts
    packages/backend   ← Node/Express + Prisma (port 3001)
    packages/frontend  ← React/Vite  (port 3000)
    docker-compose.yml ← postgres + backend + frontend

  \x1b[1mLocal dev:\x1b[0m
    cp packages/backend/.env.example packages/backend/.env
    npm run db:migrate   # create & apply first migration
    npm run dev:backend  # terminal 1
    npm run dev:frontend # terminal 2

  \x1b[1mDocker (full stack):\x1b[0m
    npm run docker:up
    # frontend → http://localhost:3000
    # backend  → http://localhost:3001/api/health

  \x1b[1mDatabase (Prisma):\x1b[0m
    npm run db:migrate   # create + apply migration (dev)
    npm run db:studio    # open Prisma Studio UI
    npm run db:seed      # run prisma/seed.ts
`);
})();
