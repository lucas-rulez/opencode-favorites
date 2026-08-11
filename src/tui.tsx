/** @jsxImportSource @opentui/solid */
import { createSignal } from "solid-js"
import type { Part, Message } from "@opencode-ai/sdk/v2"
import type { TuiPluginModule, TuiSlotContext } from "@opencode-ai/plugin/tui"
import type { JSX } from "@opentui/solid"
import type { RGBA } from "@opentui/core"
import {
  emptyFavoriteStore,
  favoriteFor,
  toggleFavorite,
  type Favorite,
  type FavoriteScope,
  type FavoriteStore,
} from "./favorites.js"

const STORAGE_KEY = "opencode-favorites.store"
const scopes: FavoriteScope[] = ["session", "project", "global"]
const labels: Record<FavoriteScope, string> = {
  session: "Session",
  project: "Project",
  global: "Global",
}

type MessageMetadataProps = {
  session_id: string
  message_id: string
}

type ActionContext = TuiSlotContext & {
  Action: TuiAction
}

type TuiAction = (props: {
  onClick: () => void
  children?: JSX.Element | string
  fg?: RGBA
  bg?: RGBA
}) => JSX.Element

const Favorites: TuiPluginModule = {
  id: "opencode-favorites",
  tui: async (api) => {
    const [store, setStore] = createSignal(readStore(api.kv.get(STORAGE_KEY)))

    const save = (next: FavoriteStore) => {
      setStore(next)
      api.kv.set(STORAGE_KEY, next)
    }

    api.slots.register({
      slots: {
        message_metadata(ctx, props: MessageMetadataProps) {
          const action = (ctx as ActionContext).Action
          const session = api.state.session.get(props.session_id)
          const message = api.state.session
            .messages(props.session_id)
            .find((item) => item.id === props.message_id)
          if (!session || !message || message.role !== "assistant" || typeof action !== "function") return null

          const text = textOf(api.state.part(props.message_id))
          if (!text) return null

          const favorite = favoriteFor(store(), props.session_id, props.message_id)
          const snapshot = createSnapshot(message, text, api.state.session.messages(props.session_id))
          const Action = action

          const update = (scope: FavoriteScope) => {
            const next = toggleFavorite(store(), {
              sessionID: props.session_id,
              projectID: session.projectID,
              messageID: props.message_id,
              scope,
              createdAt: Date.now(),
              snapshot,
            })
            save(next)
            api.ui.toast({
              variant: favorite?.scope === scope ? "info" : "success",
              message: favorite?.scope === scope ? "Favorite removed" : `Favorite set to ${labels[scope]}`,
            })
          }

          return (
            <box flexDirection="row" marginTop={1}>
              <text fg={ctx.theme.current.textMuted}> · Add to favorites: </text>
              {scopes.map((scope, index) => (
                <>
                  {index > 0 ? <text fg={ctx.theme.current.textMuted}> | </text> : null}
                  <Action
                    onClick={() => update(scope)}
                    fg={favorite?.scope === scope ? ctx.theme.current.success : ctx.theme.current.markdownLinkText}
                  >
                    {favorite?.scope === scope ? "• " : ""}
                    {labels[scope]}
                  </Action>
                </>
              ))}
            </box>
          )
        },
      },
    })
  },
}

export default Favorites

function readStore(value: unknown): FavoriteStore {
  if (!value || typeof value !== "object") return emptyFavoriteStore()
  if (!("version" in value) || value.version !== 1) return emptyFavoriteStore()
  if (!("items" in value) || !Array.isArray(value.items)) return emptyFavoriteStore()
  return value as FavoriteStore
}

function textOf(parts: readonly Part[]) {
  return parts
    .filter((part): part is Extract<Part, { type: "text" }> => part.type === "text" && !part.synthetic)
    .map((part) => part.text)
    .join("\n")
    .trim()
}

function createSnapshot(message: Extract<Message, { role: "assistant" }>, text: string, messages: readonly Message[]) {
  const parent = messages.find((item) => item.id === message.parentID && item.role === "user")
  return {
    text,
    title: text.replace(/\s+/g, " ").slice(0, 96),
    mode: message.mode,
    model: message.modelID,
    createdAt: message.time.created,
    durationMs: message.time.completed && parent ? message.time.completed - parent.time.created : undefined,
  }
}
