export type FavoriteScope = "session" | "project" | "global"

export type FavoriteSnapshot = {
  text: string
  title: string
  mode: string
  model: string
  createdAt: number
  durationMs?: number
}

export type Favorite = {
  sessionID: string
  projectID: string
  messageID: string
  scope: FavoriteScope
  createdAt: number
  snapshot: FavoriteSnapshot
}

export type FavoriteStore = {
  version: 1
  items: Favorite[]
}

export const emptyFavoriteStore = (): FavoriteStore => ({ version: 1, items: [] })

export function setFavorite(store: FavoriteStore, favorite: Favorite): FavoriteStore {
  const items = store.items.filter(
    (item) => item.sessionID !== favorite.sessionID || item.messageID !== favorite.messageID,
  )
  return { version: 1, items: [...items, favorite] }
}

export function toggleFavorite(store: FavoriteStore, favorite: Favorite): FavoriteStore {
  const current = favoriteFor(store, favorite.sessionID, favorite.messageID)
  if (current?.scope === favorite.scope) return removeFavorite(store, favorite.sessionID, favorite.messageID)
  return setFavorite(store, favorite)
}

export function removeFavorite(store: FavoriteStore, sessionID: string, messageID: string): FavoriteStore {
  return {
    version: 1,
    items: store.items.filter((item) => item.sessionID !== sessionID || item.messageID !== messageID),
  }
}

export function favoriteFor(store: FavoriteStore, sessionID: string, messageID: string): Favorite | undefined {
  return store.items.find((item) => item.sessionID === sessionID && item.messageID === messageID)
}

export function visibleFavorites(store: FavoriteStore, sessionID: string, projectID: string): Favorite[] {
  return store.items.filter(
    (item) =>
      item.scope === "global" ||
      (item.scope === "project" && item.projectID === projectID) ||
      (item.scope === "session" && item.sessionID === sessionID),
  )
}
