FROM rockylinux/rockylinux:9-ubi-micro AS build

ARG service

COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /build

COPY package.json bun.lock ./
COPY packages packages
RUN /usr/local/bin/bun install --frozen-lockfile

COPY turbo.json .
RUN /usr/local/bin/bun run build --filter "@shutters/${service}"

FROM rockylinux/rockylinux:9-ubi-micro AS run

ARG service
COPY --from=build /build/packages/${service}/dist/${service} /usr/local/bin/start

ARG vcs_ref
LABEL org.label-schema.vcs-ref=$vcs_ref \
  org.label-schema.vcs-url="CHANGEME" \
  SERVICE_TAGS=$vcs_ref
ENV APP_REVISION=${vcs_ref}

CMD [ "/usr/local/bin/start" ]
