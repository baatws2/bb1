/*
  # Add Product Image, Expiry Date, and Location Fields

  1. Changes
    - Add `image_url` column to store product image URL
    - Add `expiry_date` column to store product expiration date
    - Add `location` column to store product location (رفوف، ثلاجات، مستودع، شبس)
    - Make `current_quantity` optional (nullable)

  2. Notes
    - Images will be stored in Supabase Storage
    - Expiry date is required field
    - Location is optional field
    - Quantity is now optional
*/

-- Add new columns to products table
DO $$
BEGIN
  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url text;
  END IF;

  -- Add expiry_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'expiry_date'
  ) THEN
    ALTER TABLE products ADD COLUMN expiry_date date NOT NULL DEFAULT CURRENT_DATE;
  END IF;

  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'location'
  ) THEN
    ALTER TABLE products ADD COLUMN location text;
  END IF;
END $$;

-- Make current_quantity nullable
ALTER TABLE products ALTER COLUMN current_quantity DROP NOT NULL;