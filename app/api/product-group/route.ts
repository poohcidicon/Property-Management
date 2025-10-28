import { getProductGroupController } from "@/controllers/product-group";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const response = await getProductGroupController();
    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({
      message: "failed",
      error: err.message,
    }, { status: 500 });
  }
}