import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createKeyword } from "@/lib/services/keyword.service";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      data: null,
      error: { message: "Nicht eingeloggt" },
    });
  }

  const body = await request.json();

  const result = await createKeyword({
    ...body,
    user_id: user.id,
  });

  return NextResponse.json(result);
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      data: [],
      error: null,
    });
  }

  const { data, error } = await supabase
    .from("keywords")
    .select("*")
    .eq("user_id", user.id);

  return NextResponse.json({
    data,
    error,
  });
}