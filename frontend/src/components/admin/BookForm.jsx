import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';

export default function BookForm() {
  return (
    <Card>
      <h3 className="font-display text-2xl text-mocha">Book Form</h3>
      <div className="mt-4 space-y-3">
        <Input label="Book Title" placeholder="Enter title" />
        <Input label="Price" type="number" placeholder="0.00" />
        <Button>Save Book</Button>
      </div>
    </Card>
  );
}
