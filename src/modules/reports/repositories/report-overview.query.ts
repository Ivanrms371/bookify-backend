import { Prisma } from 'src/generated/prisma/client';
import type { ReportScope } from '../types/reports.types';

// A single statement gives every section the same database snapshot.
// Appointment timestamps are stored as UTC timestamp-without-time-zone columns.
export function reportOverviewQuery(scope: ReportScope): Prisma.Sql {
  const start = Prisma.sql`(${scope.start.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
  const end = Prisma.sql`(${scope.endExclusive.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
  const previousStart = Prisma.sql`(${scope.previousStart.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
  const previousEnd = Prisma.sql`(${scope.previousEndExclusive.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
  return Prisma.sql`
    WITH scoped AS (
      SELECT a.service_id, a.professional_id, a.status,
        a.starts_at >= ${start} AS is_current,
        (a.starts_at AT TIME ZONE 'UTC' AT TIME ZONE ${scope.period.timeZone})::date::text AS day,
        CASE WHEN a.status = 'COMPLETED' THEN a.price - a.discount_amount ELSE 0 END AS revenue
      FROM appointments a
      WHERE a.tenant_id = ${scope.tenantId}::uuid
        AND ((a.starts_at >= ${start} AND a.starts_at < ${end})
          OR (a.starts_at >= ${previousStart} AND a.starts_at < ${previousEnd}))
        ${scope.professionalId ? Prisma.sql`AND a.professional_id = ${scope.professionalId}::uuid` : Prisma.empty}
        ${scope.serviceId ? Prisma.sql`AND a.service_id = ${scope.serviceId}::uuid` : Prisma.empty}
    ), daily AS (
      SELECT day AS date, SUM(revenue) AS revenue FROM scoped WHERE is_current GROUP BY day
    ), service_ranking AS (
      SELECT r.service_id AS id, COALESCE(s.name, 'Servicio no disponible') AS name,
        COUNT(*)::int AS completed, SUM(r.revenue) AS revenue
      FROM scoped r LEFT JOIN services s ON s.id = r.service_id AND s.tenant_id = ${scope.tenantId}::uuid
      WHERE r.is_current AND r.status = 'COMPLETED'
      GROUP BY r.service_id, s.name
      ORDER BY revenue DESC, r.service_id ASC LIMIT ${scope.topServicesLimit}
    ), professional_ranking AS (
      SELECT r.professional_id AS id, COALESCE(p.name, 'Profesional no disponible') AS name,
        COUNT(*) FILTER (WHERE r.status = 'COMPLETED')::int AS completed, SUM(r.revenue) AS revenue
      FROM scoped r LEFT JOIN professionals p ON p.id = r.professional_id AND p.tenant_id = ${scope.tenantId}::uuid
      WHERE r.is_current GROUP BY r.professional_id, p.name
    )
    SELECT jsonb_build_object(
      'summary', jsonb_build_object(
        'current', jsonb_build_object(
          'revenue', COALESCE(SUM(revenue) FILTER (WHERE is_current), 0),
          'completed', COUNT(*) FILTER (WHERE is_current AND status = 'COMPLETED')::int
        ),
        'previous', jsonb_build_object(
          'revenue', COALESCE(SUM(revenue) FILTER (WHERE NOT is_current), 0),
          'completed', COUNT(*) FILTER (WHERE NOT is_current AND status = 'COMPLETED')::int
        )
      ),
      'dailyRevenue', COALESCE((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.date) FROM daily d), '[]'::jsonb),
      'topServices', COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.revenue DESC, s.id) FROM service_ranking s), '[]'::jsonb),
      'professionals', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.revenue DESC, p.id) FROM professional_ranking p), '[]'::jsonb),
      'outcomes', jsonb_build_array(
        jsonb_build_object('key', 'completed', 'count', COUNT(*) FILTER (WHERE is_current AND status = 'COMPLETED')::int),
        jsonb_build_object('key', 'cancelled', 'count', COUNT(*) FILTER (WHERE is_current AND status = 'CANCELLED')::int),
        jsonb_build_object('key', 'noShow', 'count', COUNT(*) FILTER (WHERE is_current AND status = 'NO_SHOW')::int),
        jsonb_build_object('key', 'pendingConfirmed', 'count', COUNT(*) FILTER (WHERE is_current AND status IN ('PENDING', 'CONFIRMED'))::int)
      )
    ) AS data FROM scoped
  `;
}
