/*
  # Inventory Management System Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, product name)
      - `description` (text, product description)
      - `current_quantity` (integer, current stock level)
      - `minimum_quantity` (integer, threshold for low stock alert)
      - `unit` (text, unit of measurement like 'kg', 'pieces', 'liters')
      - `category` (text, product category)
      - `barcode` (text, optional barcode)
      - `created_by` (uuid, reference to user who created)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `products` table
    - Add policy for authenticated users to read all products
    - Add policy for authenticated users to insert products
    - Add policy for authenticated users to update products
    - Add policy for authenticated users to delete products
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  current_quantity integer NOT NULL DEFAULT 0,
  minimum_quantity integer NOT NULL DEFAULT 10,
  unit text NOT NULL DEFAULT 'pieces',
  category text DEFAULT '',
  barcode text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(current_quantity, minimum_quantity);