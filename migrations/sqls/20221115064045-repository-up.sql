CREATE TABLE github.repository (
    id VARCHAR(255) PRIMARY KEY NOT NULL,
    short_name VARCHAR(255) NOT NULL,
    git_url VARCHAR(255) NOT NULL,
    web_url VARCHAR(255) NOT NULL,
    team_alias VARCHAR(255) NOT NULL
);
