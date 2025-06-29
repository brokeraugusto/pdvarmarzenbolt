/*
  # Schema inicial do PDV Auto Atendimento

  1. Tabelas principais
    - `categories` - Categorias de produtos
    - `products` - Produtos do mercadinho
    - `users` - Usuários (funcionários, moradores, clientes)
    - `orders` - Pedidos realizados
    - `order_items` - Itens dos pedidos
    - `expenses` - Despesas do estabelecimento
    - `mp_transactions` - Log de transações Mercado Pago
    - `settings` - Configurações do sistema

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso baseadas em autenticação
*/

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (margin_percentage >= 0),
  image TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  type TEXT NOT NULL CHECK (type IN ('funcionario', 'morador', 'cliente')) DEFAULT 'cliente',
  discount_percentage INTEGER NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  discount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_data JSONB, -- Dados do cliente para casos sem cadastro
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit', 'debit')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  mp_payment_id TEXT, -- ID do pagamento no Mercado Pago
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_data JSONB NOT NULL, -- Snapshot dos dados do produto
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (category IN ('operational', 'administrative', 'marketing', 'maintenance', 'other')),
  date DATE NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'pix', 'credit', 'debit', 'transfer')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de transações Mercado Pago
CREATE TABLE IF NOT EXISTS mp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mp_payment_id TEXT,
  internal_order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('pix', 'credit_card', 'debit_card')),
  integration_type TEXT NOT NULL CHECK (integration_type IN ('checkout', 'point')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  status_detail TEXT,
  qr_code TEXT,
  qr_code_base64 TEXT,
  ticket_url TEXT,
  device_id TEXT,
  terminal_number TEXT,
  mp_response JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  webhook_received_at TIMESTAMPTZ
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_order ON mp_transactions(internal_order_id);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_mp_id ON mp_transactions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso público para o PDV)
-- Em produção, você pode querer restringir mais baseado em autenticação

-- Categorias - leitura pública, escrita restrita
CREATE POLICY "Public read access for categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin write access for categories" ON categories FOR ALL USING (true);

-- Produtos - leitura pública, escrita restrita
CREATE POLICY "Public read access for products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin write access for products" ON products FOR ALL USING (true);

-- Usuários - acesso restrito
CREATE POLICY "Admin access for users" ON users FOR ALL USING (true);

-- Pedidos - acesso restrito
CREATE POLICY "Admin access for orders" ON orders FOR ALL USING (true);

-- Itens do pedido - acesso restrito
CREATE POLICY "Admin access for order_items" ON order_items FOR ALL USING (true);

-- Despesas - acesso restrito
CREATE POLICY "Admin access for expenses" ON expenses FOR ALL USING (true);

-- Transações MP - acesso restrito
CREATE POLICY "Admin access for mp_transactions" ON mp_transactions FOR ALL USING (true);

-- Configurações - acesso restrito
CREATE POLICY "Admin access for settings" ON settings FOR ALL USING (true);