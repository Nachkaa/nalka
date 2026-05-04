"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBudgetSetup } from "@/features/budget/server/mutations/update-budget-setup";

type Props = {
  eventSlug: string;
  title: string;
  intro: string;
  allowSkip?: boolean;
  initialValue?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

export function BudgetTotalSetupCard({
  eventSlug,
  title,
  intro,
  allowSkip = false,
  initialValue = "",
  compact = false,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [totalBudget, setTotalBudget] = useState(initialValue);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setTotalBudget(initialValue);
    setFieldError(null);
    setFormError(null);
  }, [initialValue]);

  const handleSuccess = () => {
    onSuccess?.();
    router.refresh();
  };

  const handleDefine = () => {
    startTransition(async () => {
      setFieldError(null);
      setFormError(null);
      const result = await updateBudgetSetup({
        intent: "define",
        eventSlug,
        totalBudget,
      });

      if (!result.ok) {
        setFieldError(result.fieldErrors?.totalBudget ?? null);
        setFormError(result.formError ?? null);
        return;
      }

      handleSuccess();
    });
  };

  const handleSkip = () => {
    startTransition(async () => {
      setFieldError(null);
      setFormError(null);
      const result = await updateBudgetSetup({
        intent: "skip",
        eventSlug,
      });

      if (!result.ok) {
        setFormError(result.formError ?? null);
        return;
      }

      handleSuccess();
    });
  };

  return (
    <Card className={compact ? "border-dashed" : undefined}>
      <CardHeader className={compact ? "pb-3" : undefined}>
        <CardTitle className={compact ? "text-lg" : "text-2xl"}>{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{intro}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="budget-total-setup">Budget global</Label>
          <Input
            id="budget-total-setup"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Ex. 5000"
            value={totalBudget}
            onChange={(event) => setTotalBudget(event.target.value)}
          />
          {fieldError ? <p className="text-sm text-red-600">{fieldError}</p> : null}
        </div>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={handleDefine} disabled={pending}>
            {pending ? "Enregistrement..." : "Enregistrer le budget"}
          </Button>
          {allowSkip ? (
            <Button type="button" variant="ghost" onClick={handleSkip} disabled={pending}>
              Je le définirai plus tard
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
