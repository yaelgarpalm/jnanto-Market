-- Run this in Supabase SQL Editor if the connector session is not authenticated.
-- These columns let the route planner use GPS data from the database before falling back to geocoding.

alter table public.cooperatives
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists gps_device_name text;

alter table public.producers
  add column if not exists address text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.products
  add column if not exists pickup_address text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.orders
  add column if not exists shipping_latitude numeric,
  add column if not exists shipping_longitude numeric,
  add column if not exists gps_device_name text;

update public.cooperatives
set latitude = 19.7269,
    longitude = -99.9724,
    gps_device_name = coalesce(gps_device_name, 'Dispositivo GPS Coop Norte')
where id = 'coop-1' and latitude is null and longitude is null;

update public.cooperatives
set latitude = 19.5858,
    longitude = -99.7747,
    gps_device_name = coalesce(gps_device_name, 'Dispositivo GPS Coop Centro')
where id = 'coop-2' and latitude is null and longitude is null;

update public.cooperatives
set latitude = 19.795,
    longitude = -99.9618,
    gps_device_name = coalesce(gps_device_name, 'Dispositivo GPS Coop Alfareros')
where id = 'coop-3' and latitude is null and longitude is null;

update public.producers
set address = coalesce(address, 'San Pedro el Alto, San Felipe del Progreso, Estado de Mexico'),
    latitude = 19.7281,
    longitude = -99.9741
where id = 'prod-1' and latitude is null and longitude is null;

update public.producers
set address = coalesce(address, 'San Andrés del Pedregal, Ixtlahuaca, Estado de Mexico'),
    latitude = 19.5872,
    longitude = -99.7785
where id = 'prod-2' and latitude is null and longitude is null;

update public.producers
set address = coalesce(address, 'San Francisco Tepeolulco, San Felipe del Progreso, Estado de Mexico'),
    latitude = 19.7932,
    longitude = -99.9631
where id = 'prod-3' and latitude is null and longitude is null;

update public.products p
set pickup_address = coalesce(p.pickup_address, pr.address),
    latitude = pr.latitude,
    longitude = pr.longitude
from public.producers pr
where p.producer_id = pr.id
  and p.latitude is null
  and p.longitude is null;
