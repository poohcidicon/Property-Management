import { getRoomTypeMasController } from "@/controllers/hotel/unit-matrix";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id } = body;
    if (!project_id) {
      return NextResponse.json({
        message: "Missing required parameters project_id",
        error: 'failed',
        data: [],
      }, { status: 400 });
    }
    const result = await getRoomTypeMasController(body);
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