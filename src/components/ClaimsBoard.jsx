import { useState } from 'react';
import { formatDate, formatMoney, STATUS } from './format.js';
import { useLoader } from './hooks.js';
import { EmptyState, ErrorAlert, Pagination, Skeletons, StatusBadge } from './ui.jsx';

const PAGE_SIZE = 6;

export function ClaimCard({ claim, showClient, actions }) {
  return (
    <article className="card claim-card">
      <div className="claim-head">
        <div>
          <div className="claim-number">{claim.claimNumber}</div>
          <div className="muted small">{claim.insuranceTypeName}</div>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      <p className="claim-desc">{claim.description}</p>

      <div className="claim-amount">{formatMoney(claim.amount)}</div>

      <dl className="claim-meta">
        <div>
          <dt>תאריך פתיחה</dt>
          <dd>{formatDate(claim.openedAt)}</dd>
        </div>
        {showClient && (
          <div>
            <dt>לקוח</dt>
            <dd>{claim.clientName}</dd>
          </div>
        )}
        <div>
          <dt>שמאי מטפל</dt>
          <dd>{claim.handlerName ?? 'טרם נלקחה'}</dd>
        </div>
      </dl>

      {actions && <div className="claim-actions">{actions}</div>}
    </article>
  );
}

/**
 * A paged, filterable list of claims. `load({ page, pageSize, status })` fetches a page;
 * `renderActions(claim, reload)` renders the buttons of a card.
 */
export default function ClaimsBoard({ load, statuses, renderActions, showClient, emptyTitle, emptyText, header }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { loading, error, data, reload } = useLoader(() => load({ page, pageSize: PAGE_SIZE, status }), [page, status]);

  const selectStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="stack">
      {header}

      {statuses && (
        <div className="filters" role="group" aria-label="סינון לפי סטטוס">
          <button className="filter" aria-pressed={status === ''} onClick={() => selectStatus('')}>
            הכול
          </button>
          {statuses.map((value) => (
            <button key={value} className="filter" aria-pressed={status === value} onClick={() => selectStatus(value)}>
              {STATUS[value].label}
            </button>
          ))}
        </div>
      )}

      <ErrorAlert error={error} />

      {loading && !data ? (
        <Skeletons />
      ) : data && data.items.length === 0 ? (
        <EmptyState title={emptyTitle ?? 'אין תביעות להצגה'} text={emptyText} />
      ) : (
        data && (
          <div className="grid" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
            {data.items.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                showClient={showClient}
                actions={renderActions?.(claim, reload)}
              />
            ))}
          </div>
        )
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
