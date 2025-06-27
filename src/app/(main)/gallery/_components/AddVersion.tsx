import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import React from "react";

const AddVersion = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Add New Version</h2>
          <p className="text-sm text-muted-foreground">
            Upload a new version of the item.
          </p>
          {/* Add your form or input fields here */}
          <input type="file" accept="image/*" className="border p-2 rounded" />
          <button className="btn btn-primary mt-4">Upload</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVersion;
