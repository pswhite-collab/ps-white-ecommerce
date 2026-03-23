export default function ProgressBar({ progress = 0, onJump }) {
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-oat">
      <button
        type="button"
        className="h-full w-full text-left"
        onClick={(event) => {
          if (!onJump) {
            return;
          }

          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - rect.left) / rect.width;
          onJump(Math.max(0, Math.min(1, ratio)));
        }}
      >
        <span className="block h-full bg-mocha" style={{ width: `${progress}%` }} />
      </button>
    </div>
  );
}
