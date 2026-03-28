import { createClient } from "@/lib/supabase/server";
import { validateKeyword } from "@/lib/validators/keyword.validator";

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

export async function createKeyword(data: {
  label?: string;
  color?: string;
  user_id: string;
}) {
  const validation = validateKeyword(data);

  if (!validation.valid) {
    return {
      data: null,
      error: {
        message: validation.error,
      },
    };
  }

  const supabase = await createClient();

  const { data: newKeyword, error } = await supabase
    .from("keywords")
    .insert({
      label: data.label,
      color: data.color,
      user_id: data.user_id,
    })
    .select()
    .single();

  return {
    data: newKeyword,
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
  const validation = validateKeyword(data);

  if (!validation.valid) {
    return {
      data: null,
      error: {
        message: validation.error,
      },
    };
  }

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