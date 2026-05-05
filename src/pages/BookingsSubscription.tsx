import { useState, useMemo } from "react";
import { loadBookings, updateBooking, deleteBooking, loadWorkers, FullBookingRecord, WorkerProfile, BookingStatus, AREAS } from "@/data/store";
import { BookingTable, DetailPanel, AssignModal, DeleteModal } from "./BookingsDaily";
import { useT } from "@/i18n";

export default function BookingsSubscription() {
  const { t } = useT();
  const [bookings, setBookings] = useState<FullBookingRecord[]>(() => loadBookings().filter(b => b.bookingType === "subscription"));
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

  const refresh = () => setBookings(loadBookings().filter(b => b.bookingType === "subscription"));

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

  const totalRevenue = bookings.filter(b => b.status === "completed").reduce((s,b) => s+b.total, 0);
  const activeSubscribers = [...new Set(bookings.filter(b => b.status !== "cancelled").map(b => b.customerId))].length;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.bookings.subscription}</h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} {t.bookings.bookingsCount} · {activeSubscribers} {t.bookings.activeSubscribers}</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-purple-100 border border-purple-200 rounded-xl px-4 py-3 text-center">
              <div className="text-xl font-bold text-purple-700">{activeSubscribers}</div>
              <div className="text-xs text-purple-600">{t.bookings.activeSubscribers}</div>
            </div>
            <div className="bg-green-100 border border-green-200 rounded-xl px-4 py-3 text-center">
              <div className="text-xl font-bold text-green-700">฿{totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-green-600">{t.bookings.subRevenue}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter===s?"bg-primary text-white border-primary":"bg-card border-border text-foreground hover:border-primary/50"}`}>
              {statusLabel[s]} {counts[s]?`(${counts[s]})`:""}</button>
          ))}
        </div>

        {assignSuccess && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium">
            <span className="text-lg">✅</span>
            <span>{assignSuccess}</span>
            <span className="text-xs text-green-600 ml-auto">Worker can now see this job in their app</span>
          </div>
        )}

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

        <BookingTable bookings={filtered} workers={workers} onStatusChange={handleStatusChange} onView={setSelected} onAssign={(b)=>{setAssignModal(b);setAssignId(b.assignedWorkerId||"");}} onDelete={setConfirmDelete} selectedId={selected?.id} />
      </div>

      {selected && <DetailPanel booking={selected} onClose={()=>setSelected(null)} />}
      {assignModal && <AssignModal booking={assignModal} workers={workers} assignId={assignId} setAssignId={setAssignId} onConfirm={handleAssign} onCancel={()=>setAssignModal(null)} loading={assignLoading} />}
      {confirmDelete && <DeleteModal onConfirm={()=>handleDelete(confirmDelete)} onCancel={()=>setConfirmDelete(null)} />}
    </div>
  );
}
