/**
 * Utility untuk parsing dan serialisasi multi-foto aset (maksimal 5 foto).
 * Menjamin kompatibilitas mundur dengan data foto tunggal lama.
 */

export function parseFotoList(value: string | null | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  // 1. Coba parse JSON array: ["/uploads/foto1.jpg", "/uploads/foto2.jpg"]
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .slice(0, 5); // Batas maksimal 5 foto
    }
  } catch {
    // Bukan format JSON, lanjutkan ke fallback
  }

  // 2. Format dipisahkan koma
  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 5);
  }

  // 3. Format URL tunggal legacy
  return [trimmed];
}

export function serializeFotoList(photos: string[]): string {
  const valid = photos
    .filter((p) => typeof p === "string" && p.trim().length > 0)
    .slice(0, 5);
  return valid.length > 0 ? JSON.stringify(valid) : "";
}

