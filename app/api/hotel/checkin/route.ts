import { autherizeUser } from "@/controllers/auth";
import { checkinUnitController } from "@/controllers/hotel/checkin-unit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try{
    const body = await request.json()
    const userSession = await autherizeUser()
    if (!userSession.data?.user_id){
      return NextResponse.json({
        message: "❌ User is not authorized",
        error: 'User is not authorized',
        data: null
      }, { status: 401 })
    }
    const { unit_id, customers, checkin_date } = body
    if(!unit_id || !customers || !checkin_date){
      return new Response(JSON.stringify({
        message: "❌ Missing required parameters unit_id, customer_id, booking_date",
        error: 'failed',
        data: null
      }), { status: 400 })
    }
    const result = await checkinUnitController({
      ...body,
      create_by: userSession.data?.user_id
    })
    return NextResponse.json(result, { status: 200 })
  }
  catch(err: any){
    console.error('Error booking unit:', err)
    return NextResponse.json({
      message: "failed",
      error: 'failed',
      data: null
    }, { status: 500 })
  }
}