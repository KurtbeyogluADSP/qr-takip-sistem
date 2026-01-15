-- Migration to add Analytics function
-- Function to calculate monthly analytics for staff
-- Returns: Name, Days Worked, Avg Entry, Avg Exit, Total Hours

CREATE OR REPLACE FUNCTION get_monthly_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  total_work_days BIGINT,
  avg_entry_time TEXT,
  avg_exit_time TEXT,
  total_hours NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      a.user_id,
      DATE(a.timestamp) as work_date,
      MIN(a.timestamp) as entry_time,
      MAX(a.timestamp) as exit_time
    FROM attendance a
    WHERE 
      DATE_TRUNC('month', a.timestamp) = DATE_TRUNC('month', target_date)
    GROUP BY a.user_id, DATE(a.timestamp)
  ),
  user_aggregates AS (
    SELECT
      ds.user_id,
      COUNT(ds.work_date) as days_count,
      -- Casting time to timestamp for averaging, then back (Postgres dirty hack for time avg)
      -- actually AVG(time) works in newer postgres, but let's be safe:
      TO_TIMESTAMP(AVG(EXTRACT(EPOCH FROM ds.entry_time::time)))::time as avg_entry,
      TO_TIMESTAMP(AVG(EXTRACT(EPOCH FROM ds.exit_time::time)))::time as avg_exit,
      SUM(
        CASE 
          WHEN ds.exit_time > ds.entry_time THEN EXTRACT(EPOCH FROM (ds.exit_time - ds.entry_time))/3600 
          ELSE 0 
        END
      ) as total_hrs
    FROM daily_stats ds
    GROUP BY ds.user_id
  )
  SELECT
    ua.user_id,
    COALESCE(p.full_name, u.email, 'Unknown User')::text as user_name,
    ua.days_count,
    TO_CHAR(ua.avg_entry, 'HH24:MI'),
    TO_CHAR(ua.avg_exit, 'HH24:MI'),
    ROUND(ua.total_hrs::numeric, 1)
  FROM user_aggregates ua
  LEFT JOIN profiles p ON p.id = ua.user_id
  LEFT JOIN auth.users u ON u.id = ua.user_id;
END;
$$;

-- Grant execution to authenticated users (Admin will call this)
GRANT EXECUTE ON FUNCTION get_monthly_analytics(DATE) TO authenticated;
