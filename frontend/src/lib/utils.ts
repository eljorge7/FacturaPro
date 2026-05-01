import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanDescription(desc?: string): string {
  if (!desc) return "";
  const bracketIndex = desc.indexOf('[');
  if (bracketIndex !== -1) {
    return desc.substring(0, bracketIndex).trim();
  }
  return desc;
}
