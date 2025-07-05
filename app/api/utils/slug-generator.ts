/**
 * Slug generator utility for creating random, cute slugs
 * Used for generating unique identifiers for multi-family support
 */

import { adjectives, animals } from './slug-words';

/**
 * Generate a random slug by combining an adjective and animal
 * @returns A string in the format "adjective-animal"
 */
export function generateSlug(): string {
  // Get a random adjective
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  
  // Get a random animal
  const animal = animals[Math.floor(Math.random() * animals.length)];
  
  // Combine them with a hyphen
  return `${adjective}-${animal}`;
}

/**
 * Generate a random slug with a numeric suffix for additional uniqueness
 * @param digits The number of digits to append (default: 4)
 * @returns A string in the format "adjective-animal-1234"
 */
export function generateSlugWithNumber(digits: number = 4): string {
  // Get the base slug
  const baseSlug = generateSlug();
  
  // Generate a random number with the specified number of digits
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Combine the base slug with the number
  return `${baseSlug}-${randomNumber}`;
}

/**
 * Check if a string is a valid slug format
 * @param slug The string to check
 * @returns Boolean indicating if the string matches the slug format
 */
export function isValidSlug(slug: string): boolean {
  // Basic validation for adjective-animal format
  const parts = slug.split('-');
  
  // Should have at least two parts
  if (parts.length < 2) {
    return false;
  }
  
  const adjective = parts[0];
  const animal = parts[1];
  
  // Check if the adjective and animal are in our lists
  return adjectives.includes(adjective) && animals.includes(animal);
}

/**
 * Generate a batch of unique slugs
 * @param count Number of slugs to generate
 * @param withNumbers Whether to include numeric suffixes
 * @returns Array of unique slug strings
 */
export function generateSlugs(count: number, withNumbers: boolean = false): string[] {
  const slugs = new Set<string>();
  
  // Keep generating until we have the requested count
  while (slugs.size < count) {
    const slug = withNumbers ? generateSlugWithNumber() : generateSlug();
    slugs.add(slug);
  }
  
  return Array.from(slugs);
}
