/** @jsxImportSource @opentui/solid */
import { createMemo, createSignal, For, Show } from "solid-js"
import type { Part, Message } from "@opencode-ai/sdk/v2"
import type { TuiPluginModule, TuiSlotContext } from "@opencode-ai/plugin/tui"
import type { JSX } from "@opentui/solid"
import type { RGBA } from "@opentui/core"
import {
  emptyFavoriteStore,
  favoriteFor,
  groupVisibleFavorites,
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

type SidebarContentProps = {
  session_id: string
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

type TuiApi = Parameters<NonNullable<TuiPluginModule["tui"]>>[0]

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
        message_metadata(ctx: TuiSlotContext, props: MessageMetadataProps) {
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
        sidebar_content(ctx: TuiSlotContext, props: SidebarContentProps) {
          return <FavoritesSidebar api={api} ctx={ctx} sessionID={props.session_id} store={store} />
        },
      },
    })
  },
}

export default Favorites

function FavoritesSidebar(props: {
  api: TuiApi
  ctx: TuiSlotContext
  sessionID: string
  store: () => FavoriteStore
}) {
  const action = (props.ctx as ActionContext).Action
  const session = createMemo(() => props.api.state.session.get(props.sessionID))
  const [open, setOpen] = createSignal(true)
  const [openScopes, setOpenScopes] = createSignal<Record<FavoriteScope, boolean>>({
    session: true,
    project: true,
    global: true,
  })
  const groups = createMemo(() => {
    const projectID = session()?.projectID
    if (!projectID) return { session: [], project: [], global: [] } as Record<FavoriteScope, Favorite[]>
    return groupVisibleFavorites(props.store(), props.sessionID, projectID)
  })
  const Action = action

  if (typeof action !== "function") return null

  const toggleScope = (scope: FavoriteScope) => {
    setOpenScopes((current) => ({ ...current, [scope]: !current[scope] }))
  }

  return (
    <box flexDirection="column" gap={1}>
      <Action onClick={() => setOpen((current) => !current)} fg={props.ctx.theme.current.text}>
        {open() ? "▾ " : "▸ "}FAVS
      </Action>
      <Show when={open()}>
        <box flexDirection="column" paddingLeft={2} gap={1}>
          <For each={scopes}>
            {(scope) => {
              const items = () => groups()[scope]
              return (
                <box flexDirection="column">
                  <Action
                    onClick={() => toggleScope(scope)}
                    fg={props.ctx.theme.current.textMuted}
                  >
                    {openScopes()[scope] ? "▾ " : "▸ "}
                    {labels[scope]}
                  </Action>
                  <Show when={openScopes()[scope]}>
                    <Show when={items().length > 0} fallback={<text fg={props.ctx.theme.current.textMuted}> (empty)</text>}>
                      <For each={items()}>
                        {(favorite) => <text fg={props.ctx.theme.current.text}>{favorite.snapshot.title}</text>}
                      </For>
                    </Show>
                  </Show>
                </box>
              )
            }}
          </For>
        </box>
      </Show>
    </box>
  )
}

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
