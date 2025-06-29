# Documentação do Banco de Dados

## Visão Geral

Documentação da estrutura de banco de dados, schemas, relacionamentos e estratégias de gerenciamento de dados.

## Status Atual

⚠️ **Não implementado** - Banco de dados ainda não foi configurado.

## Estratégias de Banco de Dados

### Opção 1: Supabase (Recomendado)
**PostgreSQL com BaaS (Backend as a Service)**

```sql
-- Tabela de usuários
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);
```

### Opção 2: Firebase Firestore
**NoSQL Document Database**

```typescript
// Estrutura de coleções
interface UserDocument {
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

interface ProjectDocument {
  id: string
  name: string
  description: string
  ownerId: string
  members: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Opção 3: Local Storage + IndexedDB
**Para aplicações offline-first**

```typescript
// Schema para IndexedDB
interface IndexedDBSchema {
  users: {
    key: string
    value: User
    indexes: {
      email: string
    }
  }
  projects: {
    key: string
    value: Project
    indexes: {
      ownerId: string
      createdAt: Date
    }
  }
}
```

## Schema Principal (PostgreSQL)

### Tabelas Principais

#### Usuários
```sql
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### Perfis de Usuário
```sql
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    website VARCHAR(255),
    location VARCHAR(100),
    birth_date DATE,
    phone VARCHAR(20),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);
```

#### Projetos
```sql
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    is_public BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);
```

#### Membros do Projeto
```sql
CREATE TABLE project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id, user_id)
);

-- Índices
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
```

#### Tarefas
```sql
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

### Funções e Triggers

#### Auto-update updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas as tabelas
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS)

### Políticas de Segurança
```sql
-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Projetos: proprietários e membros
CREATE POLICY "Project visibility" ON projects
    FOR SELECT USING (
        is_public = true OR 
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = projects.id AND user_id = auth.uid()
        )
    );

-- Tarefas: apenas membros do projeto
CREATE POLICY "Task access" ON tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            JOIN projects p ON p.id = pm.project_id
            WHERE pm.user_id = auth.uid() 
            AND p.id = tasks.project_id
        )
    );
```

## Cliente TypeScript

### Configuração Supabase
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
```

### Tipos TypeScript Gerados
```typescript
// types/database.ts
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: 'user' | 'admin' | 'moderator'
          is_active: boolean
          email_verified: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'moderator'
          is_active?: boolean
          email_verified?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'moderator'
          is_active?: boolean
          email_verified?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // ... outras tabelas
    }
  }
}
```

## Serviços de Dados

### User Service
```typescript
// services/databaseService.ts
class DatabaseService {
  async createUser(userData: Database['public']['Tables']['users']['Insert']) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async updateUser(id: string, updates: Database['public']['Tables']['users']['Update']) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getUserProjects(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_members!inner(role),
        tasks(count)
      `)
      .or(`owner_id.eq.${userId},project_members.user_id.eq.${userId}`)

    if (error) throw error
    return data
  }
}

export const databaseService = new DatabaseService()
```

## Migrações

### Sistema de Migração
```sql
-- migrations/001_initial_schema.sql
-- Schema inicial com tabelas principais

-- migrations/002_add_user_profiles.sql
CREATE TABLE user_profiles (
    -- definição da tabela
);

-- migrations/003_add_project_settings.sql
ALTER TABLE projects ADD COLUMN settings JSONB DEFAULT '{}';
```

### Script de Migração
```typescript
// scripts/migrate.ts
import { readdir, readFile } from 'fs/promises'
import { supabase } from '../lib/supabase'

async function runMigrations() {
  const migrationFiles = await readdir('./migrations')
  const sortedFiles = migrationFiles.sort()

  for (const file of sortedFiles) {
    if (file.endsWith('.sql')) {
      console.log(`Running migration: ${file}`)
      const sql = await readFile(`./migrations/${file}`, 'utf-8')
      
      const { error } = await supabase.rpc('execute_sql', { sql })
      if (error) {
        console.error(`Migration ${file} failed:`, error)
        break
      }
      
      console.log(`Migration ${file} completed`)
    }
  }
}

runMigrations()
```

## Backup e Recovery

### Backup Automático
```sql
-- Função para backup completo
CREATE OR REPLACE FUNCTION create_backup()
RETURNS TEXT AS $$
DECLARE
    backup_name TEXT;
BEGIN
    backup_name := 'backup_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS');
    
    -- Criar backup usando pg_dump
    PERFORM pg_dump('dbname=yourdb', '-f', '/backups/' || backup_name || '.sql');
    
    RETURN backup_name;
END;
$$ LANGUAGE plpgsql;

-- Agendar backup diário
SELECT cron.schedule('daily-backup', '0 2 * * *', 'SELECT create_backup();');
```

## Monitoramento

### Queries de Performance
```sql
-- Queries mais lentas
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Índices não utilizados
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;

-- Tamanho das tabelas
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::text)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::text) DESC;
```

## Testes

### Testes de Integração
```typescript
// __tests__/database.test.ts
describe('Database Operations', () => {
  beforeEach(async () => {
    // Limpar dados de teste
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  })

  test('should create and retrieve user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User'
    }

    const user = await databaseService.createUser(userData)
    expect(user.email).toBe(userData.email)

    const retrievedUser = await databaseService.getUserById(user.id)
    expect(retrievedUser.name).toBe(userData.name)
  })

  test('should handle RLS policies', async () => {
    // Teste de segurança RLS
    const { error } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'other-user-id')

    expect(error).toBeTruthy()
  })
})
```

## Configuração de Ambiente

```env
# .env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Para desenvolvimento local
DATABASE_URL=postgresql://postgres:password@localhost:5432/yourdb
```

## Próximos Passos

1. [ ] Escolher estratégia de banco de dados
2. [ ] Configurar Supabase project
3. [ ] Implementar schema inicial
4. [ ] Configurar Row Level Security
5. [ ] Gerar tipos TypeScript
6. [ ] Implementar serviços de dados
7. [ ] Criar sistema de migrações
8. [ ] Configurar backup automático
9. [ ] Implementar monitoramento
10. [ ] Adicionar testes de integração

## Recursos Externos

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Design Principles](https://en.wikipedia.org/wiki/Database_design)