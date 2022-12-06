begin;
alter table jenkins_impl.steps drop constraint build_steps_step_id_fkey;
alter table jenkins_impl.steps
  add constraint build_steps_step_id_fkey
    foreign key (step_id) references jenkins_impl.step_names (step_id)
    on update cascade;
commit;
