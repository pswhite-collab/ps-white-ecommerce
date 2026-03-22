export default function ProgressBar({ progress = 0 }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-oat">
      <div className="h-full bg-mocha transition-all duration-smooth ease-smooth" style={{ width: `${progress}%` }} />
    </div>
  );
}
