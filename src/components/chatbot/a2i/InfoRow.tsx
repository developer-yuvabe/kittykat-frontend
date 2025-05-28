export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-1 text-sm text-[#171A1F]">
      <span className="">•</span>
      <span>
        {label}: {value}
      </span>
    </div>
  );
}
