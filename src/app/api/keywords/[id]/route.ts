import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { id } = params;

  const { error } = await supabase
    .from("keywords")
    .delete()
    .eq("id", id);

  return NextResponse.json({
    data: null,
    error,
  });
}