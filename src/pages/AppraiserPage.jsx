import { useState } from 'react';
import * as api from '../api.js';
import ClaimsBoard from '../components/ClaimsBoard.jsx';
import { formatDate, formatMoney } from '../components/format.js';
import { useLoader, useTab } from '../components/hooks.js';
import {
  Button,
  ConflictDialog,
  EmptyState,
  ErrorAlert,
  Modal,
  Pagination,
  Skeletons,
  StatusBadge,
  useToast,
} from '../components/ui.jsx';

const TABS = [
  { id: 'available', label: 'תביעות פתוחות' },
  { id: 'mine', label: 'התביעות שלי' },
  { id: 'referrals', label: 'ההפניות שלי' },
  { id: 'contacts', label: 'לקוחות שלי' },
];

export default function AppraiserPage({ user }) {
  const [tab, setTab] = useTab(TABS, 'available');

  return (
    <div className="page">
      <div className="page-head">
        <h1>שלום, {user.fullName}</h1>
        <p className="muted">תביעות פתוחות בתחומי ההתמחות שלכם, והתביעות וההפניות שבטיפולכם.</p>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((item) => (
          <button key={item.id} role="tab" className="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'available' && <AvailableClaims />}
      {tab === 'mine' && <MyClaims />}
      {tab === 'referrals' && <Referrals />}
      {tab === 'contacts' && <Contacts />}
    </div>
  );
}

/** Open claims the appraiser may take. Pressing "take" races against the other appraisers. */
function AvailableClaims() {
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);
  const [conflict, setConflict] = useState('');

  const take = async (claim, reload) => {
    setBusyId(claim.id);
    try {
      await api.takeClaim(claim.id, claim.version);
      toast.success(`התביעה ${claim.claimNumber} נלקחה לטיפולך`);
    } catch (error) {
      if (error.status === 409) {
        setConflict(error.message); // another appraiser got there first - the important message
      } else {
        toast.error(error.message);
      }
    } finally {
      setBusyId(null);
      reload(); // either way the list changes: the claim left the pool
    }
  };

  return (
    <>
      <ClaimsBoard
        load={(query) => api.getClaims({ ...query, scope: 'Available' })}
        showClient
        emptyTitle="אין כרגע תביעות פתוחות"
        emptyText="תביעות חדשות בתחומי ההתמחות שלכם יופיעו כאן."
        header={<h2>תביעות פתוחות לטיפול</h2>}
        renderActions={(claim, reload) => (
          <Button size="sm" busy={busyId === claim.id} disabled={busyId !== null} onClick={() => take(claim, reload)}>
            קח לטיפול
          </Button>
        )}
      />
      {conflict && <ConflictDialog message={conflict} onClose={() => setConflict('')} />}
    </>
  );
}

function MyClaims() {
  const toast = useToast();
  const [contactId, setContactId] = useState(null);

  const decide = async (claim, status, reload) => {
    try {
      await api.setClaimStatus(claim.id, status, claim.version);
      toast.success(status === 'Approved' ? 'התביעה אושרה' : 'התביעה נדחתה');
    } catch (error) {
      toast.error(error.message);
    } finally {
      reload();
    }
  };

  return (
    <>
      <ClaimsBoard
        load={(query) => api.getClaims({ ...query, scope: 'Mine' })}
        statuses={['InTreatment', 'Approved', 'Rejected', 'Cancelled']}
        showClient
        header={<h2>התביעות שבטיפולי</h2>}
        emptyTitle="עדיין לא לקחתם תביעות"
        emptyText="עברו ללשונית 'תביעות פתוחות' ולחצו 'קח לטיפול'."
        renderActions={(claim, reload) => (
          <>
            {claim.status === 'InTreatment' && (
              <>
                <Button size="sm" variant="success" onClick={() => decide(claim, 'Approved', reload)}>
                  אישור
                </Button>
                <Button size="sm" variant="danger" onClick={() => decide(claim, 'Rejected', reload)}>
                  דחייה
                </Button>
              </>
            )}
            {claim.status === 'InTreatment' && (
              <Button size="sm" variant="secondary" onClick={() => setContactId(claim.clientId)}>
                פרטי קשר של הלקוח
              </Button>
            )}
          </>
        )}
      />
      {contactId && <ContactModal clientId={contactId} onClose={() => setContactId(null)} />}
    </>
  );
}

function ContactCard({ client }) {
  return (
    <div className="stack">
      <div className="claim-number">{client.fullName}</div>
      <dl className="claim-meta">
        <div>
          <dt>טלפון</dt>
          <dd dir="ltr" style={{ textAlign: 'start' }}>
            <a href={`tel:${client.phone}`}>{client.phone}</a>
          </dd>
        </div>
        <div>
          <dt>אימייל</dt>
          <dd dir="ltr" style={{ textAlign: 'start' }}>
            <a href={`mailto:${client.email}`}>{client.email}</a>
          </dd>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <dt>כתובת</dt>
          <dd>{client.address}</dd>
        </div>
      </dl>
    </div>
  );
}

function ContactModal({ clientId, onClose }) {
  const { loading, error, data } = useLoader(() => api.getClient(clientId), [clientId]);
  return (
    <Modal title="פרטי קשר של הלקוח" onClose={onClose}>
      <ErrorAlert error={error} />
      {loading && !data ? <Skeletons count={1} /> : data && <ContactCard client={data} />}
      <div className="modal-actions">
        <Button variant="secondary" onClick={onClose}>
          סגירה
        </Button>
      </div>
    </Modal>
  );
}

function Referrals() {
  const [page, setPage] = useState(1);
  const { loading, error, data, reload } = useLoader(() => api.getReferrals({ page, pageSize: 6 }), [page]);

  return (
    <div className="stack">
      <h2>ההפניות שלי</h2>
      <ErrorAlert error={error} />
      {loading && !data ? (
        <Skeletons />
      ) : data && data.items.length === 0 ? (
        <EmptyState title="אין הפניות" text="הפניה נוצרת אוטומטית כשאתם לוקחים תביעה לטיפול." />
      ) : (
        data && (
          <div className="grid">
            {data.items.map((referral) => (
              <ReferralCard key={referral.id} referral={referral} onSaved={reload} />
            ))}
          </div>
        )
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}

function ReferralCard({ referral, onSaved }) {
  const toast = useToast();
  const [notes, setNotes] = useState(referral.notes ?? '');
  const [busy, setBusy] = useState(false);
  const dirty = notes !== (referral.notes ?? '');

  const save = async () => {
    setBusy(true);
    try {
      await api.updateReferral(referral.id, notes);
      toast.success('ההערות נשמרו');
      onSaved();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card claim-card">
      <div className="claim-head">
        <div>
          <div className="claim-number">{referral.claimNumber}</div>
          <div className="muted small">
            {referral.insuranceTypeName} · {referral.clientName}
          </div>
        </div>
        <StatusBadge status={referral.claimStatus} />
      </div>
      <p className="claim-desc">{referral.claimDescription}</p>
      <div className="row between">
        <span className="claim-amount">{formatMoney(referral.claimAmount)}</span>
        <span className="muted small">הופנתה ב-{formatDate(referral.referredAt)}</span>
      </div>
      <div className="field">
        <label htmlFor={`notes-${referral.id}`}>הערות שמאי</label>
        <textarea
          id={`notes-${referral.id}`}
          className="textarea"
          style={{ minHeight: 84 }}
          value={notes}
          maxLength={2000}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
      <div className="claim-actions">
        <Button size="sm" busy={busy} disabled={!dirty} onClick={save}>
          שמירת הערות
        </Button>
      </div>
    </article>
  );
}

function Contacts() {
  const [page, setPage] = useState(1);
  const { loading, error, data } = useLoader(() => api.getClients({ page, pageSize: 6 }), [page]);

  return (
    <div className="stack">
      <div>
        <h2>הלקוחות שלי</h2>
        <p className="muted small">פרטי קשר של לקוחות שיש להם אצלכם תביעה בטיפול. שאר הלקוחות אינם מוצגים.</p>
      </div>
      <ErrorAlert error={error} />
      {loading && !data ? (
        <Skeletons count={2} />
      ) : data && data.items.length === 0 ? (
        <EmptyState title="אין לקוחות כרגע" text="לקוחות יופיעו כאן כשתיקחו תביעה שלהם לטיפול." />
      ) : (
        data && (
          <div className="grid">
            {data.items.map((client) => (
              <div key={client.id} className="card">
                <ContactCard client={client} />
              </div>
            ))}
          </div>
        )
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
