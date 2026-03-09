export type ExpensesModuleProps = Record<string, never>;

export function ExpensesModule() {
  return (
    <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">Dépenses</p>
        <h2 className="text-foreground text-xl font-semibold">Suivi des frais</h2>
        <p className="text-muted-foreground text-sm">
          La gestion des budgets, remboursements et partages arrivera bientôt. Vous pourrez suivre
          qui paye quoi et équilibrer automatiquement les comptes.
        </p>
      </div>
      <div className="border-border text-muted-foreground mt-4 rounded-xl border border-dashed px-4 py-5 text-sm">
        Placeholder : liste des dépenses, équilibre en temps réel, export CSV.
      </div>
    </div>
  );
}
