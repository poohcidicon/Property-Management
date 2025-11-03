import { genGenMemberIDController } from "@/controllers/customer";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.item_id) {
      return NextResponse.json({
        message: "❌ Missing required parameters item_id",
        error: 'failed',
      }, { status: 400 });
    }
    const response = await genGenMemberIDController(body);
    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({
      message: "failed",
      error: 'failed',
    }, { status: 500 });
  }
}