import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseStorage } from "@/utils/environment";

// Helper function to generate unique filenames
const generateUniqueFilename = (fileExt: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${randomStr}.${fileExt}`;
};

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export const ImageUpload = ({ 
  images, 
  onImagesChange, 
  maxImages = 5, 
  className = "" 
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB limit
    );

    if (validFiles.length === 0) {
      alert('Пожалуйста, выберите только изображения размером до 5MB');
      return;
    }

    if (images.length + validFiles.length > maxImages) {
      alert(`Максимум ${maxImages} изображений`);
      return;
    }

    setUploading(true);

    try {
      if (useSupabaseStorage()) {
        // Используем Supabase Storage в продакшене
        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          alert('Необходимо авторизоваться для загрузки изображений');
          return;
        }

        const uploadPromises = validFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = generateUniqueFilename(fileExt || 'jpg');
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);

          if (uploadError) {
            throw uploadError;
          }

          const { data } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

          return data.publicUrl;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        onImagesChange([...images, ...uploadedUrls]);
      } else {
        // Используем base64 в локальной разработке
        const uploadPromises = validFiles.map(async (file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              resolve(result);
            };
            reader.readAsDataURL(file);
          });
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        onImagesChange([...images, ...uploadedUrls]);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Ошибка при загрузке изображений');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Изображения</label>
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Загруженные изображения */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((url, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Кнопка загрузки */}
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={openFileDialog}
            disabled={uploading}
            className="w-full h-24 border-dashed border-2 hover:bg-blue-500/20 hover:text-foreground transition-colors"
          >
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <Upload className="h-6 w-6 animate-pulse" />
                  <span className="text-sm">Загрузка...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-sm">
                    {images.length === 0 ? 'Добавить изображения' : 'Добавить еще'}
                  </span>
                </>
              )}
            </div>
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Поддерживаются форматы: JPG, PNG, GIF. Максимум {maxImages} изображений, до 5MB каждое.
        {!useSupabaseStorage() && (
          <span className="block text-yellow-600 font-medium">
            ⚠️ Локальный режим: изображения сохраняются в base64
          </span>
        )}
      </p>
    </div>
  );
};

