import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { axiosPublic } from "@/lib/axios";
import { SysHotelGuests } from "@/services/external/models/customer";
import { getOtherGuestListApi } from "@/lib/api/hotel/get-guest";
import { Circle } from "./canvas-map";

export interface SelectHotelOtherGuestProps {
  setShowModal: (show: boolean) => void;
  setOtherGuest: (customer: SysHotelGuests) => void;
  selectedProperty?: Circle | null
}

export default function SelectHotelOtherGuest({
  setShowModal,
  setOtherGuest,
  selectedProperty
}: SelectHotelOtherGuestProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<SysHotelGuests[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  // Search API
  async function handleSearch() {
    setLoading(true);
    const data = await getOtherGuestListApi({ 
      keyword: keyword,
      exclue_book_room_id: selectedProperty?.booking?.book_room_id
    });
    if (data.success) setCustomers(data.data || []);
    else setCustomers([]);
    setLoading(false);
  }

  function handleSelect(c: SysHotelGuests) {
    // setCustomer({
    //   id: c.id,
    //   memberId: c.memberId,
    //   name: c.fullName,
    //   citizenId: c.citizenId,
    //   mobile: c.mobile,
    //   type: c.type,
    // });
    // router.push("/property-layout"); // redirect ไปหน้า property-layout
    if (setOtherGuest){
      setOtherGuest(c)
    }
  }

  const closeModal = () => {
    setShowModal(false);  
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-medium text-gray-800">ค้นหาชื่อลูกค้า</h2>
          <button className="text-gray-400 hover:text-gray-600" onClick={closeModal}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search Inputs */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="เลขบัตรประชาชน/ชื่อ/เบอร์โทร"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 whitespace-nowrap"
              onClick={handleSearch}
              disabled={loading}
            >
              <Search size={20} />
              {loading ? "ค้นหา..." : "ค้นหา"}
            </button>
          </div>

          {/* Table */}
          <div className="border border-gray-300 rounded overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">Customer ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">เลขบัตรประชาชน</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">เบอร์โทร</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {customers?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-red-500">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  customers?.map((c, idx) => (
                    <tr
                      key={c.GuestID}
                      className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">{c.GuestID}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.GuestFirstName} {c.GuestLastName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.GuestNationalityID}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.GuestMobileNumber}</td>
                      <td>
                        <button
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          onClick={() => handleSelect(c)}
                        >
                          เลือก
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total Record */}
          <div className="flex justify-end mt-4 text-sm text-gray-600">
            Total Record : {customers?.length}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
          <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={closeModal}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}