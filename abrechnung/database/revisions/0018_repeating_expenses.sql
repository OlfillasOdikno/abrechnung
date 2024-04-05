-- revision: b1ec3ecb
-- requires: 04424b59

alter table transaction_history add column repeat text default '' not null;
