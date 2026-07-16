export type BattleMode = "quick" | "twoPlayers";

export function battleModeFromSearch(search: string): BattleMode {
  const params = new URLSearchParams(search);
  const mode = params.get("mode");
  if (mode === "quick" || mode === "twoPlayers") {
    return mode;
  }
  return params.get("player") === "B" ? "twoPlayers" : "quick";
}

export function battleReturnQuery(search: string): string {
  const params = new URLSearchParams(search);
  if (params.get("returnTo") !== "battle") {
    return "";
  }

  const result = new URLSearchParams({
    returnTo: "battle",
    mode: battleModeFromSearch(search),
    player: params.get("player") === "B" ? "B" : "A",
  });
  return `?${result.toString()}`;
}

export function battleDestination(
  search: string,
  cardId: string,
): string | null {
  const params = new URLSearchParams(search);
  if (params.get("returnTo") !== "battle") {
    return null;
  }

  const result = new URLSearchParams({
    mode: battleModeFromSearch(search),
    player: params.get("player") === "B" ? "B" : "A",
    card: cardId,
  });
  return `/battle?${result.toString()}`;
}
