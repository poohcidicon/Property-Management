import { getRoomTypeMasController } from "@/controllers/hotel/unit-matrix";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const result = await getRoomTypeMasController();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  }
  catch (err: any) {
    return NextResponse.json({
      message: "failed",
      error: 'failed',
      data: [],
    }, { status: 500 });
  }
}