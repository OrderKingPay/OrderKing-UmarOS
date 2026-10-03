-- Part 3 hardening: retain the real object-storage reference for delivery proof.
-- Additive migration only; no existing data is deleted.

alter table proof_of_delivery add column if not exists storage_url text;
create index if not exists pod_delivery_idx on proof_of_delivery (delivery_id, captured_at desc);
