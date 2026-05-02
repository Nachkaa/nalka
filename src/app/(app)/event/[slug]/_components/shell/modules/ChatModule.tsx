export type ChatModuleProps = Record<string, never>;

export function ChatModule() {
  return (
    <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">Chat</p>
        <h2 className="text-foreground text-xl font-semibold">Discussions</h2>
        <p className="text-muted-foreground text-sm">
          Le chat temps réel arrivera bientôt. Vous pourrez partager des messages, photos et
          réactions directement depuis la page de l’événement.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <div className="border-border text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-sm">
          Flux de messages et notifications
        </div>
        <div className="border-border text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-sm">
          Fils dédiés par module (cadeaux, potluck, etc.)
        </div>
      </div>
    </div>
  );
}
