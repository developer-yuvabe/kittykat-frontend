"use server";

import { revalidatePath as _revalidatePath } from "next/cache";

export const revalidatedPath = (path: string, type?: "layout" | "page") => {
  _revalidatePath(path, type);
};
