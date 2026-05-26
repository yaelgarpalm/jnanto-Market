import React from "react";
import {
  Bell,
  Boxes,
  Building2,
  ChevronDown,
  Landmark,
  PackageCheck,
  Palette,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";

type CoreTab = "marketplace" | "purchases" | "producer" | "cooperative" | "inventory" | "fund" | "admin";
type Tab = CoreTab | "account" | "cart";

export interface NavNotification {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
}

interface NavbarProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  visibleTabs: CoreTab[];
  search?: string;
  setSearch?: (value: string) => void;
  cartCount?: number;
  showCart?: boolean;
  showNotifications?: boolean;
  notifications?: NavNotification[];
  onNotificationClick?: (notification: NavNotification) => void;
}

const tabConfig: Record<CoreTab, { label: string; icon: React.ReactNode }> = {
  marketplace: { label: "Tienda", icon: <Store className="h-3.5 w-3.5" /> },
  purchases: { label: "Compras", icon: <PackageCheck className="h-3.5 w-3.5" /> },
  producer: { label: "Productor", icon: <Palette className="h-3.5 w-3.5" /> },
  cooperative: { label: "Cooperativa", icon: <Building2 className="h-3.5 w-3.5" /> },
  inventory: { label: "Inventario", icon: <Boxes className="h-3.5 w-3.5" /> },
  fund: { label: "Fondo", icon: <Landmark className="h-3.5 w-3.5" /> },
  admin: { label: "Admin", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
};

export default function Navbar({
  currentTab,
  onTabChange,
  visibleTabs,
  search = "",
  setSearch,
  cartCount = 0,
  showCart = true,
  showNotifications = true,
  notifications = [],
  onNotificationClick,
}: NavbarProps) {
  const notificationCount = notifications.length;
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const handleNotificationAction = (notification: NavNotification) => {
    onNotificationClick?.(notification);
    setNotificationsOpen(false);
  };
  return (
    <header className="sticky top-0 z-30 bg-white shadow-[0_1px_0_rgba(16,24,20,0.08)]">
      <div className="bg-[#004d32] text-white">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-2 text-[11px] font-semibold sm:px-6">
          <span>+52 712 345 7890</span>
          <span className="hidden sm:inline">10% para el fondo comunitario en cada compra</span>
          <div className="flex items-center gap-4">
            <span>Esp</span>
            <span>MXN</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onTabChange("marketplace")}
            className="flex items-center gap-2 text-left"
            aria-label="Ir a tienda"
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-md border border-black/10 bg-[#f8f8f4]">
              <ShoppingCart className="h-5 w-5 text-[#004d32]" />
              <span className="absolute -right-0.5 top-1 h-2.5 w-2.5 rounded-full bg-[#f3a61f]" />
              <span className="absolute left-2 top-1 h-2.5 w-2.5 rounded-full bg-[#11a652]" />
            </span>
            <span className="text-2xl font-black leading-none tracking-normal text-[#063f2c]">Jnatjo</span>
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            {showNotifications && (
            <div className="group relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#101815] transition hover:border-[#C2845D] hover:text-[#C2845D]"
                aria-label="Notificaciones"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-[#A44A3F] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </button>
              <div className={`absolute right-0 top-full z-40 mt-3 w-72 rounded-xl border border-[#E6E2DA] bg-white p-2 text-xs shadow-[0_18px_45px_rgba(0,0,0,0.14)] transition group-hover:visible group-hover:opacity-100 ${
                notificationsOpen ? "visible opacity-100" : "invisible opacity-0"
              }`}>
                {notificationCount === 0 ? (
                  <p className="px-2 py-2 text-[#6B665F]">Sin pendientes.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNotificationAction(item)}
                        className="w-full rounded-lg border border-[#E6E2DA] bg-[#FAF8F5] p-2 text-left transition hover:border-[#C2845D] hover:bg-white"
                      >
                        <span className="block font-bold text-[#2D2D2A]">{item.title}</span>
                        <span className="mt-0.5 block text-[11px] text-[#6B665F]">{item.body}</span>
                        <span className="mt-1 block text-[10px] font-bold uppercase text-[#C2845D]">{item.actionLabel}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}
            <button
              type="button"
              id="nav-account-mobile"
              onClick={() => onTabChange("account")}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-[#101815] ${
                currentTab === "account" ? "bg-[#eef7f2]" : "bg-white"
              }`}
              aria-label="Cuenta"
            >
              <User className="h-4 w-4" />
            </button>
            {showCart && (
              <button
                type="button"
                id="nav-cart-mobile"
                onClick={() => onTabChange("cart")}
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-[#101815] ${
                  currentTab === "cart" ? "bg-[#eef7f2]" : "bg-white"
                }`}
                aria-label="Carrito"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-[#004d32] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <nav className="flex min-w-0 flex-wrap items-center gap-1.5 lg:flex-1 lg:justify-center">
          {visibleTabs.map((item) => {
            const config = tabConfig[item];
            const isActive = currentTab === item;
            return (
              <button
                key={item}
                id={`nav-tab-${item}`}
                onClick={() => onTabChange(item)}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#eef7f2] text-[#004d32]"
                    : "text-[#101815] hover:bg-[#f5f5f1] hover:text-[#004d32]"
                }`}
              >
                {config.icon}
                {config.label}
                {item === "marketplace" && <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:min-w-[390px] lg:justify-end">
          <label className="relative block sm:w-[260px]">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#101815]" />
            <input
              value={search}
              onChange={(event) => setSearch?.(event.target.value)}
              className="h-11 w-full rounded-full border border-transparent bg-[#f4f5f3] px-5 pr-11 text-sm font-medium text-[#101815] outline-none transition placeholder:text-[#7b827d] focus:border-[#004d32] focus:bg-white"
              placeholder="Buscar producto"
            />
          </label>

          <div className="hidden items-center gap-4 lg:flex">
            {showNotifications && (
            <div className="group relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-[#101815] transition hover:border-[#E6E2DA] hover:bg-[#FAF8F5] hover:text-[#004d32]"
              >
                <Bell className="h-5 w-5" />
                Notificaciones
                {notificationCount > 0 && (
                  <span className="absolute -right-3 -top-2 rounded-full bg-[#A44A3F] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </button>
              <div className={`absolute right-0 top-full z-40 mt-3 w-96 rounded-2xl border border-[#E6E2DA] bg-white p-3 text-xs shadow-[0_18px_45px_rgba(0,0,0,0.14)] transition group-hover:visible group-hover:opacity-100 ${
                notificationsOpen ? "visible opacity-100" : "invisible opacity-0"
              }`}>
                {notificationCount === 0 ? (
                  <p className="rounded-xl bg-[#FAF8F5] px-3 py-3 text-[#6B665F]">Sin notificaciones pendientes.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNotificationAction(item)}
                        className="w-full rounded-xl border border-[#E6E2DA] bg-[#FAF8F5] p-3 text-left transition hover:border-[#C2845D] hover:bg-white"
                      >
                        <span className="block font-serif text-sm font-bold text-[#2D2D2A]">{item.title}</span>
                        <span className="mt-1 block leading-relaxed text-[#6B665F]">{item.body}</span>
                        <span className="mt-2 inline-flex rounded-full bg-[#C2845D]/10 px-2.5 py-1 text-[10px] font-bold uppercase text-[#A44A3F]">
                          {item.actionLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}
            <button
              type="button"
              id="nav-account"
              onClick={() => onTabChange("account")}
              className={`inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-semibold transition hover:text-[#004d32] ${
                currentTab === "account" ? "bg-[#eef7f2] text-[#004d32]" : "text-[#101815]"
              }`}
            >
              <User className="h-5 w-5" />
              Cuenta
            </button>
            {showCart && (
              <button
                type="button"
                id="nav-cart"
                onClick={() => onTabChange("cart")}
                className={`relative inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-semibold transition hover:text-[#004d32] ${
                  currentTab === "cart" ? "bg-[#eef7f2] text-[#004d32]" : "text-[#101815]"
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                Carrito
                {cartCount > 0 && (
                  <span className="absolute -right-3 -top-2 rounded-full bg-[#004d32] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
