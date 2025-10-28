
import { updateRoomStatusController } from "@/controllers/hotel/unit-matrix";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    if (!payload.unit_id || !payload.active_date) {
      return NextResponse.json({ 
        success: false, 
        data: false, 
        error: 'Missing required parameters', 
        message: 'Missing required parameters' 
      }, { status: 400 });
    }
    const result = await updateRoomStatusController(payload);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json({
      message: "failed",
      error: 'failed',
      data: false,
    }, { status: 500 });
  }
}