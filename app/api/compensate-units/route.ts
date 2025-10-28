import { getCompensateUnitsController } from "@/controllers/compensate-unit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.customer_id) {
      return NextResponse.json({
        message: "❌ Missing required parameters customer_id",
        error: 'failed',
      }, { status: 400 });
    }
    const response = await getCompensateUnitsController(body);
    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({
      message: "failed",
      error: err.message,
    }, { status: 500 });
  }
}