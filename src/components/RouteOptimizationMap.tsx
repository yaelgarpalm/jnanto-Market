import React, { useEffect, useMemo, useRef, useState } from "react";
import OlMap from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import { Fill, Icon, Stroke, Style, Text } from "ol/style";
import "ol/ol.css";
import { Cooperative, Order, Producer, Product, Profile } from "../types";

type PlannerMode = "customer" | "producer" | "cooperative";

interface ShippingForm {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
}

interface Stop {
  id: string;
  label: string;
  kind: "depot" | "pickup" | "delivery";
  address: string;
  query: string;
  lon: number;
  lat: number;
  demand: number;
  orderId?: string;
  geocoded?: boolean;
  productNames?: string[];
}

interface RouteOptimizationMapProps {
  mode: PlannerMode;
  title?: string;
  profile?: Profile | null;
  products?: Product[];
  producers?: Producer[];
  cooperatives?: Cooperative[];
  orders?: Order[];
  shippingForm?: ShippingForm;
  cart?: { product: Product; quantity: number }[];
}

const SAN_FELIPE_CENTER = { lon: -99.9511, lat: 19.7124 };
const DEFAULT_CENTER = SAN_FELIPE_CENTER;
const VEHICLE_CAPACITY = 24;
const KG_PER_PIECE = 1.8;
const COST_PER_KM = 9.5;
const CO2_PER_KM = 0.19;
const geocodeCache = new Map<string, { lon: number; lat: number } | null>();
const LOCAL_BOUNDS = {
  minLon: -100.75,
  maxLon: -98.5,
  minLat: 18.75,
  maxLat: 20.35,
};

const KNOWN_COORDS: Record<string, { lon: number; lat: number }> = {
  "san felipe del progreso": { lon: -99.951, lat: 19.712 },
  "san jose del rincon": { lon: -100.155, lat: 19.661 },
  "ixtlahuaca": { lon: -99.767, lat: 19.568 },
  "atlacomulco": { lon: -99.875, lat: 19.799 },
  "temascalcingo": { lon: -100.004, lat: 19.916 },
  "el oro": { lon: -100.134, lat: 19.802 },
  "toluca": { lon: -99.656, lat: 19.292 },
  "metepec": { lon: -99.601, lat: 19.251 },
  "ciudad de mexico": { lon: -99.133, lat: 19.433 },
  "cdmx": { lon: -99.133, lat: 19.433 },
  "oaxaca": { lon: -96.721, lat: 17.073 },
};

function normalize(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hashOffset(seed: string, scale: number) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return ((hash % 2000) / 1000 - 1) * scale;
}

function resolveCoord(seed: string, city?: string | null, state?: string | null, postalCode?: string | null) {
  const normalizedCity = normalize(city);
  const normalizedState = normalize(state);
  const knownKey = Object.keys(KNOWN_COORDS).find((key) => normalizedCity.includes(key) || normalize(seed).includes(key));
  const base =
    (knownKey && KNOWN_COORDS[knownKey]) ||
    (normalizedState.includes("mexico") ? DEFAULT_CENTER : normalizedState.includes("oaxaca") ? KNOWN_COORDS.oaxaca : DEFAULT_CENTER);
  const postalNudge = postalCode ? Number(String(postalCode).replace(/\D/g, "").slice(-2) || 0) / 10000 : 0;
  return {
    lon: base.lon + hashOffset(`${seed}:lon`, 0.18) + postalNudge,
    lat: base.lat + hashOffset(`${seed}:lat`, 0.13) - postalNudge / 2,
  };
}

function isLocalCoordinate(coordinate: { lon: number; lat: number }) {
  return (
    coordinate.lon >= LOCAL_BOUNDS.minLon &&
    coordinate.lon <= LOCAL_BOUNDS.maxLon &&
    coordinate.lat >= LOCAL_BOUNDS.minLat &&
    coordinate.lat <= LOCAL_BOUNDS.maxLat
  );
}

function dbCoordinate(latitude?: number | string | null, longitude?: number | string | null) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (!isLocalCoordinate({ lon, lat })) return null;
  return { lat, lon, geocoded: true };
}

