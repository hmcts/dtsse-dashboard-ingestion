UPDATE github.repository
SET team_id = (SELECT id FROM team WHERE description = 'Performance Test')
WHERE short_name = 'prl-performance';
