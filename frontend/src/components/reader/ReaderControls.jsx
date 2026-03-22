import Button from '../common/Button';

export default function ReaderControls() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline">Previous</Button>
      <Button size="sm">Next</Button>
    </div>
  );
}
