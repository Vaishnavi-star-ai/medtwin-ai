import { useState, useEffect, useRef } from 'react';
import { Clock, Plus, Trash2, Pill, CheckCircle2, BellRing } from 'lucide-react';

const API = 'http://localhost:5000/api/medai';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [medName, setMedName] = useState('');
  const [selectedTimings, setSelectedTimings] = useState([]);
  const [customTime, setCustomTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const prescriptionsRef = useRef(prescriptions);
  useEffect(() => { prescriptionsRef.current = prescriptions; }, [prescriptions]);

  const defaultTimings = [
    { label: 'Morning (09:00)', value: '09:00' },
    { label: 'Afternoon (14:00)', value: '14:00' },
    { label: 'Night (21:00)', value: '21:00' }
  ];
  const sid = localStorage.getItem('patientUID') || 'demo';

  useEffect(() => {
    fetchPrescriptions();
    if ('Notification' in window && Notification.permission !== 'granted') Notification.requestPermission();
    const interval = setInterval(() => { checkReminders(); setCurrentTime(new Date()); }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrescriptions = async () => {
    try { const r = await fetch(`${API}/prescriptions?sessionId=${sid}`); const d = await r.json(); if (d.success) setPrescriptions(d.prescriptions); } catch {}
  };

  const checkReminders = () => {
    const now = new Date();
    const hhmm = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const dateKey = now.toDateString();
    prescriptionsRef.current.forEach(med => {
      if (med.timings.includes(hhmm)) {
        const key = `reminded_${med.id}_${dateKey}_${hhmm}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, 'true');
          const body = `Please take ${med.medicineName} now (${hhmm}).`;
          if ('Notification' in window && Notification.permission === 'granted') new Notification('⏰ Medicine Reminder!', { body });
          else alert(body);
          if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(body); u.rate = 1.05; window.speechSynthesis.speak(u); }
        }
      }
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!medName || !selectedTimings.length) return;
    try {
      const r = await fetch(`${API}/add-prescription`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid, medicineName: medName, timings: selectedTimings }) });
      const d = await r.json();
      if (d.success) { setMedName(''); setSelectedTimings([]); fetchPrescriptions(); }
    } catch {}
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/prescriptions/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid }) });
    fetchPrescriptions();
  };

  const grouped = Object.values(prescriptions.reduce((acc, med) => {
    const key = med.medicineName.trim().toLowerCase();
    if (!acc[key]) acc[key] = { name: med.medicineName.trim(), ids: [med.id], timings: new Set(med.timings) };
    else { acc[key].ids.push(med.id); med.timings.forEach(t => acc[key].timings.add(t)); }
    return acc;
  }, {}));

  const upcoming = [];
  const nowSec = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
  prescriptions.forEach(med => med.timings.forEach(t => {
    const [h, m] = t.split(':').map(Number);
    let diff = h * 3600 + m * 60 - nowSec; if (diff <= 0) diff += 86400;
    upcoming.push({ ...med, time: t, diff });
  }));
  upcoming.sort((a, b) => a.diff - b.diff);
  const nextUp = upcoming.length ? upcoming.filter(m => m.diff === upcoming[0].diff) : [];
  const fmtCountdown = (s) => { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`; };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="grid lg:grid-cols-12 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-5">
          <div className="card-solid p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 text-red-500 rounded-xl"><Pill size={24} /></div>
              <div><h2 className="text-xl font-bold text-[#2f2a26]">New Prescription</h2><p className="text-sm text-[#a89b8d]">Configure schedule & reminders</p></div>
            </div>
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#403933] mb-2">Medicine Name</label>
                <input type="text" value={medName} onChange={e => setMedName(e.target.value)} placeholder="e.g. Paracetamol 500mg" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#403933] mb-3">Schedule</label>
                <div className="space-y-2 mb-4">
                  {defaultTimings.map((t, i) => (
                    <button key={i} type="button" onClick={() => setSelectedTimings(prev => prev.includes(t.value) ? prev.filter(x => x !== t.value) : [...prev, t.value])}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all ${selectedTimings.includes(t.value) ? 'bg-[#77DD77]/10 border-[#77DD77] text-emerald-700 font-bold' : 'bg-white border-[#d0bfae] text-[#a89b8d] hover:bg-beige-100'}`}>
                      <span className="flex items-center gap-2"><Clock size={16} /> {t.label}</span>
                      {selectedTimings.includes(t.value) && <CheckCircle2 size={18} className="text-[#77DD77]" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)} className="flex-1 input-field" />
                  <button type="button" onClick={() => { if (customTime && !selectedTimings.includes(customTime)) { setSelectedTimings([...selectedTimings, customTime]); setCustomTime(''); }}} className="btn-dark text-sm">Add</button>
                </div>
              </div>
              <button type="submit" disabled={!medName || !selectedTimings.length} className="btn-primary w-full justify-center disabled:opacity-50">
                <Plus size={18} /> Save Prescription
              </button>
            </form>
          </div>
        </div>
        {/* RIGHT */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#77DD77] p-5 rounded-2xl flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3"><BellRing size={24} className="animate-wiggle" /><div><h3 className="font-extrabold text-lg">Reminder Agent Active</h3><p className="text-sm text-white/90">Browser notifications enabled.</p></div></div>
          </div>
          <div className="card-solid p-6 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#2f2a26] flex items-center gap-2"><Clock size={20} className="text-[#a89b8d]" /> Today's Routine</h2>
              <div className="px-3 py-1 bg-[#77DD77]/20 border border-[#77DD77]/30 text-emerald-800 font-extrabold text-sm rounded-xl">
                {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
            {nextUp.length > 0 && (
              <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                <div><p className="text-xs font-bold text-blue-500 uppercase mb-1">Up Next</p><p className="text-blue-900 font-extrabold">{[...new Set(nextUp.map(m=>m.medicineName))].join(' + ')} at {nextUp[0].time} <span className="text-sm font-medium text-blue-600">({fmtCountdown(nextUp[0].diff)})</span></p></div>
                <Pill size={28} className="text-blue-300" />
              </div>
            )}
            <div className="space-y-3">
              {grouped.length === 0 ? (
                <div className="text-center py-10 text-[#a89b8d]"><Pill size={40} className="mx-auto mb-3 opacity-20" /><p>No active prescriptions.</p></div>
              ) : grouped.map(g => (
                <div key={g.ids[0]} className="group flex items-start justify-between p-4 bg-[#faf0e6] rounded-2xl border border-[#d0bfae]/50 hover:border-[#77DD77] transition-colors">
                  <div><h4 className="font-bold text-[#2f2a26] text-lg mb-2">{g.name}</h4>
                    <div className="flex flex-wrap gap-2">{Array.from(g.timings).sort().map(t => (
                      <span key={t} className="bg-white border border-[#d0bfae] text-[#403933] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Clock size={12} className="text-[#77DD77]" />{t}</span>
                    ))}</div>
                  </div>
                  <button onClick={() => g.ids.forEach(id => handleDelete(id))} className="p-2 text-[#a89b8d] hover:bg-red-100 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
