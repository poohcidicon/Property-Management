import { getGuestListController } from "@/controllers/hotel/guest";
import { NextResponse } from "next/server";

export async function GET() {
  try{
    const result = await getGuestListController()
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