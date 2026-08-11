import { expect, test } from "bun:test"
import {
  emptyFavoriteStore,
  favoriteFor,
  removeFavorite,
  setFavorite,
  visibleFavorites,
  type Favorite,
} from "../src/favorites"

const snapshot = {
  text: "A useful answer",
  title: "A useful answer",
  mode: "plan",
  model: "GPT-5.6 Luna",
  createdAt: 1,
}

const favorite = (scope: Favorite["scope"]): Favorite => ({
  sessionID: "ses_one",
  projectID: "prj_one",
  messageID: "msg_one",
  scope,
  createdAt: 2,
  snapshot,
})

test("a message has one favorite and changing scope replaces it", () => {
  const session = setFavorite(emptyFavoriteStore(), favorite("session"))
  const project = setFavorite(session, favorite("project"))

  expect(project.items).toHaveLength(1)
  expect(favoriteFor(project, "ses_one", "msg_one")?.scope).toBe("project")
})

test("removing the active favorite leaves the message unfavorited", () => {
  const store = setFavorite(emptyFavoriteStore(), favorite("global"))

  expect(removeFavorite(store, "ses_one", "msg_one").items).toEqual([])
})

test("visibility follows the favorite scope", () => {
  const store = ["session", "project", "global"].reduce(
    (current, scope) =>
      setFavorite(current, {
        ...favorite(scope as Favorite["scope"]),
        messageID: `msg_${scope}`,
      }),
    emptyFavoriteStore(),
  )

  expect(visibleFavorites(store, "ses_one", "prj_one").map((item) => item.messageID)).toEqual([
    "msg_session",
    "msg_project",
    "msg_global",
  ])
  expect(visibleFavorites(store, "ses_two", "prj_one").map((item) => item.messageID)).toEqual([
    "msg_project",
    "msg_global",
  ])
  expect(visibleFavorites(store, "ses_two", "prj_two").map((item) => item.messageID)).toEqual(["msg_global"])
})
