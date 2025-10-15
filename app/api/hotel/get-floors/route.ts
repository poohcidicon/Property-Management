import { getFloorMasController } from "@/controllers/hotel/unit-matrix";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try{
    const body = await request.json()
    const { project_id } = body
    if (!project_id) {
      return NextResponse.json({
        success: false,
        data: [],
        error: 'Bad Request',
        message: 'project_id is required'
      }, {status: 400} )
    }
    const result = await getFloorMasController(body)
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