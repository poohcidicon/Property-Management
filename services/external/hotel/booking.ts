import { getConnection } from "@/lib/db";
import sql from "mssql";
import dayjs from "dayjs";

import { db } from "./mock/units";

export interface IPayloadBookUnitService {
  unit_id: string;
  booking_date: string; // ISO date string
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  booking_id: string;
  book_room_id: string;
  room_number: string;
}

export const bookUnitService = async (
  payload: IPayloadBookUnitService,
): Promise<boolean> => {
  const pool = await getConnection();
  let transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const checkinBooking = transaction.request();
    let insertListOnDate = [];
    let count = 0;
    checkinBooking.input(`UnitID_${count}`, payload.unit_id);
    checkinBooking.input(`BookingID_${count}`, payload.booking_id || null);
    checkinBooking.input(
      `BookingRoomID_${count}`,
      payload.book_room_id || null,
    );
    checkinBooking.input(`RoomNumber_${count}`, payload.room_number);
    checkinBooking.input(`TransacDate_${count}`, dayjs().format("YYYY-MM-DD"));
    checkinBooking.input(
      `CheckIn_${count}`,
      dayjs(payload.start_date).format("YYYY-MM-DD"),
    );
    checkinBooking.input(`Status_${count}`, "W");
    insertListOnDate.push(`
      (@UnitID_${count}
      , @BookingID_${count}
      , @BookingRoomID_${count}
      , @RoomNumber_${count}
      , @TransacDate_${count}
      , @CheckIn_${count}
      , @Status_${count}
      , GETDATE()
      )
    `);
    const queryInsertCheckin = `
      INSERT INTO [dbo].[Sys_Hotel_CheckIn]
      ([UnitID]
      ,[BookingID]
      ,[BookRoomID]
      ,[RoomNumber]
      ,[TransacDate]
      ,[CheckIn]
      ,[Status]
      ,[CreateDate]
      )
      VALUES ${insertListOnDate.join(",")}
    `;

    const updateRoomStatus = `
      UPDATE Sys_Hotel_RoomStatus
      SET Status = '1'
      WHERE UnitID = @UnitID_${count}
      and CONVERT(DATE, ActiveDate) = @CheckIn_${count}
    `;

    await checkinBooking.query(queryInsertCheckin);

    await checkinBooking.query(updateRoomStatus);

    // Simulate booking by checking if unit exists in mock data
    // const unitIndex = db.units.findIndex(u => u.unit_id === payload.unit_id);
    // if(unitIndex === -1){
    //   throw new Error("Unit not found");
    // }
    // // Simulate inserting booking record
    // db.units[unitIndex].status = 2
    // db.units[unitIndex].status_desc = "Booked"
    // db.units[unitIndex].booking = {
    //   customer_id: payload.customer_id,
    //   status: "booked",
    //   start_date: dayjs(payload.booking_date).format("YYYY-MM-DD"),
    //   end_date: dayjs(payload.booking_date).add(3, 'day').format("YYYY-MM-DD"),
    // }

    await transaction.commit();

    return true;
  } catch (err: any) {
    await transaction.rollback();
    console.error("Error booking unit:", err);
    return false;
  }
};
