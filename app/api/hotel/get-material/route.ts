import { getMaterialController } from "@/controllers/hotel/material";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await getMaterialController();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err: any) {
    return NextResponse.json({
      message: "failed",
      error: 'failed',
      data: [],
    }, { status: 500 });
  }
}