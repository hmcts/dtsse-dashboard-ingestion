CREATE TYPE github.decision_type AS ENUM ('approved', 'review_required', 'changes_requested', 'commented', 'dismissed', 'pending');

CREATE TABLE IF NOT EXISTS github.pull_request (
  "timestamp" TIMESTAMP NOT NULL,
  "team" VARCHAR(255) NOT NULL,
  "repository" VARCHAR(256) NOT NULL,
  "title" VARCHAR(257) NOT NULL,
  "url" VARCHAR(258),
  "created_at" TIME WITHOUT TIME ZONE NOT NULL,
  "closed_at" TIME WITHOUT TIME ZONE DEFAULT NULL,
  "changed_files" INT NOT NULL,
  "additions" INT NOT NULL,
  "deletions" INT NOT NULL,
  "author" VARCHAR(259) NOT NULL,
  "body_text" TEXT NOT NULL,
  "review_decision" github.decision_type DEFAULT NULL,
  "labels" TEXT DEFAULT NULL,
  "jira_refs" TEXT DEFAULT NULL
);
