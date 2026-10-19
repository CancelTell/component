import type { ReactNode } from 'react';
import { Check, CircleHelp, Minus, X } from 'lucide-react';
import type { CheckResult, CheckStatus } from '@/lib/compatibility';

export const statusText: Record<CheckStatus, string> = {
  ok: 'Подходит',
  warn: 'Есть замечание',
  fail: 'Не подходит',
  unknown: 'Не проверено',
  pending: 'Ждёт выбора',
};

/** Same icon, colour and word for a status everywhere on the site */
export function StatusIcon({ status, size = 14 }: { status: CheckStatus; size?: number }) {
  const icon = {
    ok: <Check size={size} strokeWidth={3} />,
    fail: <X size={size} strokeWidth={3} />,
    warn: <span className="status-icon__mark">!</span>,
    unknown: <CircleHelp size={size} strokeWidth={2.5} />,
    pending: <Minus size={size - 2} strokeWidth={2.5} />,
  }[status];
  return (
    <span className={`status-icon status-icon--${status}`} aria-hidden="true">
      {icon}
    </span>
  );
}

export function StatusBadge({ status, children }: { status: CheckStatus; children?: ReactNode }) {
  return (
    <span className={`sbadge sbadge--${status}`}>
      <StatusIcon status={status} size={12} />
      {children ?? statusText[status]}
    </span>
  );
}

/** Compatibility checks with «Подробнее» in plain language */
export function CheckList({ checks, hidePending = false }: { checks: CheckResult[]; hidePending?: boolean }) {
  const list = hidePending ? checks.filter((c) => c.status !== 'pending') : checks;
  return (
    <ul className="checks" role="list" aria-live="polite">
      {list.map((c) => (
        <li key={c.id} className={`checks__item checks__item--${c.status}`}>
          <StatusIcon status={c.status} />
          <div className="checks__text">
            <p className="checks__title">
              {c.title}
              <span className="visually-hidden">: {statusText[c.status]}</span>
            </p>
            <p className="checks__msg">{c.message}</p>
            {c.details && c.status !== 'pending' && (
              <details className="checks__more">
                <summary>Подробнее</summary>
                <p>{c.details}</p>
              </details>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** One-line verdict for a whole build */
export function verdict(checks: CheckResult[]): { status: CheckStatus; title: string } {
  const has = (s: CheckStatus) => checks.some((c) => c.status === s);
  if (has('fail')) return { status: 'fail', title: 'Есть несовместимость' };
  if (has('warn')) return { status: 'warn', title: 'Совместимо, есть замечания' };
  if (has('pending')) return { status: 'pending', title: 'Выбраны не все детали' };
  if (has('unknown')) return { status: 'unknown', title: 'Совместимо, часть не проверена' };
  return { status: 'ok', title: 'Всё совместимо' };
}
