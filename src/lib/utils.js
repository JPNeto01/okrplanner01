import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const sanitizeFileName = (fileName) => {
  if (typeof fileName !== 'string') {
    return `invalid_name_${Date.now()}`;
  }

  const extensionMatch = fileName.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
  const extension = extensionMatch ? `.${extensionMatch[1]}` : '';
  const nameWithoutExtension = extensionMatch ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;

  const cleanedName = nameWithoutExtension
    .normalize("NFD") 
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-zA-Z0-9._\-\s]/g, '') 
    .replace(/\s+/g, '_') 
    .replace(/__+/g, '_') 
    .replace(/--+/g, '-') 
    .toLowerCase();
  
  let finalName = cleanedName.replace(/^[_.-]+|[_.-]+$/g, '').replace(/\.\.+/g, '.');
  if (!finalName) {
    finalName = `file_${Date.now()}`;
  }
  
  return finalName + extension;
};