import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isSquareImage = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Check if width and height are the same (square)
      const isSquare = img.width === img.height;
      URL.revokeObjectURL(img.src); // Clean up
      resolve(isSquare);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src); // Clean up
      resolve(false);
    };
    img.src = URL.createObjectURL(file);
  });
};
