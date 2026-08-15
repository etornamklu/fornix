import React from "react";
// import { Search, Filter, RefreshCw, Plus, Download } from "lucide-react";
//
// const patientData = [
//     { id: "21789997", name: "Courtney Henry", lastVisit: "Jan 20, 2020", nextAppointment: "Jan 24, 2020", department: "Radiology", doctor: "Dr M. Wagner", status: "Active" },
//     { id: "21789996", name: "Leslie Alexander", lastVisit: "Jan 28, 2020", nextAppointment: "Feb 1, 2020", department: "Pediatrics", doctor: "Dr R. Green", status: "Active" },
//     { id: "54279968", name: "Marvin McKinney", lastVisit: "Jan 30, 2020", nextAppointment: "Jan 30, 2020", department: "Ophthalmology", doctor: "Dr P. Y", status: "Inactive" },
//     { id: "44518115", name: "Arlene McCoy", lastVisit: "Jan 14, 2020", nextAppointment: "Jan 19, 2020", department: "Gastroenterology", doctor: "Dr M. Wagner", status: "Inactive" },
// ];

export default function CalendarWidget() {
    return (
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold">Calendar</h3>
                <span className="text-xs sm:text-sm text-gray-500">June 2023</span>
            </div>

            <div className="mb-4 flex flex-wrap gap-1 sm:gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Appointment</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Surgery</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Procedure</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="p-1 sm:p-2 font-medium text-gray-500">{day}</div>
                ))}
                {Array.from({ length: 30 }, (_, i) => (
                    <div
                        key={i}
                        className={`p-1 sm:p-2 hover:bg-gray-50 cursor-pointer rounded ${
                            i === 14 ? 'bg-blue-600 text-white' : ''
                        }`}
                    >
                        {i + 1}
                    </div>
                ))}
            </div>
        </div>
    );
}
