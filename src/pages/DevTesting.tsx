import ArbitrageEngine from "@/components/arbitrageengine";
import ForensicShift from "@/components/Forensicshift";

export default function DevTesting() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4">
      <ArbitrageEngine />
      <div className="py-12">
        <h2 className="text-white text-2xl font-bold text-center mb-6">Forensic Shift Demo</h2>
        <ForensicShift />
      </div>
    </div>
  );
}
