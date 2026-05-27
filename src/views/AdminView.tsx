import React, { FormEvent, useState } from "react";
import { Building2, Edit3, Gauge, Lock, Package, Save, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { Cooperative, Order, Product, Profile } from "../types";

interface AdminViewProps {
  profile: Profile | null;
  orders: Order[];
  products: Product[];
  cooperatives: Cooperative[];
  profiles: Profile[];
  sensorForm: any;
  setSensorForm: React.Dispatch<React.SetStateAction<any>>;
  onSensor: (event: FormEvent) => void;
  onAnchor: (productId: string) => void;
  onDeleteProduct: (product: Product) => void;
  onUpdateProduct: (product: Product, input: Record<string, unknown>) => void;
  onDeleteProfile: (profile: Profile) => void;
  onDeleteCooperative: (cooperative: Cooperative) => void;
}

export default function AdminView({
  profile,
  orders,
  products,
  cooperatives,
  profiles,
  sensorForm,
  setSensorForm,
  onSensor,
  onAnchor,
  onDeleteProduct,
  onUpdateProduct,
  onDeleteProfile,
  onDeleteCooperative,
}: AdminViewProps) {
  const isAdmin = Boolean(profile && profile.role === "admin");

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border border-[#E6E2DA] bg-white p-5 shadow-xs space-y-5">
        <div>
          <h2 className="mb-2 text-lg font-serif font-bold text-[#2D2D2A]">Auditoría de Órdenes de Compra</h2>
          <p className="text-xs text-[#6B665F] leading-relaxed">Monitorea el estatus de las órdenes y desgloses de pagos de comercio justo en tiempo real.</p>
        </div>

        {!profile && (
          <p className="rounded-xl bg-[#FFF7ED] border border-[#C2845D]/30 p-3 text-xs text-[#C2845D]">
            Debe iniciar sesión para consultar órdenes de compra.
          </p>
        )}

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {orders.length === 0 ? (
            <p className="text-xs text-[#8A847C] italic">No hay órdenes de compra registradas en el sistema.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] p-3 text-xs flex flex-col justify-between gap-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-[#2D2D2A] block font-mono">Orden #{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    order.status === "paid" ? "bg-emerald-50 text-[#5A6A42]" : "bg-orange-50 text-[#C2845D]"
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-[10px] text-[#6B665F] space-y-0.5">
                  <p>Monto Total: <span className="font-bold text-[#2D2D2A]">${order.subtotal.toLocaleString()} MXN</span></p>
                  <p>Pago al Artesano: <span className="font-bold text-[#5A6A42]">${order.producer_total.toLocaleString()} MXN</span></p>
                  <p>Fondo Comunal: <span className="font-bold text-[#C2845D]">${order.community_fund_total.toLocaleString()} MXN</span></p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-[#E6E2DA]">
          <h3 className="font-serif font-bold text-[#2D2D2A] text-xs mb-2 flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-[#5A6A42]" />
            Anclar Historial en Blockchain
          </h3>
          <p className="text-[11px] text-[#6B665F] mb-3 leading-tight">Haz clic en cualquier producto verificado para anclar criptográficamente su historial en el ledger Amoy.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {products.slice(0, 6).map((product) => (
              <button
                key={product.id}
                onClick={() => onAnchor(product.id)}
                className="flex items-center justify-between rounded-xl border border-[#E6E2DA] bg-white hover:bg-[#FAF8F5] p-3 text-left transition-all cursor-pointer text-xs"
              >
                <span className="font-bold text-[#2D2D2A] line-clamp-1">{product.name}</span>
                <ShieldCheck className="h-4 w-4 text-[#5A6A42] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="pt-3 border-t border-[#E6E2DA]">
            <h3 className="font-serif font-bold text-[#2D2D2A] text-xs mb-3">
              Administración de registros
            </h3>
            <div className="grid gap-3 lg:grid-cols-3">
              <AdminList
                title="Productos"
                icon={<Package className="h-4 w-4 text-[#5A6A42]" />}
                empty="No hay productos activos."
              >
                {products.map((product) => (
                  <AdminRow
                    key={product.id}
                    title={product.name}
                    meta={`${product.status.toUpperCase()} · ${product.stock} en stock`}
                    product={product}
                    onUpdate={onUpdateProduct}
                    onDelete={() => onDeleteProduct(product)}
                  />
                ))}
              </AdminList>

              <AdminList
                title="Clientes y usuarios"
                icon={<Users className="h-4 w-4 text-[#5A6A42]" />}
                empty="No hay usuarios cargados."
              >
                {profiles.map((item) => (
                  <AdminRow
                    key={item.id}
                    title={item.full_name}
                    meta={`${item.role} · ${item.email}`}
                    disabled={item.id === profile?.id}
                    onDelete={() => onDeleteProfile(item)}
                  />
                ))}
              </AdminList>

              <AdminList
                title="Cooperativas"
                icon={<Building2 className="h-4 w-4 text-[#5A6A42]" />}
                empty="No hay cooperativas registradas."
              >
                {cooperatives.map((cooperative) => (
                  <AdminRow
                    key={cooperative.id}
                    title={cooperative.name}
                    meta={`${cooperative.community} · ${cooperative.municipality}`}
                    onDelete={() => onDeleteCooperative(cooperative)}
                  />
                ))}
              </AdminList>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSensor} className="rounded-2xl border border-[#E6E2DA] bg-white p-4 text-xs space-y-2 shadow-xs h-fit">
        <div className="mb-4 flex gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FAF8F5] text-[#5A6A42] border border-[#E6E2DA]/50">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[#2D2D2A]">Lectura de Sensores IoT</h2>
            <p className="text-[10px] text-[#6B665F] font-normal leading-tight">Registra variables ambientales para productos perecederos (miel, quesos).</p>
          </div>
        </div>

        <label className="block font-bold uppercase tracking-wider text-[#6B665F]">
          Producto
          <select
            value={sensorForm.productId}
            onChange={(e) => setSensorForm((p: any) => ({ ...p, productId: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] px-3 py-2 text-xs outline-none focus:border-[#C2845D]"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block font-bold uppercase tracking-wider text-[#6B665F]">
          Tipo de Sensor
          <select
            value={sensorForm.sensorType}
            onChange={(e) => setSensorForm((p: any) => ({ ...p, sensorType: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] px-3 py-2 text-xs outline-none focus:border-[#C2845D]"
          >
            <option value="temperature">Temperatura</option>
            <option value="humidity">Humedad</option>
            <option value="location">Ubicación (GPS)</option>
            <option value="shock">Impacto / Vibración</option>
            <option value="storage_time">Tiempo de almacenamiento</option>
          </select>
        </label>
        <div className="flex gap-2">
          <label className="block flex-1 font-bold uppercase tracking-wider text-[#6B665F]">
            Valor
            <input
              type="number"
              value={sensorForm.value}
              onChange={(e) => setSensorForm((p: any) => ({ ...p, value: Number(e.target.value) }))}
              className="mt-1 w-full rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] px-3 py-2 text-xs outline-none focus:border-[#C2845D]"
            />
          </label>
          <label className="block flex-shrink-0 w-24 font-bold uppercase tracking-wider text-[#6B665F]">
            Unidad
            <input
              value={sensorForm.unit}
              onChange={(e) => setSensorForm((p: any) => ({ ...p, unit: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] px-3 py-2 text-xs outline-none focus:border-[#C2845D]"
              placeholder="Ej. °C, %, gps"
            />
          </label>
        </div>
        <label className="block font-bold uppercase tracking-wider text-[#6B665F]">
          Ubicación de Medida
          <input
            value={sensorForm.location}
            onChange={(e) => setSensorForm((p: any) => ({ ...p, location: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] px-3 py-2 text-xs outline-none focus:border-[#C2845D]"
            placeholder="Ej. Bodega de San Felipe"
          />
        </label>
        <button
          type="submit"
          className="mt-3 w-full rounded-xl bg-[#5A6A42] hover:bg-[#2D2D2A] py-2 text-xs font-bold text-white transition-all cursor-pointer"
        >
          Registrar Telemetría
        </button>
      </form>
    </div>
  );
}

function AdminList({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode;
}) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <div className="rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] p-3">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h4 className="text-xs font-bold text-[#2D2D2A]">{title}</h4>
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {rows.length > 0 ? rows : <p className="text-[11px] italic text-[#8A847C]">{empty}</p>}
      </div>
    </div>
  );
}

function AdminRow({
  title,
  meta,
  product,
  disabled,
  onUpdate,
  onDelete,
}: {
  key?: React.Key;
  title: string;
  meta: string;
  product?: Product;
  disabled?: boolean;
  onUpdate?: (product: Product, input: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: product?.name || "",
    category: product?.category || "",
    price: product?.price ? String(product.price) : "",
    stock: product?.stock !== undefined ? String(product.stock) : "",
    status: product?.status || "pending",
    image: product?.image || "",
    materials: product?.materials?.join(", ") || "",
    description: product?.description || "",
  });

  function saveEdit() {
    if (!product || !onUpdate || !form.name.trim() || !form.category.trim() || Number(form.price) <= 0 || Number(form.stock) < 0) return;
    onUpdate(product, {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      status: form.status as Product["status"],
      image: form.image.trim(),
      materials: form.materials,
      description: form.description.trim(),
    });
    setEditing(false);
  }

  return (
    <div className="rounded-lg border border-[#E6E2DA] bg-white px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-[#2D2D2A]">{title}</p>
          <p className="truncate text-[10px] text-[#6B665F]">{meta}</p>
        </div>
        <div className="flex flex-shrink-0 gap-1">
          {product && onUpdate && (
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              title={editing ? "Cancelar edición" : "Editar"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6E2DA] bg-[#FAF8F5] text-[#5A6A42] transition-colors hover:bg-white cursor-pointer"
            >
              {editing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            title={disabled ? "No puedes eliminar tu propia cuenta" : "Eliminar"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editing && product && (
        <div className="mt-2 grid gap-2 border-t border-[#E6E2DA] pt-2 text-[10px]">
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-lg border border-[#E6E2DA] bg-[#FAF8F5] px-2 py-1.5 outline-none focus:border-[#C2845D]"
            placeholder="Nombre"
          />
          <input
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            className="rounded-lg border border-[#E6E2DA] bg-[#FAF8F5] px-2 py-1.5 outline-none focus:border-[#C2845D]"
            placeholder="Categoría"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="1"
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              className="rounded-lg border border-[#E6E2DA] bg-[#FAF8F5] px-2 py-1.5 outline-none focus:border-[#C2845D]"
              placeholder="Precio"
            />
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
              className="rounded-lg border border-[#E6E2DA] bg-[#FAF8F5] px-2 py-1.5 outline-none focus:border-[#C2845D]"
              placeholder="Stock"
            />
          </div>
          <select
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-lg border border-[#E6E2DA] bg-[#FAF8F5] px-2 py-1.5 outline-none focus:border-[#C2845D]"
          >
            <option value="pending">Pendiente</option>
            <option value="verified">Verificado</option>
            <option value="archived">Archivado</option>
          </select>
          <input
            value={form.materials}
            onChange={(event) => setForm((prev) => ({ ...prev, materials: event.target.value }))}
            className="rounded-lg border border-[#E6E2DA] bg-[#FAF8F5] px-2 py-1.5 outline-none focus:border-[#C2845D]"
            placeholder="Materiales separados por coma"
          />
          <input
            value={form.image}
            onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
            className="rounded-lg border border-[#E6E2DA] bg-[#FAF8F5] px-2 py-1.5 outline-none focus:border-[#C2845D]"
            placeholder="URL de imagen"
          />
          <textarea
            value={form.description}
            rows={2}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="rounded-lg border border-[#E6E2DA] bg-[#FAF8F5] px-2 py-1.5 outline-none focus:border-[#C2845D]"
            placeholder="Descripción"
          />
          <button
            type="button"
            onClick={saveEdit}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#5A6A42] px-3 py-1.5 text-[10px] font-bold uppercase text-white hover:bg-[#2D2D2A] cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            Guardar cambios
          </button>
        </div>
      )}
    </div>
  );
}
