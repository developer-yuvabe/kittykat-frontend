"use client";

import { BrandPersona, PersonaUpdateRequest } from "@/types/persona.types";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import BrandPersonaCarousel from "./BrandPersonaCarousel";
import BrandPersonaEmptyState from "./BrandPersonaEmptyState";
import BrandPersonaDialog from "./BrandPersonaDialog";
import { useGeneratePersonas, useUpdatePersona } from "@/hooks/usePersona";
import { createPersona } from "@/services/api/persona.service";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContentSection } from "@/components/shared/ContentSection";
import { useBrandStore } from "@/store/brand.store";

type BrandPersonasProps = {
  personas?: BrandPersona[];
};

function BrandPersonas({ personas = [] }: BrandPersonasProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "duplicate">(
    "create"
  );
  const [selectedPersona, setSelectedPersona] = useState<BrandPersona | null>(
    null
  );
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateCount, setGenerateCount] = useState(3);

  const { selectedBrandId: brandId } = useBrandStore();

  // Queries and mutations
  const { mutateAsync: generatePersonas, isPending: isGenerating } =
    useGeneratePersonas();
  const { mutateAsync: updatePersona } = useUpdatePersona();

  const handleCreate = () => {
    setSelectedPersona(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (persona: BrandPersona) => {
    setSelectedPersona(persona);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDuplicate = (persona: BrandPersona) => {
    setSelectedPersona(persona);
    setDialogMode("duplicate");
    setDialogOpen(true);
  };

  const handleGenerateWithAI = () => {
    setGenerateDialogOpen(true);
  };

  const handleConfirmGenerate = async () => {
    const promise = generatePersonas({
      brandId: brandId!,
      n: generateCount,
      saveToDb: true,
    });

    await toast.promise(promise, {
      loading: "Generating personas...",
      success: (result) => {
        setGenerateDialogOpen(false);
        return `Generated ${result.count} persona${
          result.count > 1 ? "s" : ""
        } successfully`;
      },
      error: "Failed to generate personas",
    });
  };

  const handleSave = async (data: PersonaUpdateRequest) => {
    if (dialogMode === "create" || dialogMode === "duplicate") {
      // Create new persona
      await createPersona(brandId!, data);
    } else if (dialogMode === "edit" && selectedPersona) {
      // Update existing persona
      await updatePersona({
        brandId: brandId!,
        personaId: selectedPersona.id,
        updates: data,
      });
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleCreate} size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Create
      </Button>
      <Button onClick={handleGenerateWithAI} size="sm" disabled={isGenerating}>
        {isGenerating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        {isGenerating ? "Generating..." : "Generate with AI"}
      </Button>
    </div>
  );

  // Show empty state if no personas
  if (!personas || personas.length === 0) {
    return (
      <ContentSection
        title="Brand Personas"
        showCopy={false}
        showPin={false}
        customActions={headerActions}
        context={{ data: { brandId } }}
        content={
          <>
            <BrandPersonaEmptyState
              isLoading={isGenerating}
              onGenerate={handleGenerateWithAI}
              onCreate={handleCreate}
            />

            {/* Generate Dialog */}
            <AlertDialog
              open={generateDialogOpen}
              onOpenChange={setGenerateDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Generate Personas with AI</AlertDialogTitle>
                  <AlertDialogDescription>
                    AI will analyze your brand information and create
                    differentiated personas representing your target audience
                    segments. How many personas would you like to generate?
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4">
                  <label className="text-sm font-medium mb-2 block">
                    Number of personas (1-10)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={generateCount}
                      onChange={(e) =>
                        setGenerateCount(
                          Math.max(
                            1,
                            Math.min(10, parseInt(e.target.value) || 3)
                          )
                        )
                      }
                      className="w-20 px-3 py-2 border rounded-md"
                    />
                    <span className="text-sm text-muted-foreground">
                      Recommended: 3-5 personas
                    </span>
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isGenerating}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Create/Edit Dialog */}
            <BrandPersonaDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              persona={selectedPersona}
              brandId={brandId!}
              onSave={handleSave}
              mode={dialogMode}
            />
          </>
        }
      />
    );
  }

  return (
    <ContentSection
      title="Brand Personas"
      showCopy={false}
      showPin={false}
      customActions={headerActions}
      context={{ data: { brandId, personasCount: personas.length } }}
      content={
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Target audience segments for your brand
          </p>

          <BrandPersonaCarousel
            personas={personas}
            brandId={brandId!}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={() => {
              // SSE will handle the update
            }}
          />

          {/* Generate Dialog */}
          <AlertDialog
            open={generateDialogOpen}
            onOpenChange={setGenerateDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Generate Personas with AI</AlertDialogTitle>
                <AlertDialogDescription>
                  AI will analyze your brand information and create
                  differentiated personas. This will add to your existing
                  personas. How many would you like to generate?
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">
                  Number of personas (1-10)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={generateCount}
                    onChange={(e) =>
                      setGenerateCount(
                        Math.max(1, Math.min(10, parseInt(e.target.value) || 3))
                      )
                    }
                    className="w-20 px-3 py-2 border rounded-md"
                  />
                  <span className="text-sm text-muted-foreground">
                    Recommended: 3-5 personas
                  </span>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isGenerating}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Create/Edit Dialog */}
          <BrandPersonaDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            persona={selectedPersona}
            brandId={brandId!}
            onSave={handleSave}
            mode={dialogMode}
          />
        </div>
      }
    />
  );
}

export default BrandPersonas;
