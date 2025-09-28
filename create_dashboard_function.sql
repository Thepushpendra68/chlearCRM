-- Create optimized dashboard statistics function
-- This function consolidates multiple dashboard queries into a single optimized query

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_company_id UUID,
  p_assigned_to UUID DEFAULT NULL,
  p_thirty_days_ago TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_leads BIGINT,
  new_leads BIGINT,
  converted_leads BIGINT,
  conversion_rate TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_leads BIGINT := 0;
  v_new_leads BIGINT := 0;
  v_converted_leads BIGINT := 0;
  v_conversion_rate TEXT := '0.0%';
BEGIN
  -- Set default thirty days ago if not provided
  IF p_thirty_days_ago IS NULL THEN
    p_thirty_days_ago := NOW() - INTERVAL '30 days';
  END IF;

  -- Get total leads count
  SELECT COUNT(*) INTO v_total_leads
  FROM leads
  WHERE company_id = p_company_id
    AND (p_assigned_to IS NULL OR assigned_to = p_assigned_to);

  -- Get new leads count (last 30 days)
  SELECT COUNT(*) INTO v_new_leads
  FROM leads
  WHERE company_id = p_company_id
    AND (p_assigned_to IS NULL OR assigned_to = p_assigned_to)
    AND created_at >= p_thirty_days_ago;

  -- Get converted leads count
  SELECT COUNT(*) INTO v_converted_leads
  FROM leads
  WHERE company_id = p_company_id
    AND (p_assigned_to IS NULL OR assigned_to = p_assigned_to)
    AND status = 'converted';

  -- Calculate conversion rate
  IF v_total_leads > 0 THEN
    v_conversion_rate := ROUND((v_converted_leads::DECIMAL / v_total_leads::DECIMAL) * 100, 1) || '%';
  END IF;

  -- Return results
  RETURN QUERY SELECT
    v_total_leads,
    v_new_leads,
    v_converted_leads,
    v_conversion_rate;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID, UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_dashboard_stats(UUID, UUID, TIMESTAMP WITH TIME ZONE) IS
'Optimized dashboard statistics function that returns lead counts and conversion rate in a single query';