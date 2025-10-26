-- Добавляем поле images в таблицу requests
ALTER TABLE requests ADD COLUMN images TEXT[];

-- Добавляем поле images в таблицу offers
ALTER TABLE offers ADD COLUMN images TEXT[];

-- Создаем bucket для хранения изображений
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Настраиваем политики для bucket images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);




