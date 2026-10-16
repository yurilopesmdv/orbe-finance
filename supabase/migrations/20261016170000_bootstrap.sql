-- Orbe only: no financial records, shared project or provider credentials.
create schema if not exists orbe_private;
revoke all on schema orbe_private from public, anon, authenticated;
comment on schema orbe_private is 'Orbe private access metadata; never store bank payloads here.';
