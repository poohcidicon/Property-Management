import { deleteBookMaterialOptionController } from "@/controllers/hotel/material";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    if (!payload.id || !payload.booking_id || !payload.book_room_id) {
      return NextResponse.json({
        success: false,
        data: false,
        error: 'Missing required parameters',
        message: 'Missing required parameters'
      }, { status: 400 });
    }
    const result = await deleteBookMaterialOptionController(payload);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json({
      message: "failed",
      error: 'failed',
      data: false,
    }, { status: 500 });
  }
}