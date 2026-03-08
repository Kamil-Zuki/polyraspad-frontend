import type { CardResponseDto } from "@/lib/api/types"

export function resolveCardViewModalCard(
  fetchedCard?: CardResponseDto | null,
  initialCard?: CardResponseDto | null,
): CardResponseDto | null {
  return fetchedCard ?? initialCard ?? null
}
