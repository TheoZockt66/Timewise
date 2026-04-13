"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalList } from "@/components/goals/GoalList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGoals, createEmptyGoalFormValues, goalToFormValues } from "@/hooks/useGoals";
import { useToast } from "@/hooks/use-toast";
import type { GoalWithProgress } from "@/types";

export default function GoalsPage() {
  const [newGoalValues, setNewGoalValues] = useState(createEmptyGoalFormValues());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState(createEmptyGoalFormValues());

  const {
    goals,
    availableKeywords,
    loading,
    saving,
    deletingId,
    error,
    refetch,
    createGoalEntry,
    updateGoalEntry,
    deleteGoalEntry,
  } = useGoals();

  const { toast } = useToast();

  function startEdit(goal: GoalWithProgress) {
    setEditingId(goal.id);
    setEditValues(goalToFormValues(goal));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(createEmptyGoalFormValues());
  }

  async function handleCreate() {
    const result = await createGoalEntry(newGoalValues);

    if (result.error) {
      toast({ title: "Fehler", description: result.error.message });
      return;
    }

    setNewGoalValues(createEmptyGoalFormValues());
    toast({ title: "Erfolg", description: "Ziel erfolgreich erstellt", duration: 3000 });
  }

  async function handleSave(id: string) {
    const result = await updateGoalEntry(id, editValues);

    if (result.error) {
      toast({ title: "Fehler", description: result.error.message });
      return;
    }

    cancelEdit();
    toast({ title: "Erfolg", description: "Ziel gespeichert" });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Möchtest du dieses Ziel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
    );

    if (!confirmed) return;

    const result = await deleteGoalEntry(id);

    if (result.error) {
      toast({ title: "Fehler", description: result.error.message });
      return;
    }

    if (editingId === id) {
      cancelEdit();
    }

    toast({ title: "Erfolg", description: "Ziel gelöscht" });
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-block">
            <Image
              src="/timewise-logo.svg"
              alt="Timewise Logo"
              width={216}
              height={56}
              className="h-14 w-[216px] object-contain"
            />
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meine Ziele</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Definiere Lernziele, weise Keywords zu und verfolge deinen Fortschritt
            automatisch.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Neues Ziel erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalForm
              values={newGoalValues}
              availableKeywords={availableKeywords}
              submitLabel="Hinzufügen"
              disabled={saving}
              onChange={setNewGoalValues}
              onSubmit={handleCreate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meine Ziele</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Ziele werden geladen...</p>
            ) : error ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" onClick={() => void refetch()}>
                  Erneut laden
                </Button>
              </div>
            ) : (
              <GoalList
                goals={goals}
                availableKeywords={availableKeywords}
                editingId={editingId}
                editValues={editValues}
                disabled={saving || deletingId !== null}
                onEditValuesChange={setEditValues}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSave={(id) => void handleSave(id)}
                onDelete={(id) => void handleDelete(id)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
