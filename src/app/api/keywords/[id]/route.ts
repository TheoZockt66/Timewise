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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { id } = params;

  const body = await request.json();

  const { label, color, description } = body;

  const { data, error } = await supabase
    .from("keywords")
    .update({
      label,
      color,
      description,
    })
    .eq("id", id)
    .select();

  return NextResponse.json({
    data,
    error,
  });
}