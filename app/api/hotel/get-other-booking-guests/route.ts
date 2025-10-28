import { getOtherBookingGuestController, getOtherGuestListController } from "@/controllers/hotel/guest";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { book_room_id } = body;
    if (!book_room_id) {
      return NextResponse.json({
        message: "Missing required parameters checkin_date",
        error: 'failed',
        data: [],
      }, { status: 400 });
    }
    const result = await getOtherBookingGuestController(body);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  }
  catch (err: any) {
    return NextResponse.json({
      message: "failed",
      error: 'failed',
      data: [],
    }, { status: 500 });
  }
}