/*
  # Funções auxiliares e RLS

  1. Funções
    - Função para diminuir estoque de produtos
    - Função para calcular estatísticas

  2. Políticas RLS mais específicas
    - Políticas baseadas em roles futuros
*/

-- Função para diminuir estoque de produto
CREATE OR REPLACE FUNCTION decrease_product_stock(product_id UUID, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET stock = GREATEST(0, stock - quantity)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de vendas
CREATE OR REPLACE FUNCTION get_sales_stats(start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE(
  total_sales DECIMAL,
  total_orders BIGINT,
  average_ticket DECIMAL,
  approved_orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(o.total), 0) as total_sales,
    COUNT(*) as total_orders,
    COALESCE(AVG(o.total), 0) as average_ticket,
    COUNT(*) FILTER (WHERE o.payment_status = 'approved') as approved_orders
  FROM orders o
  WHERE 
    (start_date IS NULL OR DATE(o.created_at) >= start_date) AND
    (end_date IS NULL OR DATE(o.created_at) <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter produtos com baixo estoque
CREATE OR REPLACE FUNCTION get_low_stock_products(threshold INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  name TEXT,
  stock INTEGER,
  category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.stock,
    COALESCE(c.name, 'Sem categoria') as category_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.active = true AND p.stock <= threshold
  ORDER BY p.stock ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir configurações padrão
INSERT INTO settings (key, value, description) VALUES
  ('store_name', '"PDV Auto Atendimento"', 'Nome da loja'),
  ('store_logo', '""', 'URL do logotipo da loja'),
  ('default_employee_discount', '15', 'Desconto padrão para funcionários (%)'),
  ('default_resident_discount', '10', 'Desconto padrão para moradores (%)'),
  ('max_discount', '25', 'Desconto máximo permitido (%)'),
  ('payment_fees', '{"pix": 0.99, "debit": 1.99, "credit": {"installment_1": 2.99, "installment_2": 3.49, "installment_3": 3.99, "installment_4": 4.49, "installment_5": 4.99, "installment_6": 5.49, "installment_7": 5.99, "installment_8": 6.49, "installment_9": 6.99, "installment_10": 7.49}}', 'Taxas de pagamento por método')
ON CONFLICT (key) DO NOTHING;