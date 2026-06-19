import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Award, Calendar, Clock, LogIn, LogOut, CheckCircle, Smartphone } from 'lucide-react';
import { Employee } from '../types';

interface EmployeeManagerProps {
  employees: Employee[];
  onAttendanceLog: (employeeId: string, isClockIn: boolean) => Promise<void>;
  currency: string;
}

export default function EmployeeManager({ employees, onAttendanceLog, currency }: EmployeeManagerProps) {
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>(employees[0]?.id || '');
  const [pinInput, setPinInput] = useState('');
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(null);

  const selectedEmployee = employees.find(e => e.id === activeEmployeeId);

  const handleClockAction = async (isClockIn: boolean) => {
    if (!selectedEmployee) return;

    if (pinInput !== selectedEmployee.pin) {
      alert("Invalid employee security PIN! Please type standard cashier codes (e.g. 1234 or 0000)");
      setPinInput('');
      return;
    }

    await onAttendanceLog(selectedEmployee.id, isClockIn);
    
    // Alert confirm
    alert(`${selectedEmployee.name} successfully ${isClockIn ? 'Clocked-In' : 'Clocked-Out'} at: ${new Date().toLocaleTimeString()}! Logged under attendance reports.`);
    
    // Clear pin state
    setPinInput('');
  };

  return (
    <div className="space-y-6" id="employee_view">
      
      {/* Attendance Clocker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-white font-sans">
        
        {/* Check in Clock Panel (col 5) */}
        <div className="md:col-span-5 bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm space-y-4">
          <div className="border-b border-white/5 pb-2.5 flex items-center gap-1.5 text-white">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-sm">Shift Timecard Clock</h4>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            {/* Employee Selector dropdown */}
            <div className="space-y-1">
              <label className="block text-gray-400 font-semibold uppercase">Select Your Shift Employee</label>
              <select
                value={activeEmployeeId}
                onChange={(e) => { setActiveEmployeeId(e.target.value); setPinInput(''); }}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 text-sm font-semibold"
              >
                {employees.map(e => (
                  <option key={e.id} value={e.id} className="bg-[#141416]">{e.name} ({e.role})</option>
                ))}
              </select>
            </div>

            {/* Input PIN code */}
            <div className="space-y-1">
              <label className="block text-gray-400 font-semibold uppercase">Type Security PIN Code</label>
              <input
                type="password"
                maxLength={4}
                placeholder="4-Digit security passcode"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-2.5 tracking-widest text-center text-lg font-black font-mono rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-505"
              />
              <span className="block text-[10px] text-gray-500 font-mono mt-1 text-center font-normal">Standard test seeds PIN codes: Sipho is "1234", Thabo is "0000"</span>
            </div>

            {/* Shift actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleClockAction(true)}
                className="py-3 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
              >
                <LogIn className="w-4.5 h-4.5 shrink-0" />
                <span>Clock-In Shift</span>
              </button>
              <button
                type="button"
                onClick={() => handleClockAction(false)}
                className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
              >
                <LogOut className="w-4.5 h-4.5 shrink-0" />
                <span>Clock-Out Shift</span>
              </button>
            </div>
          </div>
        </div>

        {/* Attendance listings (col 7) */}
        <div className="md:col-span-7 bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm space-y-4">
          <div className="border-b border-white/5 pb-2.5 flex items-center gap-1.5 text-white">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-sm">Attendance Roster (Logs Today)</h4>
          </div>

          <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto pr-1">
            {employees.map(emp => (
              <div key={emp.id} className="py-3.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white text-sm block leading-tight">{emp.name}</span>
                  <span className="text-[10px] text-gray-500 uppercase font-mono">{emp.role} | Security ID: {emp.id}</span>
                </div>

                <div className="space-y-1 text-right">
                  {emp.attendance && emp.attendance.length > 0 ? (
                    emp.attendance.map((att, idx) => {
                      let tagTheme = "bg-[#10b981]/15 text-emerald-400 border border-[#10b981]/25";
                      if (att.state === 'Late') tagTheme = "bg-[#f59e0b]/15 text-amber-400 border border-[#f59e0b]/25";
                      
                      return (
                        <div key={idx} className="space-y-0.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold tracking-wider ${tagTheme}`}>
                            {att.state}
                          </span>
                          <span className="block font-mono text-[10px] text-gray-400">In: {att.clockIn} | Out: {att.clockOut || 'Shift Active'}</span>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-gray-500 italic font-mono">No shifts clocked yet today.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Cashiers Performance Leaderboard */}
      <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-xs space-y-4 text-white">
        <div className="flex items-center gap-1.5">
          <Award className="w-5 h-5 text-indigo-400" />
          <h4 className="font-bold text-white">Cashier Sales Performance Leaderboards</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map((emp, idx) => {
            return (
              <div key={emp.id} className="p-4 rounded-xl border border-white/5 bg-[#141416]/50 flex justify-between items-center hover:border-indigo-505/25 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-xs text-indigo-400">#{idx + 1} Rank</span>
                    <span className="font-bold text-white text-sm">{emp.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono bg-[#0A0A0B] px-2 py-0.5 border border-white/5 rounded text-gray-400 mt-1 inline-block">
                    {emp.role}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-gray-500 block">Collective Net Invoice Sales</span>
                  <span className="text-lg font-black font-mono text-indigo-400">
                    R{emp.totalSalesValue.toLocaleString('en-ZA')}
                  </span>
                  <span className="block text-[10px] font-semibold text-gray-400 mt-0.5">{emp.salesCompleted} transactions logged</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
