alter table jenkins_impl.builds
  drop column if exists shared_library_version,
  drop column if exists shared_library_name;