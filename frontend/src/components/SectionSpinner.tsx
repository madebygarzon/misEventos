type SectionSpinnerProps = {
  label?: string;
  className?: string;
};

export function SectionSpinner({ label, className = "" }: SectionSpinnerProps) {
  return (
    <div className={`flex w-full flex-col items-center justify-center gap-4 py-3 ${className}`.trim()}>
      <div className="h-20 w-20 animate-spin rounded-full border-4 border-transparent border-t-blue-400 text-4xl text-blue-400 flex items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-red-400 text-2xl text-red-400 flex items-center justify-center" />
      </div>
      {label && <p className="muted text-center">{label}</p>}
    </div>
  );
}
