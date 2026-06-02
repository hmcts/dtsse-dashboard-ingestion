alter table jenkins_impl.builds
  add column if not exists shared_library_name varchar,
  add column if not exists shared_library_version varchar;