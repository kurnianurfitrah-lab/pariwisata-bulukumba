// Utility function to get full image URL
export function getImageUrl(imagePath) {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Use the same API prefix as Axios. In development Vite proxies /api,
  // while production Nginx forwards it to the private Express process.
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
  
  // If imagePath starts with /, use it directly
  if (imagePath.startsWith('/')) {
    return `${serverBaseUrl}${imagePath}`;
  }
  
  // Otherwise, add /uploads/ prefix
  return `${serverBaseUrl}/uploads/${imagePath}`;
}
