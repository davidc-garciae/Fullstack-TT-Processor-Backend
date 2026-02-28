-- Poblar productos y stock (mismo contenido que prisma/seed.ts)
-- Ejecutar en pgAdmin contra tu DB (Neon o local). Si ya tienes filas, omite o bórralas antes.

-- Producto 1: Wireless Headphones
WITH ins AS (
  INSERT INTO products (id, name, description, price_cents, currency, is_active, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Wireless Headphones',
    'Noise-cancelling over-ear headphones',
    259000,
    'COP',
    true,
    now(),
    now()
  )
  RETURNING id
)
INSERT INTO stock_items (id, product_id, available_units, reserved_units, created_at, updated_at)
SELECT gen_random_uuid(), ins.id, 15, 0, now(), now()
FROM ins;

-- Producto 2: Mechanical Keyboard
WITH ins AS (
  INSERT INTO products (id, name, description, price_cents, currency, is_active, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Mechanical Keyboard',
    'Compact keyboard with tactile switches',
    349000,
    'COP',
    true,
    now(),
    now()
  )
  RETURNING id
)
INSERT INTO stock_items (id, product_id, available_units, reserved_units, created_at, updated_at)
SELECT gen_random_uuid(), ins.id, 9, 0, now(), now()
FROM ins;
