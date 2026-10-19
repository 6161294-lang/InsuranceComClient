import { useCallback, useEffect, useState } from 'react';
import { getClaims, takeClaim, updateClaimStatus } from '../api.js';
import ConflictDialog from '../components/ConflictDialog.jsx';

const PAGE_SIZE = 5;

const STATUS_LABELS = {
  Open: 'פתוחה',
  InProgress: 'בטיפול',
  Approved: 'אושרה',
  Rejected: 'נדחתה',
};

const VIEWS = {
  open: { title: 'תביעות פתוחות' },
  mine: { title: 'בטיפולי' },
};

const formatAmount = (amount) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(amount);

const formatDate = (value) => new Date(value).toLocaleDateString('he-IL');

export default function ClaimsPage({ employee, onLogout }) {
  const isAdjuster = employee.role === 'Adjuster';

  const [view, setView] = useState('open');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], totalCount: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [busyClaimId, setBusyClaimId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [conflict, setConflict] = useState(null); // message of a 409 response

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query =
        view === 'open'
          ? { page, pageSize: PAGE_SIZE, status: 'Open' }
          : { page, pageSize: PAGE_SIZE, handlerId: employee.id };
      const result = await getClaims(query);

      // If the current page became empty (e.g. its last claim was taken), step back one page.
      if (result.items.length === 0 && page > 1) {
        setPage((p) => p - 1);
        return;
      }
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [view, page, employee.id]);

  useEffect(() => {
    load();
  }, [load]);

  const switchView = (next) => {
    setView(next);
    setPage(1);
    setSuccess('');
  };

  const take = async (claim) => {
    setBusyClaimId(claim.id);
    setError('');
    setSuccess('');
    try {
      await takeClaim(claim.id, claim.version);
      setSuccess(`התביעה "${claim.title}" נלקחה לטיפולך`);
      await load();
    } catch (e) {
      if (e.status === 409) {
        setConflict(e.message);
      } else {
        setError(e.message);
      }
    } finally {
      setBusyClaimId(null);
    }
  };

  const changeStatus = async (claim, status) => {
    setBusyClaimId(claim.id);
    setError('');
    setSuccess('');
    try {
      await updateClaimStatus(claim.id, status, claim.version);
      setSuccess(`הסטטוס של "${claim.title}" עודכן ל${STATUS_LABELS[status]}`);
      await load();
    } catch (e) {
      if (e.status === 409) {
        setConflict(e.message);
      } else {
        setError(e.message);
      }
    } finally {
      setBusyClaimId(null);
    }
  };

  return (
    <main className="card">
      <header className="topbar">
        <div>
          שלום, <strong>{employee.fullName}</strong> ({employee.role === 'Manager' ? 'מנהל' : 'שמאי'})
          {employee.specializations?.length > 0 && (
            <small> · התמחות: {employee.specializations.map((s) => s.name).join(', ')}</small>
          )}
        </div>
        <button type="button" onClick={onLogout}>התנתקות</button>
      </header>

      <nav className="tabs">
        {Object.entries(VIEWS)
          .filter(([key]) => key === 'open' || isAdjuster)
          .map(([key, { title }]) => (
            <button
              key={key}
              type="button"
              className={view === key ? 'active' : ''}
              onClick={() => switchView(key)}
            >
              {title}
            </button>
          ))}
        <button type="button" onClick={load} disabled={loading}>רענון</button>
      </nav>

      {!isAdjuster && <p className="hint">רק שמאים יכולים לקחת תביעות לטיפול.</p>}
      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>טוען...</p>
      ) : data.items.length === 0 ? (
        <p>אין תביעות להצגה.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>כותרת</th>
              <th>פוליסה</th>
              <th>סוג ביטוח</th>
              <th>סכום</th>
              <th>נפתחה</th>
              <th>סטטוס</th>
              {isAdjuster && <th>פעולה</th>}
            </tr>
          </thead>
          <tbody>
            {data.items.map((claim) => (
              <tr key={claim.id}>
                <td>{claim.id}</td>
                <td title={claim.description}>{claim.title}</td>
                <td>{claim.policyNumber}</td>
                <td>{claim.insuranceTypeName}</td>
                <td>{formatAmount(claim.amount)}</td>
                <td>{formatDate(claim.createdAt)}</td>
                <td>{STATUS_LABELS[claim.status] ?? claim.status}</td>
                {isAdjuster && (
                  <td className="actions">
                    {claim.status === 'Open' && (
                      <button type="button" disabled={busyClaimId === claim.id} onClick={() => take(claim)}>
                        {busyClaimId === claim.id ? '...' : 'קח לטיפול'}
                      </button>
                    )}
                    {claim.status === 'InProgress' && claim.handlerId === employee.id && (
                      <>
                        <button type="button" disabled={busyClaimId === claim.id} onClick={() => changeStatus(claim, 'Approved')}>
                          אשר
                        </button>
                        <button type="button" disabled={busyClaimId === claim.id} onClick={() => changeStatus(claim, 'Rejected')}>
                          דחה
                        </button>
                        <button type="button" disabled={busyClaimId === claim.id} onClick={() => changeStatus(claim, 'Open')}>
                          שחרר
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer className="pager">
        <button type="button" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)}>
          הקודם
        </button>
        <span>
          עמוד {data.totalPages === 0 ? 0 : page} מתוך {data.totalPages} ({data.totalCount} תביעות)
        </span>
        <button type="button" disabled={loading || page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
          הבא
        </button>
      </footer>

      {conflict && (
        <ConflictDialog
          message={conflict}
          onClose={() => {
            setConflict(null);
            load();
          }}
        />
      )}
    </main>
  );
}
