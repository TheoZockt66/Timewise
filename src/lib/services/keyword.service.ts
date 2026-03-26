import { createClient } from "@/lib/supabase/server";

export async function deleteKeyword(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("keywords")
    .delete()
    .eq("id", id);

  return {
    data: null,
    error,
  };
}

export async function updateKeyword(
  id: string,
  data: {
    label?: string;
    color?: string;
    description?: string;
  }
) {
  const supabase = await createClient();

  const { data: updatedKeyword, error } = await supabase
    .from("keywords")
    .update(data)
    .eq("id", id)
    .select();

  return {
    data: updatedKeyword,
    error,
  };
}