import { insBookMaterialOptionController } from "@/controllers/hotel/material";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const result = await insBookMaterialOptionController(payload);
        return NextResponse.json(result, { status: result.success ? 200 : 500 });
    } catch (err: any) {
        return NextResponse.json({
            message: "failed",
            error: 'failed',
            data: false,
        }, { status: 500 });
    }
}