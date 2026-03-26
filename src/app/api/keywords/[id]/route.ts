import { NextResponse } from "next/server";
import { deleteKeyword, updateKeyword } from "@/lib/services/keyword.service";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const result = await deleteKeyword(id);

  return NextResponse.json(result);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();

  const result = await updateKeyword(id, body);

  return NextResponse.json(result);
}