async function geocodeAddress(query: string, fallback: { lon: number; lat: number }, signal?: AbortSignal) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return { ...fallback, geocoded: false };
  if (geocodeCache.has(normalizedQuery)) {
    const cached = geocodeCache.get(normalizedQuery);
    return cached ? { ...cached, geocoded: true } : { ...fallback, geocoded: false };
  }

  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      q: query,
      countrycodes: "mx",
      viewbox: `${LOCAL_BOUNDS.minLon},${LOCAL_BOUNDS.maxLat},${LOCAL_BOUNDS.maxLon},${LOCAL_BOUNDS.minLat}`,
      bounded: "1",
      limit: "1",
      addressdetails: "1",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, { signal });
    if (!response.ok) throw new Error("No se pudo geocodificar la direccion");
    const rows = (await response.json()) as Array<{ lon: string; lat: string }>;
    const first = rows[0];
    if (!first) {
      geocodeCache.set(normalizedQuery, null);
      return { ...fallback, geocoded: false };
    }
    const coordinates = { lon: Number(first.lon), lat: Number(first.lat) };
    if (!isLocalCoordinate(coordinates)) {
      geocodeCache.set(normalizedQuery, null);
      return { ...fallback, geocoded: false };
    }
    geocodeCache.set(normalizedQuery, coordinates);
    return { ...coordinates, geocoded: true };
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    return { ...fallback, geocoded: false };
  }
}

async function resolveStops(depot: Stop, stops: Stop[], signal?: AbortSignal) {
  const allStops = [depot, ...stops];
  const resolved: Stop[] = [];
  for (const stop of allStops) {
    if (stop.geocoded) {
      resolved.push(stop);
      continue;
    }
    const coordinates = await geocodeAddress(stop.query, { lon: stop.lon, lat: stop.lat }, signal);
    resolved.push({ ...stop, ...coordinates });
  }
  return { depot: resolved[0], stops: resolved.slice(1) };
}

async function fetchRoadRoute(route: Stop[], signal?: AbortSignal) {
  if (route.length < 2) return null;
  if (!route.every((stop) => isLocalCoordinate({ lon: stop.lon, lat: stop.lat }))) return null;
  const coordinates = route.map((stop) => `${stop.lon.toFixed(6)},${stop.lat.toFixed(6)}`).join(";");
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "false",
  });
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?${params.toString()}`, { signal });
  if (!response.ok) throw new Error("No se pudo calcular la ruta vial");
  const data = (await response.json()) as {
    routes?: Array<{ distance: number; geometry?: { coordinates?: [number, number][] } }>;
  };
  const routeData = data.routes?.[0];
  const coordinatesList = routeData?.geometry?.coordinates || [];
  if (!routeData || coordinatesList.length === 0) return null;
  return {
    coordinates: coordinatesList,
    distanceKm: routeData.distance / 1000,
  };
}

function distanceKm(a: Stop, b: Stop) {
  const earthKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(h));
}

function distanceCoords(a: [number, number], b: [number, number]) {
  const stopA = { lon: a[0], lat: a[1] } as Stop;
  const stopB = { lon: b[0], lat: b[1] } as Stop;
  return distanceKm(stopA, stopB);
}

function interpolateCoordinate(coordinates: [number, number][], distanceTargetKm: number) {
  if (coordinates.length === 0) return null;
  if (coordinates.length === 1 || distanceTargetKm <= 0) return coordinates[0];

  let travelled = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1];
    const current = coordinates[index];
    const segmentKm = distanceCoords(previous, current);
    if (travelled + segmentKm >= distanceTargetKm) {
      const ratio = segmentKm === 0 ? 0 : (distanceTargetKm - travelled) / segmentKm;
      return [
        previous[0] + (current[0] - previous[0]) * ratio,
        previous[1] + (current[1] - previous[1]) * ratio,
      ] as [number, number];
    }
    travelled += segmentKm;
  }
  return coordinates[coordinates.length - 1];
}

function splitRouteCoordinates(coordinates: [number, number][], distanceTargetKm: number) {
  if (coordinates.length === 0) return { completed: [] as [number, number][], pending: [] as [number, number][] };
  const current = interpolateCoordinate(coordinates, distanceTargetKm) || coordinates[0];
  if (coordinates.length === 1) return { completed: [current], pending: [current] };
  if (distanceTargetKm <= 0) return { completed: [coordinates[0]], pending: coordinates };

  let travelled = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1];
    const point = coordinates[index];
    const segmentKm = distanceCoords(previous, point);
    if (travelled + segmentKm >= distanceTargetKm) {
      return {
        completed: [...coordinates.slice(0, index), current],
        pending: [current, ...coordinates.slice(index)],
      };
    }
    travelled += segmentKm;
  }
  return { completed: coordinates, pending: [coordinates[coordinates.length - 1]] };
}

function nearestStopDistanceKm(coordinate: [number, number] | null, stop: Stop) {
  if (!coordinate) return Infinity;
  return distanceCoords(coordinate, [stop.lon, stop.lat]);
}

function routeDistance(route: Stop[]) {
  return route.slice(1).reduce((sum, stop, index) => sum + distanceKm(route[index], stop), 0);
}

function nearestNeighbor(depot: Stop, stops: Stop[]) {
  const pending = [...stops];
  const route = [depot];
  while (pending.length) {
    const current = route[route.length - 1];
    let bestIndex = 0;
    let bestDistance = Infinity;
    pending.forEach((candidate, index) => {
      const distance = distanceKm(current, candidate);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    route.push(pending.splice(bestIndex, 1)[0]);
  }
  route.push(depot);
  return route;
}

function twoOpt(route: Stop[]) {
  let best = route;
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 2; i += 1) {
      for (let k = i + 1; k < best.length - 1; k += 1) {
        const candidate = [...best.slice(0, i), ...best.slice(i, k + 1).reverse(), ...best.slice(k + 1)];
        if (routeDistance(candidate) + 0.01 < routeDistance(best)) {
          best = candidate;
          improved = true;
        }
      }
    }
  }
  return best;
}

function makeMarker(label: string, kind: Stop["kind"]) {
  const color = kind === "depot" ? "#0f7a54" : kind === "pickup" ? "#d47827" : "#d83b32";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="54" viewBox="0 0 42 54">
    <path d="M21 52C17 44 5 34 5 21 5 12 12 5 21 5s16 7 16 16c0 13-12 23-16 31z" fill="${color}" stroke="#7b1714" stroke-width="2"/>
    <circle cx="21" cy="21" r="13" fill="#f7d4cd"/>
    <text x="21" y="25" text-anchor="middle" font-family="Arial" font-size="13" font-weight="800" fill="#111">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeGpsVehicle() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="58" height="42" viewBox="0 0 58 42">
    <path d="M14 14h27l7 9h4c2 0 4 2 4 4v5H3v-6c0-2 2-4 4-4h3l4-8z" fill="#2458d8" stroke="#13317c" stroke-width="2"/>
    <path d="M17 17h10v6H14l3-6zm13 0h10l5 6H30v-6z" fill="#dfe8ff"/>
    <circle cx="17" cy="33" r="5" fill="#101815"/>
    <circle cx="44" cy="33" r="5" fill="#101815"/>
    <circle cx="17" cy="33" r="2" fill="#fff"/>
    <circle cx="44" cy="33" r="2" fill="#fff"/>
    <circle cx="49" cy="8" r="4" fill="#5A6A42"/>
    <path d="M49 1v4m0 6v4m-7-7h4m6 0h4" stroke="#5A6A42" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function productSummary(stop: Stop) {
  const names = Array.from(new Set(stop.productNames || [])).filter(Boolean);
  if (names.length === 0) return stop.address;
  return names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`;
}

