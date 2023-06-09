create schema helm;

create table helm.base_charts(
  namespace varchar not null,
  team varchar not null,
  deprecated_chart_count varchar not null,
  date DATE DEFAULT CURRENT_DATE,
  primary key (namespace, date)
);
