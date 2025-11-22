import { getBookPayTransController } from "@/controllers/hotel/checkin-unit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try{
    const body = await request.json()
    const { book_room_id, status } = body
    if (!book_room_id || !status) {
      return NextResponse.json({
        success: false,
        data: [],
        error: 'Bad Request',
        message: 'status or book_room_id is required'
      }, {status: 400} )
    }
    const result = await getBookPayTransController(body)
    return NextResponse.json(result, {status: result.success ? 200 : 500} )
  }
  catch(err){
    return NextResponse.json({
      success: false,
      data: [],
      error: 'Internal Server Error',
      message: 'Internal Server Error'
    }, {status: 500} )
  }
}