-- MinePred: schema relacional inicial (PostgreSQL)
-- Migration draft only. Review with the backend owner before applying to any database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  manufacturer VARCHAR(80),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  hour_meter NUMERIC(12,1) NOT NULL DEFAULT 0 CHECK (hour_meter >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(180) NOT NULL,
  family VARCHAR(30) NOT NULL CHECK (family IN ('FPS','MATERIAL_RODANTE','OUTRO')),
  unit VARCHAR(12) NOT NULL DEFAULT 'un',
  new_measure_mm NUMERIC(12,3) NOT NULL CHECK (new_measure_mm > 0),
  discard_measure_mm NUMERIC(12,3) NOT NULL CHECK (discard_measure_mm >= 0 AND discard_measure_mm < new_measure_mm),
  lead_time_days INTEGER NOT NULL DEFAULT 0 CHECK (lead_time_days >= 0),
  average_monthly_demand NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (average_monthly_demand >= 0),
  safety_days INTEGER NOT NULL DEFAULT 0 CHECK (safety_days >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE machine_products (
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  position_code VARCHAR(80) NOT NULL DEFAULT 'GERAL',
  quantity_per_machine NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity_per_machine > 0),
  notes TEXT,
  PRIMARY KEY (machine_id, product_id, position_code)
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  contact_name VARCHAR(120),
  email VARCHAR(254),
  phone VARCHAR(40),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_suppliers (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  supplier_part_number VARCHAR(100),
  lead_time_days INTEGER CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  unit_price NUMERIC(14,2) CHECK (unit_price IS NULL OR unit_price >= 0),
  preferred BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (product_id, supplier_id)
);

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE RESTRICT,
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hour_meter NUMERIC(12,1) NOT NULL CHECK (hour_meter >= 0),
  inspector_name VARCHAR(120),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'FINALIZADA' CHECK (status IN ('RASCUNHO','FINALIZADA','CANCELADA')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inspection_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  position_code VARCHAR(80),
  measured_value_mm NUMERIC(12,3) NOT NULL CHECK (measured_value_mm >= 0),
  new_reference_mm NUMERIC(12,3) NOT NULL CHECK (new_reference_mm > 0),
  discard_limit_mm NUMERIC(12,3) NOT NULL CHECK (discard_limit_mm >= 0 AND discard_limit_mm < new_reference_mm),
  remaining_life_pct NUMERIC(5,2) NOT NULL CHECK (remaining_life_pct BETWEEN 0 AND 100),
  wear_pct NUMERIC(5,2) NOT NULL CHECK (wear_pct BETWEEN 0 AND 100),
  visual_condition VARCHAR(40) NOT NULL DEFAULT 'NORMAL',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inventory_balances (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE RESTRICT,
  on_hand_qty NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (on_hand_qty >= 0),
  reserved_qty NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reserved_qty <= on_hand_qty)
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('ENTRADA','SAIDA','RESERVA','LIBERACAO','AJUSTE')),
  quantity NUMERIC(14,2) NOT NULL CHECK (quantity > 0),
  reference_type VARCHAR(30),
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(40) NOT NULL UNIQUE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO','AGUARDANDO_APROVACAO','ENVIADO','PARCIAL','RECEBIDO','CANCELADO')),
  trigger_reason VARCHAR(30) NOT NULL CHECK (trigger_reason IN ('INSPECAO_CRITICA','PONTO_PEDIDO','MANUAL')),
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  notes TEXT,
  created_by VARCHAR(120),
  approved_by VARCHAR(120),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(14,2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14,2) CHECK (unit_price IS NULL OR unit_price >= 0),
  expected_delivery_date DATE,
  notes TEXT
);

CREATE INDEX idx_machine_products_product ON machine_products(product_id);
CREATE INDEX idx_inspections_machine_time ON inspections(machine_id, inspected_at DESC);
CREATE INDEX idx_measurements_product ON inspection_measurements(product_id, inspection_id);
CREATE INDEX idx_inventory_movements_product_time ON inventory_movements(product_id, created_at DESC);
CREATE INDEX idx_purchase_orders_status_time ON purchase_orders(status, requested_at DESC);
