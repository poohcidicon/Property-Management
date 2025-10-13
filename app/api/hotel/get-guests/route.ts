import { getGuestListController } from "@/controllers/hotel/guest";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try{
    const body = await request.json()
    const { checkin_date } = body
    if (!checkin_date) {
      return NextResponse.json({
        success: false,
        data: [],
        error: 'Bad Request',
        message: 'checkin_date is required'
      }, {status: 400} )
    }
    const result = await getGuestListController(body)
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