# ---- Base image ----
FROM hmctspublic.azurecr.io/base/node:16-alpine as base

USER root
RUN corepack enable
USER hmcts

COPY --chown=hmcts:hmcts . .

# ---- Runtime image ----
FROM base as runtime

COPY --from=base $WORKDIR/src/main ./src/main

EXPOSE 3080
