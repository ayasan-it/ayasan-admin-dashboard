import React, { useState, useMemo, useEffect, useRef } from "react";
import { loadBookings, updateBooking, deleteBooking, loadWorkers, FullBookingRecord, WorkerProfile, BookingStatus, AREAS, NannyServiceExtras, ElderlyServiceExtras, PetCareServiceExtras } from "@/data/store";
import { useT } from "@/i18n";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function BookingsDaily() {
  const { t } = useT();
  const [bookings, setBookings] = useState<FullBookingRecord[]>(() => loadBookings().filter(b => b.bookingType === "daily"));
  const [workers]  = useState<WorkerProfile[]>(loadWorkers);
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selected, setSelected] = useState<FullBookingRecord | null>(null);
  const [assignModal, setAssignModal] = useState<FullBookingRecord | null>(null);
  const [assignId, setAssignId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  const refresh = () => setBookings(loadBookings().filter(b => b.bookingType === "daily"));

  const filtered = useMemo(() => bookings.filter(b => {
    const matchStatus = filter === "all" || b.status === filter;
    const matchArea   = areaFilter === "all" || b.area === areaFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      b.customerName.toLowerCase().includes(q) ||
      b.service.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.customerPhone.includes(q) ||
      b.date.toLowerCase().includes(q) ||
      (b.customerEmail ?? "").toLowerCase().includes(q);
    let matchDate = true;
    if (dateFilter) {
      const [dd, mm, yyyy] = b.date.split("/");
      matchDate = `${yyyy}-${mm}-${dd}` === dateFilter;
    }
    return matchStatus && matchArea && matchSearch && matchDate;
  }), [bookings, filter, areaFilter, search, dateFilter]);

  function handleStatusChange(id: string, status: BookingStatus) { updateBooking(id, { status }); refresh(); }
  async function handleAssign() {
    if (!assignModal || !assignId) return;
    const w = workers.find(w => w.id === assignId);
    if (!w) return;
    setAssignLoading(true);
    updateBooking(assignModal.id, { assignedWorkerId: w.id, assignedWorkerName: w.full_name, workerLineId: w.line_id, status: "confirmed" });
    try {
      await fetch("/api/booking-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: assignModal.id,
          workerId: w.id,
          workerName: w.full_name,
          workerLineId: w.line_id,
          service: assignModal.service,
          serviceIcon: assignModal.serviceIcon,
          serviceSlug: assignModal.serviceSlug,
          customerName: assignModal.customerName,
          customerPhone: assignModal.customerPhone,
          date: assignModal.date,
          startTime: assignModal.startTime,
          hours: assignModal.hours,
          address: assignModal.address,
          total: assignModal.total,
          notes: assignModal.notes,
          status: "confirmed",
          bookingType: assignModal.bookingType,
        }),
      });
      setAssignSuccess(`✅ Job sent to ${w.full_name} successfully!`);
      setTimeout(() => setAssignSuccess(null), 4000);
    } catch {
      setAssignSuccess(`✅ ${w.full_name} assigned (offline mode)`);
      setTimeout(() => setAssignSuccess(null), 4000);
    }
    setAssignLoading(false);
    setAssignModal(null); setAssignId(""); refresh();
  }
  function handleDelete(id: string) { deleteBooking(id); setConfirmDelete(null); if (selected?.id === id) setSelected(null); refresh(); }

  const statuses: (BookingStatus | "all")[] = ["all","pending","confirmed","completed","cancelled"];
  const counts: Record<string, number> = { all: bookings.length };
  bookings.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1; });

  const statusLabel: Record<string, string> = {
    all: t.status.all, pending: t.status.pending, confirmed: t.status.confirmed,
    completed: t.status.completed, cancelled: t.status.cancelled,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.bookings.daily}</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} {t.bookings.bookingsCount}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter===s?"bg-primary text-white border-primary":"bg-card border-border text-foreground hover:border-primary/50"}`}>
              {statusLabel[s]} {counts[s]?`(${counts[s]})`:""}</button>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
            <input className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Search by name, phone, email, booking no." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="relative flex items-center gap-1">
            <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
            {dateFilter && (
              <button onClick={()=>setDateFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs leading-none" title="Clear date">✕</button>
            )}
          </div>
          <select value={areaFilter} onChange={e=>setAreaFilter(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="all">{t.common.allAreas}</option>
            {AREAS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>

        {assignSuccess && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium animate-in fade-in slide-in-from-top-2">
            <span className="text-lg">✅</span>
            <span>{assignSuccess}</span>
            <span className="text-xs text-green-600 ml-auto">Worker can now see this job in their app</span>
          </div>
        )}

        <BookingTable bookings={filtered} workers={workers} onStatusChange={handleStatusChange} onView={setSelected} onAssign={(b)=>{setAssignModal(b);setAssignId(b.assignedWorkerId||"");}} onDelete={setConfirmDelete} selectedId={selected?.id} />
      </div>

      {selected && <DetailPanel booking={selected} onClose={()=>setSelected(null)} />}
      {assignModal && <AssignModal booking={assignModal} workers={workers} assignId={assignId} setAssignId={setAssignId} onConfirm={handleAssign} onCancel={()=>setAssignModal(null)} loading={assignLoading} />}
      {confirmDelete && <DeleteModal onConfirm={()=>handleDelete(confirmDelete)} onCancel={()=>setConfirmDelete(null)} />}
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────
const PAGE_SIZE = 60;

export function BookingTable({ bookings, workers, onStatusChange, onView, onAssign, onDelete, selectedId }: {
  bookings: FullBookingRecord[]; workers: WorkerProfile[];
  onStatusChange: (id:string,s:BookingStatus)=>void; onView: (b:FullBookingRecord)=>void;
  onAssign: (b:FullBookingRecord)=>void; onDelete: (id:string)=>void; selectedId?: string;
}) {
  const { t } = useT();
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  const prevBookingsRef = useRef(bookings);
  if (prevBookingsRef.current !== bookings) {
    prevBookingsRef.current = bookings;
    if (page !== 0) setPage(0);
  }

  const pagedBookings = bookings.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const startRow = safePage * PAGE_SIZE + 1;
  const endRow = Math.min((safePage + 1) * PAGE_SIZE, bookings.length);

  const headers = [t.bookings.id, t.bookings.service, t.bookings.customer, t.bookings.dateTime, t.bookings.hoursShort, t.bookings.total, t.bookings.worker, t.bookings.area, t.bookings.status, t.bookings.actions];
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>{headers.map(h=>(
              <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagedBookings.map((b, idx) => {
              const prevB = pagedBookings[idx - 1];
              const isGroupStart = b.parentBookingId && b.parentBookingId !== prevB?.parentBookingId;
              const groupSiblings = b.parentBookingId ? bookings.filter(x => x.parentBookingId === b.parentBookingId) : [];
              const groupIndex = b.parentBookingId ? groupSiblings.findIndex(x => x.id === b.id) + 1 : 0;
              return (
                <React.Fragment key={b.id}>
                  {isGroupStart && (
                    <tr key={`grp-${b.parentBookingId}`} className="bg-blue-50/60">
                      <td colSpan={10} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">📅 Multi-date Request</span>
                          <span className="text-xs text-blue-600">{groupSiblings.length} dates · {b.customerName} · {b.serviceIcon} {b.service}</span>
                          {b.multiDateTotal && <span className="text-xs font-semibold text-blue-700 ml-auto">Total: ฿{b.multiDateTotal.toLocaleString()}</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr key={b.id} className={`hover:bg-muted/20 ${selectedId===b.id?"bg-accent/30":""} ${b.parentBookingId ? "bg-blue-50/20" : ""}`}>
                    <td className="px-3 py-2.5">
                      <div className="font-mono text-xs text-muted-foreground">{b.id}</div>
                      {b.parentBookingId && <div className="text-[10px] text-blue-500 font-medium">Date {groupIndex}/{groupSiblings.length}</div>}
                    </td>
                    <td className="px-3 py-2.5"><span className="flex items-center gap-1.5"><span>{b.serviceIcon}</span><span className="font-medium text-foreground">{b.service}</span></span></td>
                    <td className="px-3 py-2.5"><div className="font-medium text-foreground text-xs">{b.customerName}</div><div className="text-xs text-muted-foreground">{b.customerPhone}</div></td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">{b.date}<br/>{b.startTime}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground text-xs">{b.hours}h</td>
                    <td className="px-3 py-2.5 font-semibold text-foreground text-xs">฿{b.total.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-xs">
                      {b.assignedWorkerName ?? <span className="text-muted-foreground italic">{t.bookings.unassigned}</span>}
                      {!b.assignedWorkerName && b.requestedWorkerName && (
                        <div className="text-[10px] text-orange-500 mt-0.5">Req: {b.requestedWorkerName}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground capitalize">{b.area}</td>
                    <td className="px-3 py-2.5">
                      <select value={b.status} onChange={e=>onStatusChange(b.id,e.target.value as BookingStatus)} className={`text-xs px-2 py-1 rounded-full border font-medium cursor-pointer ${STATUS_COLORS[b.status]}`}>
                        {["pending","confirmed","completed","cancelled"].map(s=><option key={s} value={s}>{(t.status as any)[s]}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2.5"><div className="flex gap-1">
                      <button onClick={()=>onView(b)} className="px-2 py-1 text-xs bg-muted hover:bg-accent rounded-md">{t.common.view}</button>
                      <button onClick={()=>onAssign(b)} className="px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md">{t.common.assign}</button>
                      <button onClick={()=>onDelete(b.id)} className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-md">{t.common.delete}</button>
                    </div></td>
                  </tr>
                </React.Fragment>
              );
            })}
            {pagedBookings.length===0&&<tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">{t.bookings.noBookings}</td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            {startRow}–{endRow} / {bookings.length} bookings
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={safePage === 0} className="px-2 py-1 text-xs border border-border rounded-md bg-card hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">«</button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0} className="px-2 py-1 text-xs border border-border rounded-md bg-card hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i).filter(i => Math.abs(i - safePage) <= 2).map(i => (
              <button key={i} onClick={() => setPage(i)} className={`px-2.5 py-1 text-xs border rounded-md font-medium transition-colors ${i === safePage ? "bg-primary text-white border-primary" : "bg-card border-border hover:bg-accent"}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage === totalPages - 1} className="px-2 py-1 text-xs border border-border rounded-md bg-card hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">›</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={safePage === totalPages - 1} className="px-2 py-1 text-xs border border-border rounded-md bg-card hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">»</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DetailPanel({ booking: b, onClose }: { booking: FullBookingRecord; onClose: ()=>void }) {
  const { t } = useT();
  const ratingLabels = t.reviews.ratingLabels;
  return (
    <div className="w-80 flex-shrink-0 border-l border-border bg-card overflow-y-auto">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground">{t.bookings.detail}</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
      </div>
      <div className="p-4 space-y-3">
        {b.parentBookingId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <span className="text-lg">📅</span>
            <div>
              <div className="text-xs font-bold text-blue-700">Multi-date Booking</div>
              <div className="text-xs text-blue-600">Group ID: {b.parentBookingId}</div>
              {b.multiDateTotal && <div className="text-xs text-blue-600 font-semibold">Group Total: ฿{b.multiDateTotal.toLocaleString()}</div>}
            </div>
          </div>
        )}
        <div className="text-3xl text-center">{b.serviceIcon}</div>
        <div className="text-center"><div className="font-bold text-foreground text-lg">{b.service}</div><div className="text-sm text-muted-foreground">{b.id}</div></div>
        <div className="flex gap-2 justify-center flex-wrap">
          <span className={`text-xs px-3 py-1 rounded-full border font-medium ${STATUS_COLORS[b.status]}`}>{(t.status as any)[b.status]}</span>
          <span className="text-xs px-3 py-1 rounded-full border bg-purple-100 text-purple-700 border-purple-200 capitalize">{b.bookingType}</span>
        </div>
        {([
          [t.bookings.customer, b.customerName],
          [t.bookings.phone, b.customerPhone],
          ...(b.customerEmail ? [["Email", b.customerEmail]] : []),
          [t.bookings.date, `${b.date} · ${b.startTime}`],
          [t.bookings.duration, `${b.hours} ${t.bookings.hours}`],
          [t.bookings.area, b.area],
          [t.bookings.address, b.address],
          [t.bookings.total, `฿${b.total.toLocaleString()}`],
          ["Payment", b.paymentMethod === "card" ? "💳 Credit Card" : b.paymentMethod === "cash" ? "💵 Cash" : b.paymentMethod === "transfer" ? "🏦 Bank Transfer" : "—"],
          [t.bookings.worker, b.assignedWorkerName ?? t.bookings.unassigned],
          [t.bookings.lineId, b.workerLineId ?? "—"],
          [t.bookings.pointsEarned, b.pointsEarned ? `+${b.pointsEarned}` : "—"],
          [t.bookings.booked, b.createdAt],
        ] as [string, string][]).map(([k,v])=>(
          <div key={k} className="flex justify-between text-sm border-b border-border pb-1.5">
            <span className="text-muted-foreground">{k}</span>
            <span className={`text-foreground font-medium text-right max-w-[180px] break-all ${k === "Email" ? "lowercase" : "capitalize"}`}>{v}</span>
          </div>
        ))}

        {/* ── Subscription Weekly Schedule ── */}
        {b.subscriptionSchedule && b.subscriptionSchedule.slots && b.subscriptionSchedule.slots.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
            <div className="text-xs font-bold text-orange-700 mb-2">🔁 Weekly Schedule ({b.subscriptionSchedule.frequency}×/week)</div>
            {b.subscriptionSchedule.slots.map((sl, i) => {
              const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
              return (
                <div key={i} className="flex justify-between text-xs border-b border-orange-100 pb-1 last:border-0 last:pb-0">
                  <span className="text-orange-600 font-medium">{DAY_NAMES[sl.dayOfWeek]}</span>
                  <span className="text-orange-800">{String(sl.hour).padStart(2,"0")}:{String(sl.minute).padStart(2,"0")} · {sl.hours}h</span>
                </div>
              );
            })}
            <div className="text-xs text-orange-600 font-semibold mt-1">
              {b.subscriptionSchedule.frequency * 4} sessions/month · {b.subscriptionSchedule.slots.reduce((s, sl) => s + sl.hours, 0) * 4}h total
            </div>
          </div>
        )}

        {/* ── Customer notes ── */}
        {b.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-amber-700 mb-1">📝 Customer Notes</div>
            <div className="text-xs text-amber-800">{b.notes}</div>
          </div>
        )}

        {/* ── Addons ── */}
        {b.addons && b.addons.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-1.5">
            <div className="text-xs font-bold text-indigo-700 mb-1">➕ Add-ons</div>
            {b.addons.map(a => (
              <div key={a.id} className="flex justify-between text-xs">
                <span className="text-indigo-600">{a.label}</span>
                <span className="font-medium text-indigo-800">+฿{a.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Points & Promo ── */}
        {((b.pointsUsed != null && b.pointsUsed > 0) || !!b.promoCode) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
            <div className="text-xs font-bold text-green-700 mb-1">🎁 Discounts Applied</div>
            {b.pointsUsed != null && b.pointsUsed > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Points Used</span>
                <span className="font-medium text-green-800">−{b.pointsUsed} pts{b.pointsDiscount ? ` (−฿${b.pointsDiscount})` : ""}</span>
              </div>
            )}
            {b.promoCode && (
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Promo Code</span>
                <span className="font-medium text-green-800">{b.promoCode}{b.promoDiscount ? ` (−฿${b.promoDiscount.toLocaleString()})` : ""}</span>
              </div>
            )}
          </div>
        )}

        {b.requestedWorkerName && !b.assignedWorkerName && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-xs font-semibold text-orange-700 mb-1">👤 Requested Worker</div>
            <div className="text-sm font-medium text-orange-800">{b.requestedWorkerName}</div>
            <div className="text-xs text-orange-600 mt-0.5">Customer specifically requested this worker</div>
          </div>
        )}

        {/* ── Nanny service extras ── */}
        {b.serviceSlug === "nanny" && b.serviceExtras && (() => {
          const x = b.serviceExtras as NannyServiceExtras;
          return (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 space-y-2">
              <div className="text-xs font-bold text-pink-700 mb-2">👶 Child Details</div>
              {x.children && x.children.length > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-pink-600">Children</span>
                  <span className="font-medium text-pink-800">{x.children.length} · Ages: {x.children.map((c, i) => c.age ? `${c.age}yr` : `Child ${i+1}`).join(", ")}</span>
                </div>
              )}
              {x.gender && (
                <div className="flex justify-between text-xs">
                  <span className="text-pink-600">Child Gender</span>
                  <span className="font-medium text-pink-800 capitalize">{x.gender}</span>
                </div>
              )}
              {x.locationType && (
                <div className="flex justify-between text-xs">
                  <span className="text-pink-600">Location</span>
                  <span className="font-medium text-pink-800 capitalize">{x.locationType}</span>
                </div>
              )}
              {x.notes && (
                <div className="text-xs mt-1 pt-2 border-t border-pink-200">
                  <span className="text-pink-600 font-medium">Notes: </span>
                  <span className="text-pink-800">{x.notes}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Elderly service extras ── */}
        {b.serviceSlug === "elderly" && b.serviceExtras && (() => {
          const x = b.serviceExtras as ElderlyServiceExtras;
          const careLabels: Record<string, string> = {
            basic: "Basic daily support", mobility: "Mobility assistance",
            medical: "Medical-related care", companion: "Companion support",
          };
          return (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2">
              <div className="text-xs font-bold text-teal-700 mb-2">🧓 Care Recipient Details</div>
              {x.age && (
                <div className="flex justify-between text-xs">
                  <span className="text-teal-600">Age</span>
                  <span className="font-medium text-teal-800">{x.age} yrs</span>
                </div>
              )}
              {x.gender && (
                <div className="flex justify-between text-xs">
                  <span className="text-teal-600">Gender</span>
                  <span className="font-medium text-teal-800 capitalize">{x.gender}</span>
                </div>
              )}
              {x.careTypes && x.careTypes.length > 0 && (
                <div className="text-xs">
                  <div className="text-teal-600 mb-1">Type of Care</div>
                  <div className="flex flex-wrap gap-1">
                    {x.careTypes.map((ct) => (
                      <span key={ct} className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {careLabels[ct] ?? ct}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {x.locationType && (
                <div className="flex justify-between text-xs">
                  <span className="text-teal-600">Location</span>
                  <span className="font-medium text-teal-800 capitalize">{x.locationType}</span>
                </div>
              )}
              {x.healthNotes && (
                <div className="text-xs pt-2 border-t border-teal-200">
                  <div className="text-teal-600 font-medium mb-0.5">Health Notes</div>
                  <div className="text-teal-800">{x.healthNotes}</div>
                </div>
              )}
              {x.notes && (
                <div className="text-xs pt-2 border-t border-teal-200">
                  <div className="text-teal-600 font-medium mb-0.5">Special Requests</div>
                  <div className="text-teal-800">{x.notes}</div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Pet Care service extras ── */}
        {b.serviceSlug === "petcare" && b.serviceExtras && (() => {
          const x = b.serviceExtras as PetCareServiceExtras;
          const petEmoji: Record<string, string> = { dog: "🐶", cat: "🐱", rabbit: "🐰", bird: "🐦", other: "🐾" };
          const petLabel: Record<string, string> = { dog: "Dog", cat: "Cat", rabbit: "Rabbit", bird: "Bird", other: "Other" };
          return (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
              <div className="text-xs font-bold text-orange-700 mb-2">🐾 Pet Details</div>
              {x.petType && (
                <div className="flex justify-between text-xs">
                  <span className="text-orange-600">Pet Type</span>
                  <span className="font-medium text-orange-800">{petEmoji[x.petType] ?? "🐾"} {petLabel[x.petType] ?? x.petType}</span>
                </div>
              )}
              {x.petCount != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-orange-600">Number of Pets</span>
                  <span className="font-medium text-orange-800">{x.petCount}</span>
                </div>
              )}
              {x.petNotes && (
                <div className="text-xs pt-2 border-t border-orange-200">
                  <div className="text-orange-600 font-medium mb-0.5">Special Requests</div>
                  <div className="text-orange-800">{x.petNotes}</div>
                </div>
              )}
            </div>
          );
        })()}

        {b.review&&<div className="bg-green-50 border border-green-200 rounded-lg p-3"><div className="text-xs font-semibold text-green-700 mb-1">{t.bookings.review}</div><div className="text-base">{ratingLabels[b.review.rating]}</div>{b.review.comment&&<div className="text-xs text-green-700 mt-1 italic">"{b.review.comment}"</div>}</div>}
      </div>
    </div>
  );
}

export function AssignModal({ booking, workers, assignId, setAssignId, onConfirm, onCancel, loading }: {
  booking: FullBookingRecord; workers: WorkerProfile[]; assignId: string; setAssignId: (id:string)=>void; onConfirm:()=>void; onCancel:()=>void; loading?: boolean;
}) {
  const { t } = useT();
  const selectedWorker = workers.find(w => w.id === assignId);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-foreground text-lg mb-1">{t.bookings.assignWorker}</h3>
        <p className="text-sm text-muted-foreground mb-3">{booking.serviceIcon} {booking.service} · {booking.customerName}</p>
        <p className="text-xs text-muted-foreground mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2">
          📲 Job details will be sent directly to the worker's app in real time.
        </p>
        <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4" value={assignId} onChange={e=>setAssignId(e.target.value)}>
          <option value="">{t.bookings.selectWorker}</option>
          {workers.filter(w=>w.status!=="off").map(w=><option key={w.id} value={w.id}>{w.full_name} · {w.services.join(", ")} · ⭐{w.rating}</option>)}
        </select>
        {selectedWorker && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800 space-y-1">
            <div className="font-semibold">{selectedWorker.full_name}</div>
            <div>📞 {selectedWorker.phone} · 🟢 LINE: @{selectedWorker.line_id}</div>
            <div>⭐ {selectedWorker.rating} · {selectedWorker.completedJobs} jobs done</div>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={loading} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">{t.common.cancel}</button>
          <button onClick={onConfirm} disabled={!assignId || loading} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? (
              <><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending...</>
            ) : t.bookings.confirmNotify}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteModal({ onConfirm, onCancel }: { onConfirm:()=>void; onCancel:()=>void; }) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-foreground text-lg mb-2">{t.bookings.deleteBooking}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t.common.cannotUndo}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted">{t.common.cancel}</button>
          <button onClick={onConfirm} className="flex-1 py-2 bg-destructive text-white rounded-lg text-sm font-semibold">{t.common.delete}</button>
        </div>
      </div>
    </div>
  );
}
