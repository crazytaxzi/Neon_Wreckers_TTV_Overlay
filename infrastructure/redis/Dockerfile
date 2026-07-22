FROM redis:7.4.5-alpine

COPY --chmod=0555 infrastructure/redis/secure-entrypoint.sh /usr/local/bin/neon-redis

USER redis

ENTRYPOINT ["/usr/local/bin/neon-redis"]
CMD ["server"]
