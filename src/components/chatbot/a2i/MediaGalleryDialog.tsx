import React from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MediaLibrary } from "@/app/(main)/gallery/_components/MediaLibrary";

export function MediaLibraryDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Media Library</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <main className="min-h-[80vh] w-full bg-[#F3F4F6] rounded-3xl p-4 md:p-6">
          <MediaLibrary />
        </main>
      </DialogContent>
    </Dialog>
  );
}
