<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Render the freight-audit layout through one shared React view and dedicated leaf routes, including settings; this preserves navigation without duplicating forms and visual structure.
- Keep disconnected audit screens empty and saving unavailable; presentation work must not simulate persistent records or official financial calculations.
- Keep CT-e detail records typed with explicit component availability states and verified HTTPS document links; this preserves zero versus missing values and prevents fabricated PDFs or calculations.
- Persist operational registrations and append-only tariff versions through authenticated server functions and database role checks; this keeps commercial writes restricted and historical versions immutable.
- Store imported invoice references separately from the original CT-e document source and import each CSV atomically; this avoids a parallel CT-e base and partial or duplicated invoice batches.
- Activate access only for verified identities using database-managed email authorizations; this prevents user metadata from granting privileges.
