# opencode-favorites

Scoped favorites for OpenCode AI messages.

This project is designed for the custom `opencode-foundry` TUI extensions. A favorite keeps both the original message reference and a snapshot of the visible response content, so it remains available after history compression or message removal.

Each message has at most one favorite:

- `session`: visible only in the source session.
- `project`: visible in sessions with the same project ID.
- `global`: visible in every session.

Clicking the active scope removes the favorite. Clicking another scope moves the existing favorite directly to that scope.

The first implementation covers the domain model and persistence contract. Favorite browsing is intentionally a later feature.

## Demo

The plugin adds the three scoped favorite actions directly to the assistant message metadata:

![OpenCode favorites in assistant message metadata](docs/images/print-opencode-favorites.png)

The active scope is shown with a green marker. Selecting another scope moves the favorite directly, while selecting the active scope removes it.

## Compatibility

The TUI integration requires an OpenCode build with the `message_metadata` slot and the host-owned `Action` component. These capabilities are being developed in the `lucas-rulez/opencode-foundry` fork.

After building the package, configure the fork's `tui.json` with:

```json
{
  "plugin": [
    "opencode-favorites/tui"
  ]
}
```
