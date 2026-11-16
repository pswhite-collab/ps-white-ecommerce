import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const defaultAddress = {
  firstName: '',
  lastName: '',
  address: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'United States',
  postalCode: '',
  phone: '',
};

export default function ShippingAddressForm({ onSubmit, initialData = {} }) {
  const [formData, setFormData] = useState({
    ...defaultAddress,
    ...initialData,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};

    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required';
    if (!formData.address.trim()) nextErrors.address = 'Address is required';
    if (!formData.city.trim()) nextErrors.city = 'City is required';
    if (!formData.state.trim()) nextErrors.state = 'State is required';
    if (!formData.country.trim()) nextErrors.country = 'Country is required';
    if (!formData.postalCode.trim()) nextErrors.postalCode = 'Postal code is required';
    if (!formData.phone.trim()) nextErrors.phone = 'Phone number is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    onSubmit?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-display text-3xl text-mocha">Shipping Address</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="First Name *"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={errors.firstName}
        />
        <Input
          label="Last Name *"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={errors.lastName}
        />
      </div>

      <Input
        label="Address *"
        name="address"
        value={formData.address}
        onChange={handleChange}
        error={errors.address}
        placeholder="123 Main Street"
      />

      <Input
        label="Apartment, suite, etc. (optional)"
        name="addressLine2"
        value={formData.addressLine2}
        onChange={handleChange}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="City *"
          name="city"
          value={formData.city}
          onChange={handleChange}
          error={errors.city}
        />
        <Input
          label="State / Province *"
          name="state"
          value={formData.state}
          onChange={handleChange}
          error={errors.state}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex w-full flex-col gap-2">
          <span className="text-sm font-medium text-charcoal/80">Country *</span>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full rounded-card border-2 border-taupe bg-oat px-4 py-3 text-charcoal shadow-soft outline-none transition-all duration-smooth ease-smooth focus:border-mocha focus:ring-2 focus:ring-mocha/30"
          >
            <option value="United States">United States</option>
            <option value="India">India</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
          </select>
          {errors.country ? <span className="text-sm text-error">{errors.country}</span> : null}
        </label>
        <Input
          label="Postal Code *"
          name="postalCode"
          value={formData.postalCode}
          onChange={handleChange}
          error={errors.postalCode}
        />
      </div>

      <Input
        label="Phone Number *"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
      />

      <Button type="submit" className="w-full">
        Continue to Payment
      </Button>
    </form>
  );
}
