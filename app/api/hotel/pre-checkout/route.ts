import { autherizeUser } from "@/controllers/auth";
import { preCheckoutController } from "@/controllers/hotel/checkin-unit";
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
    const { unit_id, booking_date } = body
    if(!unit_id || !body.booking_id || !body.book_room_id || !body.total_amount || !booking_date){
      return new Response(JSON.stringify({
        message: "❌ Missing required parameters unit_id, customer_id, booking_date or booking_id, book_room_id",
        error: 'failed',
        data: null
      }), { status: 400 })
    }
    const result = await preCheckoutController({
      ...body,
      update_by: userSession.data?.user_id
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