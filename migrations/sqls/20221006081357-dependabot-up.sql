CREATE TABLE dependabot (
    id VARCHAR(255) PRIMARY KEY NOT NULL,
    repository VARCHAR(255) NOT NULL,
    team VARCHAR(255) NOT NULL,
    dependabotv1 BOOLEAN NOT NULL,
    dependabotv2 BOOLEAN NOT NULL,
    renovate BOOLEAN NOT NULL,
    dependabotv1main BOOLEAN NOT NULL,
    dependabotv2main BOOLEAN NOT NULL,
    renovatemain BOOLEAN NOT NULL,
    enabled BOOLEAN NOT NULL
);
