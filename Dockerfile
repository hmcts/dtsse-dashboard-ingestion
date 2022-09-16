# ---- Base image ----
FROM hmctspublic.azurecr.io/base/node:16-alpine as base
COPY --chown=hmcts:hmcts . .
RUN yarn install --production \
  && yarn cache clean

# ---- Runtime image ----
FROM base as runtime
COPY --from=base $WORKDIR/src/main ./src/main

EXPOSE 3080