function buildStops(props: RouteOptimizationMapProps) {
  const products = props.products || [];
  const producers = props.producers || [];
  const cart = props.cart || [];
  const orders = (props.orders || []).filter((order) => ["paid", "shipped", "delivered"].includes(order.status));
  const depot: Stop = {
    id: "depot",
    label: "San Felipe del Progreso Centro",
    kind: "depot",
    address: "Centro, San Felipe del Progreso, Estado de Mexico",
    query: "Centro, San Felipe del Progreso, Estado de Mexico, Mexico",
    demand: 0,
    ...SAN_FELIPE_CENTER,
    geocoded: true,
  };

  const producerById = new Map(producers.map((producer) => [producer.id, producer]));
  const cooperativeById = new Map((props.cooperatives || []).map((cooperative) => [cooperative.id, cooperative]));
  const stops = new Map<string, Stop>();
  const addStop = (stop: Stop) => {
    const existing = stops.get(stop.id);
    if (!existing) {
      stops.set(stop.id, stop);
      return;
    }
    stops.set(stop.id, {
      ...existing,
      demand: existing.demand + stop.demand,
      productNames: Array.from(new Set([...(existing.productNames || []), ...(stop.productNames || [])])),
    });
  };

  if (props.mode === "customer") {
    cart.forEach((item) => {
      const producer = producerById.get(item.product.producerId);
      const cooperative = cooperativeById.get(item.product.cooperativeId || producer?.cooperative_id || "");
      const municipality = cooperative?.municipality || "San Felipe del Progreso";
      const coord =
        dbCoordinate(item.product.latitude, item.product.longitude) ||
        dbCoordinate(producer?.latitude, producer?.longitude);
      const fallbackCoord = coord || resolveCoord(`${item.product.community}-${municipality}-${item.product.producerName}`, municipality, "Estado de Mexico");
      addStop({
        id: `pickup:${item.product.id}`,
        label: item.product.producerName,
        kind: "pickup",
        address: item.product.pickupAddress || producer?.address || `${item.product.community}, ${municipality} · ${item.product.name}`,
        query: item.product.pickupAddress || producer?.address || `${item.product.community}, ${municipality}, Estado de Mexico, Mexico`,
        demand: item.quantity,
        productNames: [item.product.name],
        ...fallbackCoord,
      });
    });
    if (props.shippingForm?.address || props.shippingForm?.city) {
      const coord = resolveCoord(
        `${props.shippingForm.address} ${props.shippingForm.city} ${props.shippingForm.postalCode}`,
        props.shippingForm.city,
        props.shippingForm.state,
        props.shippingForm.postalCode,
      );
      addStop({
        id: "delivery:preview",
        label: props.shippingForm.name || "Tu domicilio",
        kind: "delivery",
        address: [props.shippingForm.address, props.shippingForm.city, props.shippingForm.state, props.shippingForm.postalCode].filter(Boolean).join(", "),
        query: [props.shippingForm.address, props.shippingForm.city, props.shippingForm.state, props.shippingForm.postalCode, "Mexico"].filter(Boolean).join(", "),
        demand: cart.reduce((sum, item) => sum + item.quantity, 0),
        productNames: cart.map((item) => item.product.name),
        ...coord,
      });
    }
  } else {
    orders.forEach((order) => {
      const items = order.order_items || [];
      items.forEach((item) => {
        const product = item.product || products.find((candidate) => candidate.id === item.product_id);
        if (!product) return;
        const producer = producerById.get(product.producerId);
        const cooperative = cooperativeById.get(product.cooperativeId || producer?.cooperative_id || "");
        const municipality = cooperative?.municipality || "San Felipe del Progreso";
        const isProducerProduct =
          props.mode !== "producer" ||
          product.producerId === props.profile?.id ||
          normalize(product.producerName) === normalize(props.profile?.full_name);
        if (!isProducerProduct) return;
        const coord =
          dbCoordinate(product.latitude, product.longitude) ||
          dbCoordinate(producer?.latitude, producer?.longitude);
        const fallbackCoord = coord || resolveCoord(`${product.community}-${municipality}-${product.producerName}`, municipality, "Estado de Mexico");
        addStop({
          id: `pickup:${product.id}`,
          label: product.producerName,
          kind: "pickup",
          address: product.pickupAddress || producer?.address || `${product.community}, ${municipality} · ${product.name}`,
          query: product.pickupAddress || producer?.address || `${product.community}, ${municipality}, Estado de Mexico, Mexico`,
          demand: item.quantity,
          productNames: [product.name],
          ...fallbackCoord,
        });
      });
      if (!order.shipping_address && !order.shipping_city) return;
      const coord =
        dbCoordinate(order.shipping_latitude, order.shipping_longitude) ||
        resolveCoord(
          `${order.shipping_address} ${order.shipping_city} ${order.shipping_postal_code}`,
          order.shipping_city,
          order.shipping_state,
          order.shipping_postal_code,
        );
      const shippingState = normalize(order.shipping_state).includes("mex") ? "Estado de Mexico" : order.shipping_state;
      addStop({
        id: `delivery:${order.id}`,
        label: order.customer_name || order.customer_email || "Cliente",
        kind: "delivery",
        address: [order.shipping_address, order.shipping_city, order.shipping_state, order.shipping_postal_code].filter(Boolean).join(", "),
        query: [order.shipping_address, order.shipping_city, shippingState, order.shipping_postal_code, "Mexico"].filter(Boolean).join(", "),
        demand: items.reduce((sum, item) => sum + item.quantity, 0),
        orderId: order.id,
        productNames: items.map((item) => item.product_name),
        ...coord,
      });
    });
  }

  return { depot, stops: Array.from(stops.values()) };
}

