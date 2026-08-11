# opencode-favorites

Scoped favorites for OpenCode AI messages.

This project is designed for the custom `opencode-foundry` TUI extensions. A favorite keeps both the original message reference and a snapshot of the visible response content, so it remains available after history compression or message removal.

Each message has at most one favorite:

- `session`: visible only in the source session.
- `project`: visible in sessions with the same project ID.
- `global`: visible in every session.

Clicking the active scope removes the favorite. Clicking another scope moves the existing favorite directly to that scope.

The first implementation covers the domain model and persistence contract. Favorite browsing is intentionally a later feature.
