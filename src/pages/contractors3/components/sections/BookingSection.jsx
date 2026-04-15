
import React, { useState } from "react";
import { PAGE_CONFIG } from "../../config/page.config.js";
import CalendlyEmbed from "../ui/CalendlyEmbed.jsx";

export default function BookingSection() {
  const [formData, setFormData] = useState({ name: "", company: "", phone: "", serviceArea: "", jobSize: "" });
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleSubmit = (e) => { e.preventDefault(); console.log("Form Request Submitted:", formData); alert("Request captured! We will be in touch shortly."); };

  return (
    <section className="w-full bg-[#0d0d0d] py-24">
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
        <div className="mb-16 flex flex-col items-center text-center">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight lg:text-4xl text-white">See If Your Territory Is Open</h2>
          <p className="text-base text-white/60">Takes 10 minutes. No obligation. We'll confirm availability on the call.</p>
        </div>

        <div className="flex flex-col gap-16 lg:flex-row lg:items-start lg:gap-12">
          <div className="flex-[1.2] flex flex-col w-full shrink-0">
            <span className="mb-6 block text-sm font-medium text-white/50 uppercase tracking-widest text-center lg:text-left">Book directly below</span>
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111]">
              <CalendlyEmbed url={PAGE_CONFIG.calendly.url} height={600} />
            </div>
          </div>

          <div className="flex-1 flex flex-col w-full rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6 lg:p-8">
            <span className="mb-8 block text-sm font-medium text-white/50 uppercase tracking-widest text-center">Or request access by text/call</span>
            <div className="mb-10 flex flex-col items-center text-center">
              <a href={PAGE_CONFIG.phone.href} className="text-4xl font-extrabold tracking-tight text-white hover:text-white/80 transition-colors">{PAGE_CONFIG.phone.display}</a>
              <div className="mt-4 flex gap-6 text-sm font-bold">
                <a href={PAGE_CONFIG.phone.href} className="flex items-center gap-2 text-white/80 hover:text-white">📞 Call</a>
                <a href={`sms:${PAGE_CONFIG.phone.href.replace('tel:', '')}`} className="flex items-center gap-2 text-white/80 hover:text-white">💬 Text</a>
              </div>
            </div>

            <div className="relative mb-10 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]"></div></div>
              <span className="relative bg-[#0d0d0d] px-4 text-xs font-medium uppercase tracking-widest text-white/40">or submit below</span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/60 pl-1">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/35 focus:border-white/40 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/60 pl-1">Company</label>
                <input type="text" name="company" value={formData.company} onChange={handleChange} required className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/35 focus:border-white/40 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/60 pl-1">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/35 focus:border-white/40 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/60 pl-1">Service Area</label>
                <input type="text" name="serviceArea" value={formData.serviceArea} onChange={handleChange} required placeholder="City or county you serve" className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/35 focus:border-white/40 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5 mb-2">
                <label className="text-xs font-medium text-white/60 pl-1">Average Job Size</label>
                <select name="jobSize" value={formData.jobSize} onChange={handleChange} required className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none appearance-none">
                  <option value="" disabled hidden>Select range</option>
                  <option value="Under $8k">Under $8k</option>
                  <option value="$8k - $15k">$8k – $15k</option>
                  <option value="$15k - $25k">$15k – $25k</option>
                  <option value="$25k+">$25k+</option>
                </select>
              </div>
              <button type="submit" className="mt-2 w-full rounded-full bg-white py-3 text-sm font-bold text-black transition-colors hover:bg-white/90 active:scale-[0.98]">Request Territory Access</button>
            </form>
            <p className="mt-6 text-center text-xs text-white/40">Prefer to talk first? Call or text directly above.</p>
          </div>
        </div>
      </div>
    </section>
  );
}