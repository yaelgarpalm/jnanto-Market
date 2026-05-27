import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config({ path: ".env.local" });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan credenciales VITE_SUPABASE_URL o SUPABASE_SECRET_KEY en el entorno.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function sha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

async function runSeed() {
  console.log("🌱 Iniciando inserción de datos semilla...");

  // 1. Limpiar datos existentes en tablas principales (opcional, para evitar duplicados)
  console.log("Cleaning database...");
  await supabase.from("inventory_movements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("resource_reservations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("shared_resources").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("blockchain_anchors").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("traceability_stages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("product_images").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("producers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("cooperatives").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("community_fund_movements").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 2. Insertar Cooperativas
  console.log("Inserting cooperatives...");
  const cooperatives = [
    {
      id: "coop-1",
      name: "Mujeres Bordadoras del Norte",
      municipality: "San Felipe del Progreso",
      community: "San Pedro el Alto",
      representative: "María Juana Hernández",
      phone: "7121234567",
      latitude: 19.7269,
      longitude: -99.9724,
      gps_device_name: "Dispositivo GPS Coop Norte"
    },
    {
      id: "coop-2",
      name: "Artesanos del Centro Mazahua",
      municipality: "Ixtlahuaca",
      community: "San Andrés del Pedregal",
      representative: "Juana Gómez Ruiz",
      phone: "7129876543",
      latitude: 19.5858,
      longitude: -99.7747,
      gps_device_name: "Dispositivo GPS Coop Centro"
    },
    {
      id: "coop-3",
      name: "Alfareros Unidos de San Felipe",
      municipality: "San Felipe del Progreso",
      community: "San Francisco Tepeolulco",
      representative: "Pedro Mateo",
      phone: "7124567890",
      latitude: 19.795,
      longitude: -99.9618,
      gps_device_name: "Dispositivo GPS Coop Alfareros"
    }
  ];
  await supabase.from("cooperatives").insert(cooperatives);

  // 3. Insertar Productores
  console.log("Inserting producers...");
  const producers = [
    {
      id: "prod-1",
      name: "María Juana Hernández",
      community: "San Pedro el Alto",
      cooperative_id: "coop-1",
      description: "Artesana especialista en bordado hilvanado tradicional y telar de cintura.",
      verified: true,
      address: "San Pedro el Alto, San Felipe del Progreso, Estado de Mexico",
      latitude: 19.7281,
      longitude: -99.9741
    },
    {
      id: "prod-2",
      name: "Juana Gómez Ruiz",
      community: "San Andrés del Pedregal",
      cooperative_id: "coop-2",
      description: "Tejedora tradicional experta en lana cruda teñida con plantas locales y fajas tradicionales.",
      verified: true,
      address: "San Andrés del Pedregal, Ixtlahuaca, Estado de Mexico",
      latitude: 19.5872,
      longitude: -99.7785
    },
    {
      id: "prod-3",
      name: "Pedro Mateo",
      community: "San Francisco Tepeolulco",
      cooperative_id: "coop-3",
      description: "Maestro alfarero especializado en floreros y platos de barro bruñido con piedra de río.",
      verified: true,
      address: "San Francisco Tepeolulco, San Felipe del Progreso, Estado de Mexico",
      latitude: 19.7932,
      longitude: -99.9631
    }
  ];
  await supabase.from("producers").insert(producers);

  // 4. Insertar Productos
  console.log("Inserting products...");
  const products = [
    {
      id: "prod-item-1",
      name: "Blusa Bordada Jñatjo Elegante",
      description: "Blusa de manta fina tradicional con bordados florales y geométricos coloridos en hilo de algodón. Elaboración 100% a mano con iconografía ancestral de la flora mazahua.",
      category: "Textiles bordados",
      price: 850,
      materials: "Manta de algodon, Hilo de algodon teñido natural",
      craft_hours: 45,
      producer_id: "prod-1",
      producer_name: "María Juana Hernández",
      community: "San Pedro el Alto",
      cooperative_id: "coop-1",
      cooperative_name: "Mujeres Bordadoras del Norte",
      image: "https://images.unsplash.com/photo-1594235412907-9cce44531af8?auto=format&fit=crop&q=80&w=900",
      pickup_address: "Taller de María Juana Hernández, San Pedro el Alto, San Felipe del Progreso",
      latitude: 19.7281,
      longitude: -99.9741,
      stock: 5,
      status: "verified",
      trace_code: "JNATJO-BLUSA-001",
      qr_payload: "http://localhost:3000/trazabilidad/JNATJO-BLUSA-001",
      nfc_payload: "http://localhost:3000/trazabilidad/JNATJO-BLUSA-001",
      materials_cost: 120,
      labor_cost: 560,
      community_fund: 85,
      platform_commission: 85,
      breakdown: { materialsCost: 120, laborCost: 560, communityFund: 85, platformCommission: 85 },
      fair_trade_badges: ["Pago justo", "Elaboración artesanal", "Trazabilidad QR"]
    },
    {
      id: "prod-item-2",
      name: "Muñeca Mazahua Tradicional (Lele)",
      description: "Muñeca tradicional vestida con el traje de gala de la mujer mazahua: falda plisada de satín brilloso, mandil bordado, cintas multicolor entrelazadas en sus trenzas y collar típico.",
      category: "Munecas tradicionales",
      price: 450,
      materials: "Satin, Hilos acrilicos, Liston de colores, Relleno sintetico",
      craft_hours: 12,
      producer_id: "prod-2",
      producer_name: "Juana Gómez Ruiz",
      community: "San Andrés del Pedregal",
      cooperative_id: "coop-2",
      cooperative_name: "Artesanos del Centro Mazahua",
      image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=900",
      pickup_address: "Taller de Juana Gómez Ruiz, San Andrés del Pedregal, Ixtlahuaca",
      latitude: 19.5872,
      longitude: -99.7785,
      stock: 8,
      status: "verified",
      trace_code: "JNATJO-MUNECA-002",
      qr_payload: "http://localhost:3000/trazabilidad/JNATJO-MUNECA-002",
      nfc_payload: "http://localhost:3000/trazabilidad/JNATJO-MUNECA-002",
      materials_cost: 70,
      labor_cost: 290,
      community_fund: 45,
      platform_commission: 45,
      breakdown: { materialsCost: 70, laborCost: 290, communityFund: 45, platformCommission: 45 },
      fair_trade_badges: ["Pago justo", "Origen verificado", "Elaboración manual"]
    },
    {
      id: "prod-item-3",
      name: "Florero de Barro Bruñido Negro",
      description: "Florero ornamental modelado a mano en arcilla roja local y bruñido meticulosamente con piedra de río para obtener un brillo metálico negro tras una cocción a baja temperatura.",
      category: "Alfareria",
      price: 680,
      materials: "Arcilla roja local, Piedra de rio, Humo de encino",
      craft_hours: 28,
      producer_id: "prod-3",
      producer_name: "Pedro Mateo",
      community: "San Francisco Tepeolulco",
      cooperative_id: "coop-3",
      cooperative_name: "Alfareros Unidos de San Felipe",
      image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&q=80&w=900",
      pickup_address: "Taller de Pedro Mateo, San Francisco Tepeolulco, San Felipe del Progreso",
      latitude: 19.7932,
      longitude: -99.9631,
      stock: 3,
      status: "verified",
      trace_code: "JNATJO-BARRO-003",
      qr_payload: "http://localhost:3000/trazabilidad/JNATJO-BARRO-003",
      nfc_payload: "http://localhost:3000/trazabilidad/JNATJO-BARRO-003",
      materials_cost: 90,
      labor_cost: 454,
      community_fund: 68,
      platform_commission: 68,
      breakdown: { materialsCost: 90, laborCost: 454, communityFund: 68, platformCommission: 68 },
      fair_trade_badges: ["Pago justo al productor", "Materiales orgánicos", "Trazabilidad QR"]
    }
  ];
  await supabase.from("products").insert(products);

  // 5. Inserción de etapas de trazabilidad
  console.log("Inserting traceability stages...");
  for (const item of products) {
    const hash0 = "0000000000000000000000000000000000000000000000000000000000000000";
    const hash1 = sha256({
      productId: item.id,
      stageKey: "registration",
      description: `${item.producer_name} inició la confección y registró la pieza para validación.`,
      payload: { traceCode: item.trace_code },
      hashPrevious: hash0,
      at: new Date().toISOString()
    });

    const hash2 = sha256({
      productId: item.id,
      stageKey: "validation",
      description: `La cooperativa ${item.cooperative_name} validó el origen tradicional, las horas de mano de obra y el precio de comercio justo.`,
      payload: { cooperativeId: item.cooperative_id },
      hashPrevious: hash1,
      at: new Date().toISOString()
    });

    await supabase.from("traceability_stages").insert([
      {
        id: `${item.id}-registration-${Date.now()}`,
        product_id: item.id,
        stage_key: "registration",
        stage_label: "Producto registrado",
        description: `${item.producer_name} inició la confección y registró la pieza para validación.`,
        date: new Date().toISOString().slice(0, 10),
        responsible: item.producer_name,
        hash_previous: hash0,
        hash_actual: hash1,
        payload: { traceCode: item.trace_code }
      },
      {
        id: `${item.id}-validation-${Date.now() + 1}`,
        product_id: item.id,
        stage_key: "validation",
        stage_label: "Origen validado por cooperativa",
        description: `La cooperativa ${item.cooperative_name} validó el origen tradicional, las horas de mano de obra y el precio de comercio justo.`,
        date: new Date().toISOString().slice(0, 10),
        responsible: item.cooperative_name,
        hash_previous: hash1,
        hash_actual: hash2,
        payload: { cooperativeId: item.cooperative_id }
      }
    ]);
  }

  // 6. Insertar Recursos compartidos e historial de inventario
  console.log("Inserting shared resources...");
  const resources = [
    {
      id: "res-1",
      name: "Hilo de algodón rojo",
      type: "insumo",
      description: "Madejas de hilo teñidas artesanalmente con grana cochinilla para los bordados de la cooperativa.",
      quantity: 150,
      unit: "madejas",
      cooperative_id: "coop-1",
      rental_cost: 0,
      status: "available",
      available_shared: true,
      low_stock_threshold: 20
    },
    {
      id: "res-2",
      name: "Telar de cintura de pino",
      type: "maquinaria",
      description: "Telar tradicional de madera de pino curada. Disponible para artesanos que no cuenten con herramientas propias.",
      quantity: 3,
      unit: "unidades",
      cooperative_id: "coop-1",
      rental_cost: 15,
      status: "available",
      available_shared: true,
      low_stock_threshold: 1
    },
    {
      id: "res-3",
      name: "Máquina de coser Singer",
      type: "maquinaria",
      description: "Máquina de coser semi-industrial para refuerzos de dobladillos y costuras complejas.",
      quantity: 2,
      unit: "unidades",
      cooperative_id: "coop-2",
      rental_cost: 25,
      status: "available",
      available_shared: true,
      low_stock_threshold: 1
    }
  ];
  await supabase.from("shared_resources").insert(resources);

  // Registrar movimientos iniciales
  console.log("Inserting inventory movements...");
  for (const r of resources) {
    await supabase.from("inventory_movements").insert({
      resource_id: r.id,
      type: "in",
      quantity: r.quantity,
      notes: "Stock inicial para hackathon/prototipo."
    });
  }

  // 7. Insertar Fondos comunitarios iniciales
  console.log("Inserting community fund movement...");
  await supabase.from("community_fund_movements").insert({
    type: "income",
    amount: 1500,
    description: "Fondo inicial de arranque para apoyo a cooperativas",
    responsible: "Fondo Estatal de Cooperativas"
  });

  console.log("🎉 ¡Datos semilla insertados con éxito!");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("💥 Error ejecutando el seed:", err);
  process.exit(1);
});
