# ---- Base image ----
FROM hmctspublic.azurecr.io/base/node:18-alpine as base

USER root
RUN corepack enable
USER hmcts

COPY --chown=hmcts:hmcts . .
RUN yarn install

# ---- Build image ----
FROM base as build

# ---- Runtime image ----
FROM base as runtime

EXPOSE 3080
