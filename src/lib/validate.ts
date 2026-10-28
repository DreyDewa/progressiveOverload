import mongoose from 'mongoose';

export function cleanName(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  return name.length >= 1 && name.length <= max ? name : null;
}

/** A list of distinct, valid ObjectId strings (at most `max`), or null. Ownership is checked by the caller. */
export function idList(value: unknown, max = 30): string[] | null {
  if (
    !Array.isArray(value) ||
    value.length > max ||
    !value.every((i) => typeof i === 'string' && mongoose.isValidObjectId(i)) ||
    new Set(value).size !== value.length
  ) {
    return null;
  }
  return value as string[];
}
