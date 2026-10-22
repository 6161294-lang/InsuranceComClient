// Display helpers: Hebrew labels, currency and dates (the API sends UTC timestamps).

export const STATUS = {
  Draft: { label: 'טיוטה', tone: 'neutral' },
  Opened: { label: 'נפתחה', tone: 'info' },
  InTreatment: { label: 'בטיפול', tone: 'warning' },
  Approved: { label: 'אושרה', tone: 'success' },
  Rejected: { label: 'נדחתה', tone: 'danger' },
  Cancelled: { label: 'בוטלה', tone: 'neutral' },
};

export const ROLE_LABELS = { Client: 'לקוח', Manager: 'מנהל', Appraiser: 'שמאי' };

const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 });
export const formatMoney = (value) => currency.format(value ?? 0);

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
