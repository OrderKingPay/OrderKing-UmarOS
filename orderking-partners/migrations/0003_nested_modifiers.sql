-- Migration 0003: Nested Item Modifiers & Customization Groups
alter table items add column if not exists modifier_groups jsonb default '[]'::jsonb;
