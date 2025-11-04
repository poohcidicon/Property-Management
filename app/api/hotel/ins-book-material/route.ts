import { autherizeUser } from "@/controllers/auth";
import { insBookMaterialOptionController } from "@/controllers/hotel/material";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const userSession = await autherizeUser()
        if (!userSession.data?.user_id){
            return NextResponse.json({
            message: "❌ User is not authorized",
            error: 'User is not authorized',
            data: null
            }, { status: 401 })
        }
        const payload = await req.json();
        const result = await insBookMaterialOptionController({
            ...payload,
            create_by: userSession.data?.user_id
        });
        return NextResponse.json(result, { status: result.success ? 200 : 500 });
    } catch (err: any) {
        return NextResponse.json({
            message: "failed",
            error: 'failed',
            data: false,
        }, { status: 500 });
    }
}