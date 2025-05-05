/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts a Firestore timestamp to a JavaScript Date
 * @param timestamp Firestore timestamp or any date-like value
 * @returns JavaScript Date object
 */
export function toDate(timestamp: any): Date {
  // If it's a Firestore timestamp with toDate method
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate()
  }
  // If it's a timestamp object with seconds property (Firestore serialized timestamp)
  else if (timestamp && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000)
  }
  // If it's already a Date
  else if (timestamp instanceof Date) {
    return timestamp
  }
  // If it's a valid timestamp number
  else if (typeof timestamp === "number" && !isNaN(timestamp)) {
    return new Date(timestamp)
  }
  // If it's a string that can be parsed as a date
  else if (typeof timestamp === "string" && !isNaN(Date.parse(timestamp))) {
    return new Date(timestamp)
  }
  // Fallback to current date if invalid
  return new Date()
}