export default function RouteOptimizationMap(props: RouteOptimizationMapProps) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<OlMap | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const rawPlan = useMemo(() => buildStops(props), [props.mode, props.profile, props.products, props.producers, props.orders, props.shippingForm, props.cart, props.cooperatives]);
  const [resolvedPlan, setResolvedPlan] = useState(rawPlan);
  const [roadRoute, setRoadRoute] = useState<{ coordinates: [number, number][]; distanceKm: number } | null>(null);
  const [routeStatus, setRouteStatus] = useState("Mapa real de OpenStreetMap con ruta vial cuando hay direcciones.");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [speedKmh, setSpeedKmh] = useState(35);
  const [progressKm, setProgressKm] = useState(0);
  const [completedStopIds, setCompletedStopIds] = useState<string[]>([]);
  const [isAtStop, setIsAtStop] = useState(false);
  const [trafficLevel, setTrafficLevel] = useState<"normal" | "moderado" | "alto">("normal");
  const [hasIncident, setHasIncident] = useState(false);
  const [missedStreet, setMissedStreet] = useState(false);
  const [replanSeed, setReplanSeed] = useState(0);
  const { depot, stops } = resolvedPlan;
  const plannedRoute = useMemo(() => (stops.length ? twoOpt(nearestNeighbor(depot, stops)) : [depot]), [depot, stops]);
  const directRoute = useMemo(() => (stops.length ? [depot, ...stops, depot] : [depot]), [depot, stops]);
  const routeCoordinates = useMemo<[number, number][]>(() => (
    roadRoute?.coordinates?.length
      ? roadRoute.coordinates
      : plannedRoute.map((stop) => [stop.lon, stop.lat] as [number, number])
  ), [plannedRoute, roadRoute]);
  const estimatedKm = routeDistance(plannedRoute);
  const plannedKm = roadRoute?.distanceKm || estimatedKm;
  const directKm = routeDistance(directRoute);
  const savingsKm = Math.max(directKm - plannedKm, 0);
  const load = stops.reduce((sum, stop) => sum + stop.demand, 0);
  const capacityUsed = Math.min(Math.round((load / VEHICLE_CAPACITY) * 100), 100);
  const visibleStops = plannedRoute.slice(1, -1);
  const unresolvedCount = [depot, ...stops].filter((stop) => !stop.geocoded).length;
  const vehicleCoordinate = useMemo(() => interpolateCoordinate(routeCoordinates, progressKm), [progressKm, routeCoordinates]);
  const pendingRouteCoordinates = useMemo(() => splitRouteCoordinates(routeCoordinates, progressKm).pending, [progressKm, routeCoordinates]);
  const progressPercent = plannedKm > 0 ? Math.min(Math.round((progressKm / plannedKm) * 100), 100) : 0;
  const nextPendingStop = visibleStops.find((stop) => !completedStopIds.includes(stop.id)) || null;
  const activeStop = visibleStops.find((stop) => !completedStopIds.includes(stop.id) && nearestStopDistanceKm(vehicleCoordinate, stop) <= 0.45) || null;
  const trafficMultiplier = trafficLevel === "alto" ? 0.45 : trafficLevel === "moderado" ? 0.7 : 1;
  const incidentMultiplier = hasIncident ? 0.6 : 1;
  const missedStreetMultiplier = missedStreet ? 0.75 : 1;
  const effectiveSpeedKmh = Math.max(speedKmh * trafficMultiplier * incidentMultiplier * missedStreetMultiplier, 0);

  useEffect(() => {
    setResolvedPlan(rawPlan);
    setRoadRoute(null);
    setIsRunning(false);
    setProgressKm(0);
    setCompletedStopIds([]);
    setIsAtStop(false);
    if (rawPlan.stops.length === 0) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setRouteStatus("Buscando coordenadas reales en OpenStreetMap...");
      resolveStops(rawPlan.depot, rawPlan.stops, controller.signal)
        .then((nextPlan) => {
          if (!controller.signal.aborted) {
            const safePlan = {
              depot: isLocalCoordinate(nextPlan.depot) ? nextPlan.depot : rawPlan.depot,
              stops: nextPlan.stops.map((stop, index) => (isLocalCoordinate(stop) ? stop : rawPlan.stops[index] || stop)),
            };
            setResolvedPlan(safePlan);
            const fallbackCount = [safePlan.depot, ...safePlan.stops].filter((stop) => !stop.geocoded).length;
            setRouteStatus(
              fallbackCount > 0
                ? "Algunas direcciones no se encontraron exactas; se usó el punto municipal más cercano."
                : "Direcciones ubicadas con OpenStreetMap.",
            );
          }
        })
        .catch((error) => {
          if ((error as Error).name !== "AbortError") {
            setRouteStatus("No se pudo consultar geocodificacion; usando puntos locales de respaldo.");
          }
        });
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [rawPlan]);

  useEffect(() => {
    setIsRunning(false);
    setProgressKm(0);
    setCompletedStopIds([]);
    setIsAtStop(false);
  }, [plannedRoute.length, roadRoute?.distanceKm]);

  useEffect(() => {
    setIsAtStop(Boolean(activeStop));
    if (activeStop) setIsRunning(false);
  }, [activeStop?.id]);

  useEffect(() => {
    if (plannedRoute.length < 2) return;
    setIsRunning(false);
    setReplanSeed((value) => value + 1);
    setRouteStatus("Ruta recalculada automáticamente por cambio operativo.");
  }, [completedStopIds.length, hasIncident, missedStreet, trafficLevel]);

  useEffect(() => {
    if (!mapRef.current) return;
    window.setTimeout(() => mapRef.current?.updateSize(), 80);
  }, [isExpanded]);

  useEffect(() => {
    if (!isRunning || plannedKm <= 0) return;
    let last = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const deltaHours = (now - last) / 1000 / 3600;
      last = now;
      setProgressKm((current) => {
        const next = Math.min(current + effectiveSpeedKmh * deltaHours, plannedKm);
        if (next >= plannedKm) window.setTimeout(() => setIsRunning(false), 0);
        return next;
      });
    }, 500);
    return () => window.clearInterval(interval);
  }, [effectiveSpeedKmh, isRunning, plannedKm]);

  useEffect(() => {
    setRoadRoute(null);
    if (plannedRoute.length < 2) return;
    const controller = new AbortController();
    setRouteStatus("Calculando ruta real por calles...");
    fetchRoadRoute(plannedRoute, controller.signal)
      .then((route) => {
        if (controller.signal.aborted) return;
        if (route) {
          setRoadRoute(route);
          setRouteStatus(
            unresolvedCount > 0
              ? "Ruta real por calles; algunas paradas usan ubicación municipal por falta de dirección exacta."
              : "Ruta real por calles calculada con OSRM.",
          );
        } else {
          setRouteStatus("No se obtuvo geometria vial; mostrando conexion directa entre puntos.");
        }
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setRouteStatus("OSRM no respondio; mostrando conexion directa entre puntos.");
        }
      });

    return () => controller.abort();
  }, [plannedRoute, replanSeed, unresolvedCount]);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    const source = new VectorSource();
    vectorSourceRef.current = source;
    mapRef.current = new OlMap({
      target: mapElement.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source }),
      ],
      view: new View({
        center: fromLonLat([DEFAULT_CENTER.lon, DEFAULT_CENTER.lat]),
        zoom: 8,
      }),
      controls: [],
    });

    return () => {
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
      vectorSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const source = vectorSourceRef.current;
    if (!map || !source) return;
    source.clear();

    if (plannedRoute.length > 1) {
      if (pendingRouteCoordinates.length > 1) {
        const pendingFeature = new Feature({
          geometry: new LineString(pendingRouteCoordinates.map(([lon, lat]) => fromLonLat([lon, lat]))),
        });
        pendingFeature.setStyle(
          new Style({
            stroke: new Stroke({ color: roadRoute ? "#2458d8" : "#3d73e6", width: roadRoute ? 6 : 5 }),
          }),
        );
        source.addFeature(pendingFeature);
      }
    }

    plannedRoute.forEach((stop, index) => {
      const isReturnDepot = index === plannedRoute.length - 1 && stop.kind === "depot";
      if (isReturnDepot) return;
      const marker = new Feature({ geometry: new Point(fromLonLat([stop.lon, stop.lat])) });
      marker.setStyle(
        new Style({
          image: new Icon({
            src: makeMarker(stop.kind === "depot" ? "C" : String(index), stop.kind),
            anchor: [0.5, 1],
            scale: 0.86,
          }),
          text: stop.kind === "pickup" || stop.kind === "delivery"
            ? new Text({
                text: productSummary(stop),
                offsetY: 14,
                font: "700 11px Plus Jakarta Sans, Arial",
                fill: new Fill({ color: "#101815" }),
                stroke: new Stroke({ color: "#ffffff", width: 4 }),
                overflow: true,
              })
            : undefined,
        }),
      );
      source.addFeature(marker);
    });

    if (plannedRoute.length > 1) {
      const vehicleLon = vehicleCoordinate?.[0] ?? plannedRoute[0].lon;
      const vehicleLat = vehicleCoordinate?.[1] ?? plannedRoute[0].lat;
      const vehicle = new Feature({ geometry: new Point(fromLonLat([vehicleLon, vehicleLat])) });
      vehicle.setStyle(
        new Style({
          image: new Icon({
            src: makeGpsVehicle(),
            anchor: [0.5, 0.5],
            scale: 1,
          }),
          text: new Text({
            text: "Dispositivo GPS",
            offsetY: -34,
            font: "800 11px Plus Jakarta Sans, Arial",
            fill: new Fill({ color: "#2458d8" }),
            stroke: new Stroke({ color: "#ffffff", width: 4 }),
          }),
        }),
      );
      source.addFeature(vehicle);
    }

    if (!isRunning && source.getFeatures().length) {
      const extent = source.getExtent();
      map.getView().fit(extent, { padding: [38, 28, 38, 28], maxZoom: 11, duration: 250 });
    }
  }, [completedStopIds, isRunning, pendingRouteCoordinates, plannedRoute, roadRoute, vehicleCoordinate]);

  const emptyMessage =
    props.mode === "customer"
      ? "Agrega productos al carrito y completa tu domicilio para ver la ruta estimada."
      : "Aún no hay entregas pagadas con domicilio para optimizar.";

  return (
    <section className={`${isExpanded ? "fixed inset-0 z-50 overflow-auto rounded-none p-5" : "rounded-2xl p-4"} border border-[#E6E2DA] bg-white shadow-xs`}>
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#3d73e6]">VRP con mapa real</p>
          <h3 className="mt-1 text-sm font-black text-[#2D2D2A]">
            {props.title || "Optimización de rutas de recolección y entrega"}
          </h3>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#6B665F]">
            OpenStreetMap ubica las paradas y OSRM traza la ruta por calles; el heurístico VRP ordena recolección y entrega.
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#5A6A42]">{routeStatus}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] px-3 py-2">
            <p className="font-mono font-bold text-[#2D2D2A]">{plannedKm.toFixed(1)} km</p>
            <p className="text-[#6B665F]">Ruta</p>
          </div>
          <div className="rounded-xl border border-[#E6E2DA] bg-[#F3F8F1] px-3 py-2">
            <p className="font-mono font-bold text-[#5A6A42]">{savingsKm.toFixed(1)} km</p>
            <p className="text-[#6B665F]">Ahorro</p>
          </div>
          <div className="rounded-xl border border-[#E6E2DA] bg-[#FFF7ED] px-3 py-2">
            <p className="font-mono font-bold text-[#C2845D]">{capacityUsed}%</p>
            <p className="text-[#6B665F]">Carga</p>
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] p-2 text-xs">
        <button
          type="button"
          onClick={() => {
            if (progressKm >= plannedKm) setProgressKm(0);
            setIsAtStop(false);
            setIsRunning((current) => !current);
          }}
          disabled={plannedRoute.length < 2 || plannedKm <= 0 || isAtStop}
          className="rounded-lg bg-[#2458d8] px-3 py-2 text-[10px] font-black uppercase text-white transition hover:bg-[#183f9e] disabled:cursor-not-allowed disabled:bg-[#CFCAC2]"
        >
          {isRunning ? "Pausar recorrido" : progressKm > 0 && progressKm < plannedKm ? "Continuar recorrido" : "Iniciar recorrido"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRunning(false);
            setProgressKm(0);
            setCompletedStopIds([]);
            setIsAtStop(false);
          }}
          disabled={progressKm <= 0}
          className="rounded-lg border border-[#D7D1C7] bg-white px-3 py-2 text-[10px] font-black uppercase text-[#2D2D2A] transition hover:bg-[#EFEDE7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reiniciar
        </button>
        <label className="flex items-center gap-2 rounded-lg border border-[#D7D1C7] bg-white px-3 py-1.5 text-[10px] font-black uppercase text-[#6B665F]">
          Velocidad
          <input
            type="number"
            min="0"
            max="120"
            value={speedKmh}
            onChange={(event) => setSpeedKmh(Math.max(Number(event.target.value || 0), 0))}
            className="w-16 rounded-md border border-[#E6E2DA] px-2 py-1 text-right font-mono text-[#2D2D2A]"
          />
          km/h
        </label>
        <button
          type="button"
          onClick={() => {
            if (!activeStop) return;
            setCompletedStopIds((current) => Array.from(new Set([...current, activeStop.id])));
            setIsAtStop(false);
            setIsRunning(false);
          }}
          disabled={!activeStop}
          className="rounded-lg bg-[#5A6A42] px-3 py-2 text-[10px] font-black uppercase text-white transition hover:bg-[#2D2D2A] disabled:cursor-not-allowed disabled:bg-[#CFCAC2]"
        >
          Realizar parada
        </button>
        <button
          type="button"
          onClick={() => {
            setIsAtStop(false);
            setIsRunning(true);
          }}
          disabled={plannedRoute.length < 2 || plannedKm <= 0 || (Boolean(activeStop) && !completedStopIds.includes(activeStop.id))}
          className="rounded-lg border border-[#D7D1C7] bg-white px-3 py-2 text-[10px] font-black uppercase text-[#2D2D2A] transition hover:bg-[#EFEDE7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar ruta
        </button>
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="ml-auto rounded-lg border border-[#D7D1C7] bg-white px-3 py-2 text-[10px] font-black uppercase text-[#2D2D2A] transition hover:bg-[#EFEDE7]"
        >
          {isExpanded ? "Cerrar pantalla completa" : "Ver mapa grande"}
        </button>
        <div className="h-2 min-w-[160px] flex-1 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-[#2458d8]" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="font-mono text-[10px] font-bold text-[#2D2D2A]">
          {progressKm.toFixed(1)} / {plannedKm.toFixed(1)} km
        </span>
      </div>

      <div className="mb-3 rounded-xl border border-[#E6E2DA] bg-white p-2 text-[10px]">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg bg-[#FAF8F5] px-3 py-2 font-black uppercase text-[#6B665F]">
            Tráfico
            <select
              value={trafficLevel}
              onChange={(event) => setTrafficLevel(event.target.value as typeof trafficLevel)}
              className="rounded-md border border-[#E6E2DA] bg-white px-2 py-1 text-[#2D2D2A]"
            >
              <option value="normal">Normal</option>
              <option value="moderado">Moderado</option>
              <option value="alto">Alto</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-lg bg-[#FAF8F5] px-3 py-2 font-black uppercase text-[#6B665F]">
            <input
              type="checkbox"
              checked={hasIncident}
              onChange={(event) => setHasIncident(event.target.checked)}
              className="h-4 w-4 accent-[#A44A3F]"
            />
            Incidente carretera
          </label>
          <label className="flex items-center gap-2 rounded-lg bg-[#FAF8F5] px-3 py-2 font-black uppercase text-[#6B665F]">
            <input
              type="checkbox"
              checked={missedStreet}
              onChange={(event) => setMissedStreet(event.target.checked)}
              className="h-4 w-4 accent-[#C2845D]"
            />
            Se pasó una calle
          </label>
        </div>
        <p className="mt-2 text-[10px] font-bold text-[#6B665F]">
          Velocidad efectiva: {effectiveSpeedKmh.toFixed(1)} km/h. OSRM calcula geometría vial; tráfico, calle equivocada e incidente ajustan avance y recalculan automáticamente la ruta pendiente.
          {activeStop ? ` Parada activa: ${activeStop.kind === "delivery" ? "entregar" : "recolectar"} ${productSummary(activeStop)}.` : nextPendingStop ? ` Siguiente parada VRP: ${productSummary(nextPendingStop)}.` : ""}
        </p>
      </div>

      <div className={`grid gap-4 ${isExpanded ? "lg:grid-cols-[1fr_340px]" : "lg:grid-cols-[1fr_310px]"}`}>
        <div className={`${isExpanded ? "min-h-[calc(100vh-220px)]" : "min-h-[340px]"} relative overflow-hidden rounded-xl border border-[#D7D1C7] bg-[#E9E6DD]`}>
          <div ref={mapElement} className={`${isExpanded ? "h-[calc(100vh-220px)]" : "h-[340px]"} w-full`} />
          {stops.length > 0 && (
            <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase text-[#2458d8] shadow-sm">
              <svg viewBox="0 0 58 42" className="h-5 w-7" aria-hidden="true">
                <path d="M14 14h27l7 9h4c2 0 4 2 4 4v5H3v-6c0-2 2-4 4-4h3l4-8z" fill="#2458d8" />
                <path d="M17 17h10v6H14l3-6zm13 0h10l5 6H30v-6z" fill="#dfe8ff" />
                <circle cx="17" cy="33" r="5" fill="#101815" />
                <circle cx="44" cy="33" r="5" fill="#101815" />
              </svg>
              Dispositivo GPS
            </div>
          )}
          {stops.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 p-6 text-center text-xs font-bold text-[#6B665F]">
              {emptyMessage}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] p-3 text-xs">
            <p className="font-bold text-[#2D2D2A]">Recursos estimados</p>
            <p className="mt-1 text-[10px] font-bold text-[#2458d8]">
              Salida fija: San Felipe del Progreso Centro
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[#6B665F]">
              <span>Paradas: <b className="text-[#2D2D2A]">{stops.length}</b></span>
              <span>Completadas: <b className="text-[#2D2D2A]">{completedStopIds.length}</b></span>
              <span>Piezas: <b className="text-[#2D2D2A]">{load}</b></span>
              <span>Costo: <b className="text-[#2D2D2A]">${Math.round(plannedKm * COST_PER_KM).toLocaleString("es-MX")}</b></span>
              <span>CO2: <b className="text-[#2D2D2A]">{(plannedKm * CO2_PER_KM).toFixed(1)} kg</b></span>
            </div>
          </div>

          <div className="max-h-[238px] space-y-2 overflow-y-auto pr-1">
            {visibleStops.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#CFCAC2] p-3 text-[11px] text-[#6B665F]">{emptyMessage}</p>
            ) : (
              visibleStops.map((stop, index) => (
                <div
                  key={`${stop.id}-${index}`}
                  className={`rounded-xl border p-3 text-xs ${
                    completedStopIds.includes(stop.id)
                      ? "border-[#D1D5DB] bg-[#F3F4F6] opacity-75"
                      : activeStop?.id === stop.id
                        ? "border-[#5A6A42] bg-[#F3F8F1]"
                        : "border-[#E6E2DA] bg-white"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${stop.kind === "pickup" ? "bg-[#d47827]" : "bg-[#d83b32]"}`}>
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-[#2D2D2A] line-clamp-1">
                        {stop.kind === "pickup" ? "Recolectar" : "Entregar"}: {stop.label}
                      </p>
                      {(stop.productNames || []).length > 0 && (
                        <p className="mt-0.5 text-[10px] font-bold leading-4 text-[#2458d8]">
                          Producto: {Array.from(new Set(stop.productNames || [])).join(", ")}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] leading-4 text-[#6B665F]">{stop.address}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase text-[#8A847C]">Demanda: {stop.demand} pieza(s)</p>
                      {completedStopIds.includes(stop.id) && (
                        <p className="mt-1 text-[9px] font-black uppercase text-[#6B7280]">Parada realizada</p>
                      )}
                      {activeStop?.id === stop.id && !completedStopIds.includes(stop.id) && (
                        <p className="mt-1 text-[9px] font-black uppercase text-[#5A6A42]">Listo para realizar parada</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
