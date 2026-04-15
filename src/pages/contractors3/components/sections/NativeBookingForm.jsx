
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, Phone, MessageSquare, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isBefore, startOfDay } from "date-fns";
import { PAGE_CONFIG } from "../../config/page.config.js";
import { cn } from "@/lib/utils";

const TIME_SLOTS = ["09:00 AM","09:30 AM","10:00 AM","11:00 AM","01:00 PM","01:30 PM","02:30 PM","03:00 PM","04:00 PM"];

export default function NativeBookingForm() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const today = startOfDay(new Date());

  const handleDateClick = (day) => { if (isBefore(day, today)) return; setSelectedDate(day); setSelectedTime(null); };
  const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) { alert("Please select a date and time."); return; }
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setIsSuccess(true); console.log("Booking submitted:", { date: selectedDate, time: selectedTime, ...formData }); }, 1500);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const rows = []; let days = []; let day = startDate;
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, "d");
        const cloneDay = day;
        const isPast = isBefore(day, today);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        days.push(
          <button key={day.toString()} type="button" disabled={isPast} onClick={() => handleDateClick(cloneDay)}
            className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm transition-all",
              !isCurrentMonth && "text-white/20", isCurrentMonth && !isPast && !isSelected && "text-white hover:bg-white/10",
              isPast && "cursor-not-allowed text-white/20", isSelected && "bg-white font-bold text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            )}>{formattedDate}</button>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="flex justify-between w-full mb-2" key={day.toString()}>{days}</div>);
      days = [];
    }
    return rows;
  };

  return (
    <section className="w-full bg-[#0d0d0d] py-24">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
        <div className="mb-16 flex flex-col items-center text-center">
          <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-white/50">Direct Booking</span>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white lg:text-4xl">Schedule Your Walkthrough</h2>
          <p className="max-w-2xl text-base text-white/60">Select a time below to confirm territory availability and see the system in action.</p>
        </div>

        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] shadow-2xl">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex min-h-[500px] flex-col items-center justify-center p-12 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                  className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 size={48} strokeWidth={2.5} />
                </motion.div>
                <h3 className="mb-3 text-3xl font-bold text-white">Booking Confirmed</h3>
                <p className="mb-8 max-w-md text-base text-white/60">
                  You're all set for {selectedDate && format(selectedDate, "MMMM d, yyyy")} at {selectedTime}. We've sent a calendar invitation to {formData.email}.
                </p>
                <button onClick={() => { setIsSuccess(false); setSelectedDate(null); setSelectedTime(null); setFormData({ name: "", email: "", phone: "", message: "" }); }}
                  className="rounded-full border border-white/[0.1] bg-white/[0.03] px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-white/[0.08]">
                  Book Another Session
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col lg:flex-row">
                <div className="flex-1 border-b border-white/[0.08] p-8 lg:border-b-0 lg:border-r lg:p-10">
                  <div className="mb-8 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-white"><CalendarIcon size={20} /></div>
                    <h3 className="text-xl font-bold text-white">Select Date & Time</h3>
                  </div>
                  <div className="mb-6 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">{format(currentMonth, "MMMM yyyy")}</h4>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] text-white transition-colors hover:bg-white/[0.1]"><ChevronLeft size={18} /></button>
                      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] text-white transition-colors hover:bg-white/[0.1]"><ChevronRight size={18} /></button>
                    </div>
                  </div>
                  <div className="mb-8">
                    <div className="mb-4 flex justify-between w-full text-xs font-medium uppercase tracking-wider text-white/40">
                      {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} className="w-10 text-center">{d}</div>)}
                    </div>
                    <div className="flex flex-col">{renderCalendar()}</div>
                  </div>
                  <AnimatePresence>
                    {selectedDate && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/80">
                          <Clock size={16} className="text-white/50" />Available times for {format(selectedDate, "MMM d")}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {TIME_SLOTS.map((time) => (
                            <button key={time} type="button" onClick={() => setSelectedTime(time)}
                              className={cn("rounded-lg border py-2.5 text-sm font-medium transition-all",
                                selectedTime === time ? "border-white bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]" : "border-white/[0.1] bg-white/[0.02] text-white hover:border-white/[0.3] hover:bg-white/[0.05]"
                              )}>{time}</button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-[0.8] bg-[#0a0a0a] p-8 lg:p-10">
                  <form onSubmit={handleSubmit} className="flex h-full flex-col">
                    <h3 className="mb-8 text-xl font-bold text-white">Your Details</h3>
                    <div className="flex flex-col gap-5">
                      {[{l:"Full Name *",n:"name",t:"text",p:"Jane Doe"},{l:"Email Address *",n:"email",t:"email",p:"jane@company.com"},{l:"Phone Number *",n:"phone",t:"tel",p:"(555) 123-4567"}].map(f => (
                        <div key={f.n} className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-white/60 pl-1">{f.l}</label>
                          <input type={f.t} name={f.n} value={formData[f.n]} onChange={handleInputChange} required placeholder={f.p}
                            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all" />
                        </div>
                      ))}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-white/60 pl-1">Additional Notes (Optional)</label>
                        <textarea name="message" value={formData.message} onChange={handleInputChange} rows={3} placeholder="Anything specific you'd like to cover?"
                          className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all" />
                      </div>
                    </div>
                    <div className="mt-auto pt-8">
                      <button type="submit" disabled={isSubmitting || !selectedDate || !selectedTime}
                        className="flex w-full items-center justify-center rounded-full bg-white py-4 text-sm font-bold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                        {isSubmitting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" /> : "Confirm Booking"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          <span className="text-sm font-medium text-white/40">Need immediate assistance?</span>
          <div className="flex gap-4">
            <a href={PAGE_CONFIG.phone.href} className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]">
              <Phone size={16} className="text-white/60" />Call Us
            </a>
            <a href={`sms:${PAGE_CONFIG.phone.href.replace('tel:', '')}`} className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]">
              <MessageSquare size={16} className="text-white/60" />Text Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}