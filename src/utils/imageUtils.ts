/**
 * Transforms an image path to use the storage API route
 * Converts paths like "profiles/profile_2936_1765831932.jpg" 
 * to "/api/storage/profiles/profile_2936_1765831932.jpg"
 * 
 * @param imagePath - The image path from the backend (e.g., "profiles/profile_2936_1765831932.jpg")
 * @returns The transformed path using the storage API route
 */
export const getStorageImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) {
    return null;
  }

  // If it's already a full URL (http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's already using the storage API route, return as is
  if (imagePath.startsWith('/api/storage/')) {
    return imagePath;
  }

  // If it's a data URL (base64), return as is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

  // Transform to storage API route
  return `/api/storage/${cleanPath}`;
};

