import { bookUnitController } from "@/controllers/hotel/checkin-unit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try{
    const body = await request.json()
    const { unit_id, customer_id, booking_date } = body
    if(!unit_id || !customer_id || !booking_date || !body.booking_id || !body.book_room_id ){
      return new Response(JSON.stringify({
        message: "❌ Missing required parameters unit_id, customer_id, booking_date or booking_id, book_room_id",
        error: 'failed',
        data: null
      }), { status: 400 })
    }
    const result = await bookUnitController(body)
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