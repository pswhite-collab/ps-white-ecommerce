import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import adminService from '../../services/adminService';
import orderService from '../../services/orderService';

const ORDER_STATUS = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trackingDrafts, setTrackingDrafts] = useState({});

  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [trackingUpdatingId, setTrackingUpdatingId] = useState('');
  const [notifyingId, setNotifyingId] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAdminOrders({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setOrders(data.orders || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, page, search, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const resolveTrackingValue = (order, field) => {
    return trackingDrafts[order._id]?.[field] ?? order.shipping?.[field] ?? '';
  };

  const updateTrackingDraft = (order, updates) => {
    setTrackingDrafts((prev) => ({
      ...prev,
      [order._id]: {
        carrier: prev[order._id]?.carrier ?? order.shipping?.carrier ?? '',
        trackingNumber: prev[order._id]?.trackingNumber ?? order.shipping?.trackingNumber ?? '',
        ...updates,
      },
    }));
  };

  const onUpdateStatus = async (order, nextStatus) => {
    setError('');
    setSuccess('');
    setStatusUpdatingId(order._id);

    try {
      await orderService.updateOrderStatus(order._id, {
        status: nextStatus,
        carrier: resolveTrackingValue(order, 'carrier'),
        trackingNumber: resolveTrackingValue(order, 'trackingNumber'),
      });
      setSuccess(`Order ${order.orderNumber} updated to ${nextStatus}.`);
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Failed to update order status.');
    } finally {
      setStatusUpdatingId('');
    }
  };

  const onUpdateTracking = async (order, autoNotify = true) => {
    const carrier = String(resolveTrackingValue(order, 'carrier')).trim();
    const trackingNumber = String(resolveTrackingValue(order, 'trackingNumber')).trim();

    if (!carrier || !trackingNumber) {
      setError('Please enter both carrier and tracking number before updating.');
      return;
    }

    setError('');
    setSuccess('');
    setTrackingUpdatingId(order._id);

    try {
      const response = await orderService.updateOrderTracking(order._id, {
        carrier,
        trackingNumber,
        autoNotify,
      });

      setSuccess(response?.message || 'Tracking updated successfully.');
      setTrackingDrafts((prev) => {
        const next = { ...prev };
        delete next[order._id];
        return next;
      });
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Failed to update tracking information.');
    } finally {
      setTrackingUpdatingId('');
    }
  };

  const onSendNotification = async (order) => {
    const shouldSend = window.confirm(`Send shipping notification email for ${order.orderNumber}?`);
    if (!shouldSend) {
      return;
    }

    setError('');
    setSuccess('');
    setNotifyingId(order._id);

    try {
      const response = await orderService.sendShippingNotification(order._id);
      setSuccess(response?.message || 'Shipping notification sent.');
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Failed to send shipping notification.');
    } finally {
      setNotifyingId('');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="rounded-card border border-taupe/30 bg-milk p-6 shadow-soft">
        <h1 className="font-display text-4xl text-mocha">Manage Orders</h1>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search order no. or guest email"
            className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {ORDER_STATUS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
            className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
            className="rounded-card border border-taupe/50 bg-oat px-3 py-2 text-sm"
          />
        </div>

        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-success">{success}</p> : null}

        {loading ? (
          <div className="mt-4 rounded-card bg-oat/60 p-6">Loading orders...</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-taupe/40">
                  <th className="px-3 py-2">Order ID</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Tracking</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-taupe/20">
                    <td className="px-3 py-2">{order.orderNumber}</td>
                    <td className="px-3 py-2">
                      {order.user
                        ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email
                        : order.guestEmail || 'Guest'}
                    </td>
                    <td className="px-3 py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">${Number(order.total || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      {order.hasPhysicalItems ? (
                        <div className="min-w-[220px] space-y-1">
                          <input
                            value={resolveTrackingValue(order, 'carrier')}
                            onChange={(event) => {
                              updateTrackingDraft(order, { carrier: event.target.value });
                            }}
                            placeholder="Carrier"
                            className="w-full rounded-card border border-taupe/40 bg-oat px-2 py-1 text-xs"
                          />
                          <input
                            value={resolveTrackingValue(order, 'trackingNumber')}
                            onChange={(event) => {
                              updateTrackingDraft(order, { trackingNumber: event.target.value });
                            }}
                            placeholder="Tracking number"
                            className="w-full rounded-card border border-taupe/40 bg-oat px-2 py-1 text-xs"
                          />
                          {order.notifications?.shippingNotificationSent ? (
                            <p className="text-[11px] text-success">
                              Notified on{' '}
                              {new Date(order.notifications.shippingNotificationSentAt).toLocaleDateString()}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-charcoal/60">Digital only</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={order.status}
                        disabled={statusUpdatingId === order._id}
                        onChange={(event) => onUpdateStatus(order, event.target.value)}
                        className="rounded-card border border-taupe/50 bg-oat px-2 py-1"
                      >
                        {ORDER_STATUS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      {order.hasPhysicalItems ? (
                        <div className="flex min-w-[220px] gap-2">
                          <Button
                            size="sm"
                            onClick={() => onUpdateTracking(order, true)}
                            disabled={trackingUpdatingId === order._id || notifyingId === order._id}
                          >
                            {trackingUpdatingId === order._id ? 'Updating...' : 'Update & Notify'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSendNotification(order)}
                            disabled={
                              notifyingId === order._id ||
                              trackingUpdatingId === order._id ||
                              !resolveTrackingValue(order, 'trackingNumber')
                            }
                          >
                            {notifyingId === order._id ? 'Sending...' : 'Send Notification'}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-charcoal/60">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!orders.length ? (
              <div className="rounded-card bg-oat/50 p-5 text-sm text-charcoal/70">
                No orders found for the selected filters.
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-charcoal/70">
            Page {pagination?.page || page} of {pagination?.totalPages || 1}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={(pagination?.page || page) <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={Boolean(pagination && pagination.page >= pagination.totalPages)}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
