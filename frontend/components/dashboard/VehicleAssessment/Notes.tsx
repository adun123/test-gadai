"use client";

type Props = {
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
};

export default function Notes({ value, disabled, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">Catatan Kondisi Manual</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        placeholder="Add notes about scratches, engine sound, etc…"
        className="w-full resize-none rounded-2xl border border-input bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm disabled:bg-muted"
      />
    </div>
  );
}
