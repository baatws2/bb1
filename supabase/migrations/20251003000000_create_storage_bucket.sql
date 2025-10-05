/*
  # Create Storage Bucket for Product Images

  1. Storage
    - Create public bucket `product-images` for storing product images
    - Enable public access for viewing images
*/

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
