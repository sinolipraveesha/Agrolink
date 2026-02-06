-- Add Delivery Coordinates to Orders Table
alter table public.orders 
add column delivery_latitude double precision,
add column delivery_longitude double precision;
