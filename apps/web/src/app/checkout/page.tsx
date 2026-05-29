'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCartStore, selectCartSubtotal } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { authFetch } from '@/lib/auth-fetch';
import { formatCOP } from '@mvh/utils';
import { BoldPaymentButton } from '@/components/bold-payment-button';
import type {
  Address,
  DeliverySlot,
  DeliveryZone,
  BlockedDate,
  ValidateCouponResult,
  Order,
  PublicUser,
  InitiatePaymentResult,
  BoldButtonConfig,
} from '@mvh/types';

// ─── Helpers ───────────────────────────────────────────────────────────────

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function isBlocked(date: string, blocked: BlockedDate[]): boolean {
  return blocked.some((b) => b.date.startsWith(date));
}

const INPUT =
  'w-full border border-primary/20 bg-surface px-4 py-2.5 text-sm focus:outline-none focus:border-primary/60 transition-colors';
const SELECT = `${INPUT} appearance-none`;
const LABEL = 'eyebrow block mb-1.5';
const ERR = 'text-red-500 text-xs mt-1';

// ─── Widget decorativo de Bold ───────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function BoldWidget() {
  const methods = ['Visa', 'Mastercard', 'Amex', 'PSE', 'Nequi'];
  return (
    <div className="text-center space-y-3 border border-primary/10 bg-muted/40 p-5">
      <p className="eyebrow">Paga en línea con Bold</p>
      <p className="font-display text-3xl tracking-tight text-primary leading-none">
        b<span className="text-accent">o</span>ld
      </p>
      <p className="text-xs text-primary/60 leading-relaxed">
        Completa tu pago de forma fácil y segura con tarjeta, PSE o Nequi.
      </p>
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {methods.map((m) => (
          <span
            key={m}
            className="text-[10px] uppercase tracking-wider text-primary/50 border border-primary/15 rounded px-2 py-1"
          >
            {m}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 text-xs text-green-700">
        <LockIcon /> Compra 100% protegida
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  green,
}: {
  label: string;
  value: string;
  bold?: boolean;
  green?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? 'font-semibold text-primary' : 'text-primary/60'}>{label}</span>
      <span
        className={`${bold ? 'font-display text-lg text-primary' : ''} ${green ? 'text-green-700' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Address form ─────────────────────────────────────────────────────────

interface AddressFormData {
  recipientName: string;
  phone: string;
  line1: string;
  neighborhood: string;
  notes: string;
  city: string;
}

const EMPTY_ADDRESS: AddressFormData = {
  recipientName: '',
  phone: '',
  line1: '',
  neighborhood: '',
  notes: '',
  city: 'Barranquilla',
};

function AddressFields({
  value,
  onChange,
  errors,
}: {
  value: AddressFormData;
  onChange: (v: AddressFormData) => void;
  errors: Record<string, string>;
}) {
  const f =
    (k: keyof AddressFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...value, [k]: e.target.value });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Nombre del destinatario</label>
          <input type="text" value={value.recipientName} onChange={f('recipientName')} className={INPUT} placeholder="María García" />
          {errors.recipientName && <p className={ERR}>{errors.recipientName}</p>}
        </div>
        <div>
          <label className={LABEL}>Teléfono</label>
          <input type="tel" value={value.phone} onChange={f('phone')} className={INPUT} placeholder="+57 300 123 4567" />
          {errors.phone && <p className={ERR}>{errors.phone}</p>}
        </div>
      </div>
      <div>
        <label className={LABEL}>Dirección</label>
        <input type="text" value={value.line1} onChange={f('line1')} className={INPUT} placeholder="Cra 43 # 76-12, Apto 301" />
        {errors.line1 && <p className={ERR}>{errors.line1}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Barrio <span className="text-primary/40">(opcional)</span></label>
          <input type="text" value={value.neighborhood} onChange={f('neighborhood')} className={INPUT} placeholder="El Prado" />
        </div>
        <div>
          <label className={LABEL}>Ciudad</label>
          <input type="text" value={value.city} onChange={f('city')} className={INPUT} />
        </div>
      </div>
      <div>
        <label className={LABEL}>Notas de entrega <span className="text-primary/40">(opcional)</span></label>
        <input type="text" value={value.notes} onChange={f('notes')} className={INPUT} placeholder="Dejar con portería, timbre 3…" />
      </div>
    </div>
  );
}

// ─── Step 1: Entrega ─────────────────────────────────────────────────────────

function Step1({
  user,
  guestEmail, setGuestEmail,
  guestFirstName, setGuestFirstName,
  guestLastName, setGuestLastName,
  guestPhone, setGuestPhone,
  savedAddresses,
  addressMode, setAddressMode,
  selectedAddressId, setSelectedAddressId,
  addressForm, setAddressForm,
  slots, zones, blockedDates,
  deliveryDate, setDeliveryDate,
  deliverySlotId, setDeliverySlotId,
  deliveryZoneId, setDeliveryZoneId,
  errors,
}: {
  user: PublicUser | null;
  guestEmail: string; setGuestEmail: (v: string) => void;
  guestFirstName: string; setGuestFirstName: (v: string) => void;
  guestLastName: string; setGuestLastName: (v: string) => void;
  guestPhone: string; setGuestPhone: (v: string) => void;
  savedAddresses: Address[];
  addressMode: 'saved' | 'new'; setAddressMode: (v: 'saved' | 'new') => void;
  selectedAddressId: string; setSelectedAddressId: (v: string) => void;
  addressForm: AddressFormData; setAddressForm: (v: AddressFormData) => void;
  slots: DeliverySlot[];
  zones: DeliveryZone[];
  blockedDates: BlockedDate[];
  deliveryDate: string; setDeliveryDate: (v: string) => void;
  deliverySlotId: string; setDeliverySlotId: (v: string) => void;
  deliveryZoneId: string; setDeliveryZoneId: (v: string) => void;
  errors: Record<string, string>;
}) {
  const hasSavedAddresses = savedAddresses.length > 0;
  const showAddressForm = !user || addressMode === 'new' || !hasSavedAddresses;

  return (
    <div className="space-y-8">
      {/* Guest info */}
      {!user && (
        <section>
          <h2 className="font-display text-xl text-primary mb-4">Tus datos</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Nombre</label>
                <input type="text" value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} className={INPUT} placeholder="María" />
                {errors.guestFirstName && <p className={ERR}>{errors.guestFirstName}</p>}
              </div>
              <div>
                <label className={LABEL}>Apellido <span className="text-primary/40">(opcional)</span></label>
                <input type="text" value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} className={INPUT} placeholder="García" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Correo</label>
                <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={INPUT} placeholder="tu@email.com" />
                {errors.guestEmail && <p className={ERR}>{errors.guestEmail}</p>}
              </div>
              <div>
                <label className={LABEL}>Teléfono <span className="text-primary/40">(opcional)</span></label>
                <input type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className={INPUT} placeholder="+57 300 123 4567" />
              </div>
            </div>
            <p className="text-xs text-primary/50">
              ¿Tienes cuenta?{' '}
              <Link href="/auth/login?callbackUrl=%2Fcheckout" className="text-accent hover:underline">
                Inicia sesión
              </Link>{' '}
              para autocompletar tus datos.
            </p>
          </div>
        </section>
      )}

      {/* Address */}
      <section>
        <h2 className="font-display text-xl text-primary mb-4">Dirección de entrega</h2>

        {user && hasSavedAddresses && (
          <div className="mb-4 space-y-2">
            {savedAddresses.map((addr) => (
              <label key={addr.id} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={addressMode === 'saved' && selectedAddressId === addr.id}
                  onChange={() => { setAddressMode('saved'); setSelectedAddressId(addr.id); }}
                  className="mt-0.5"
                />
                <div className="text-sm">
                  <span className="font-semibold text-primary">{addr.recipientName}</span>
                  {addr.label && <span className="text-primary/50 ml-2">({addr.label})</span>}
                  <p className="text-primary/60">{addr.line1}{addr.neighborhood ? `, ${addr.neighborhood}` : ''}, {addr.city}</p>
                </div>
              </label>
            ))}
            <label className="flex items-center gap-3 cursor-pointer mt-3">
              <input
                type="radio"
                name="address"
                checked={addressMode === 'new'}
                onChange={() => setAddressMode('new')}
              />
              <span className="text-sm text-accent">+ Usar dirección diferente</span>
            </label>
          </div>
        )}

        {showAddressForm && (
          <AddressFields value={addressForm} onChange={setAddressForm} errors={errors} />
        )}

        {errors.address && <p className={ERR}>{errors.address}</p>}
      </section>

      {/* Delivery date & slot */}
      <section>
        <h2 className="font-display text-xl text-primary mb-4">Fecha y horario</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Fecha de entrega</label>
            <input
              type="date"
              min={getTomorrow()}
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className={INPUT}
            />
            {errors.deliveryDate && <p className={ERR}>{errors.deliveryDate}</p>}
            {deliveryDate && isBlocked(deliveryDate, blockedDates) && (
              <p className={ERR}>Esta fecha no está disponible. Por favor elige otra.</p>
            )}
          </div>

          <div>
            <label className={LABEL}>Franja horaria</label>
            <select
              value={deliverySlotId}
              onChange={(e) => setDeliverySlotId(e.target.value)}
              className={SELECT}
            >
              <option value="">Selecciona un horario</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({s.startTime}–{s.endTime})
                </option>
              ))}
            </select>
            {errors.deliverySlotId && <p className={ERR}>{errors.deliverySlotId}</p>}
          </div>
        </div>
      </section>

      {/* Delivery zone */}
      <section>
        <h2 className="font-display text-xl text-primary mb-2">Zona de entrega</h2>
        <p className="text-xs text-primary/50 mb-3">El costo de envío varía según tu zona.</p>
        <div className="space-y-2">
          {zones.map((z) => (
            <label key={z.id} className="flex items-center justify-between gap-3 cursor-pointer border border-primary/10 px-4 py-3 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="zone"
                  value={z.id}
                  checked={deliveryZoneId === z.id}
                  onChange={() => setDeliveryZoneId(z.id)}
                />
                <div>
                  <span className="text-sm font-semibold text-primary">{z.name}</span>
                  {z.description && <p className="text-xs text-primary/50">{z.description}</p>}
                </div>
              </div>
              <span className="text-sm font-semibold text-primary flex-shrink-0">{formatCOP(z.fee)}</span>
            </label>
          ))}
        </div>
        {errors.deliveryZoneId && <p className={ERR}>{errors.deliveryZoneId}</p>}
      </section>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const user = useAuthStore((s) => s.user);

  const [isPreparing, setIsPreparing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [payConfig, setPayConfig] = useState<BoldButtonConfig | null>(null);

  // Step 1 — guest info
  const [guestEmail, setGuestEmail] = useState('');
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Step 1 — address
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('saved');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressForm, setAddressForm] = useState<AddressFormData>(EMPTY_ADDRESS);

  // Step 1 — delivery
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliverySlotId, setDeliverySlotId] = useState('');
  const [deliveryZoneId, setDeliveryZoneId] = useState('');

  // Step 2 — coupon + note
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResult | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [customerNote, setCustomerNote] = useState('');

  // Validation errors
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Queries
  const { data: slots = [] } = useQuery({
    queryKey: ['delivery-slots'],
    queryFn: () => apiFetch<DeliverySlot[]>('/delivery/slots'),
  });
  const { data: zones = [] } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => apiFetch<DeliveryZone[]>('/delivery/zones'),
  });
  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked-dates'],
    queryFn: () => apiFetch<BlockedDate[]>('/delivery/blocked-dates'),
  });
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: () => authFetch<Address[]>('/addresses'),
    enabled: !!user,
    select: (data) => {
      // Auto-select default address on first load
      return data;
    },
  });

  // Computed totals
  const selectedZone = zones.find((z) => z.id === deliveryZoneId);
  const deliveryFee = selectedZone?.fee ?? 0;
  const discount = appliedCoupon?.discount ?? 0;
  const total = subtotal - discount + deliveryFee;

  // Si cambia cualquier dato que afecte el pedido, invalida el botón ya generado
  // para no pagar un monto/datos desactualizados.
  const formSignature = useMemo(
    () =>
      JSON.stringify({
        items: items.map((i) => [i.productId, i.variantId, i.quantity]),
        guestEmail, guestFirstName, guestLastName, guestPhone,
        addressMode, selectedAddressId, addressForm,
        deliveryDate, deliverySlotId, deliveryZoneId,
        coupon: appliedCoupon?.coupon.code ?? null,
        customerNote,
      }),
    [
      items, guestEmail, guestFirstName, guestLastName, guestPhone,
      addressMode, selectedAddressId, addressForm,
      deliveryDate, deliverySlotId, deliveryZoneId, appliedCoupon, customerNote,
    ],
  );
  useEffect(() => {
    setPayConfig(null);
  }, [formSignature]);

  // Step 1 validation
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!deliveryDate) errs.deliveryDate = 'Selecciona una fecha';
    else if (isBlocked(deliveryDate, blockedDates)) errs.deliveryDate = 'Fecha no disponible';
    if (!deliverySlotId) errs.deliverySlotId = 'Selecciona un horario';
    if (!deliveryZoneId) errs.deliveryZoneId = 'Selecciona tu zona';

    if (!user) {
      if (!guestFirstName.trim()) errs.guestFirstName = 'Requerido';
      if (!guestEmail.trim()) errs.guestEmail = 'Requerido';
    }

    const usingNewAddress = !user || addressMode === 'new' || !savedAddresses.length;
    if (usingNewAddress) {
      if (!addressForm.recipientName.trim()) errs.recipientName = 'Requerido';
      if (!addressForm.phone.trim()) errs.phone = 'Requerido';
      if (!addressForm.line1.trim()) errs.line1 = 'Requerido';
    } else if (!selectedAddressId) {
      errs.address = 'Selecciona una dirección';
    }

    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  // Coupon validation
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const result = await apiFetch<ValidateCouponResult>('/coupons/validate', {
        method: 'POST',
        body: { code: couponCode.trim().toUpperCase(), subtotal },
      });
      setAppliedCoupon(result);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof ApiClientError ? err.message : 'Error al validar cupón');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Prepara el pago: crea el pedido (PENDING) y obtiene la config del botón de Bold.
  const handlePreparePayment = async () => {
    if (!validateStep1()) return;
    setIsPreparing(true);
    setSubmitError('');
    try {
      const usingNewAddress = !user || addressMode === 'new' || !savedAddresses.length;

      const orderBody: Record<string, unknown> = {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        deliveryDate,
        deliverySlotId,
        deliveryZoneId: deliveryZoneId || undefined,
        couponCode: appliedCoupon?.coupon.code,
        customerNote: customerNote.trim() || undefined,
      };

      if (usingNewAddress) {
        orderBody.address = {
          recipientName: addressForm.recipientName,
          phone: addressForm.phone,
          line1: addressForm.line1,
          neighborhood: addressForm.neighborhood || undefined,
          notes: addressForm.notes || undefined,
          city: addressForm.city || 'Barranquilla',
        };
      } else {
        orderBody.addressId = selectedAddressId;
      }

      if (!user) {
        orderBody.guestEmail = guestEmail;
        orderBody.guestFirstName = guestFirstName;
        orderBody.guestLastName = guestLastName || undefined;
        orderBody.guestPhone = guestPhone || undefined;
      }

      const order = await authFetch<Order>('/orders', { method: 'POST', body: orderBody });

      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_SITE_URL ?? '');
      const pay = await authFetch<InitiatePaymentResult>(`/orders/${order.id}/pay`, {
        method: 'POST',
        body: { method: 'BOLD_CARD', returnUrl: `${origin}/pedido/${order.id}?status=success` },
      });

      if (pay.bold) {
        setPayConfig(pay.bold);
      } else {
        // Métodos sin redirección (p.ej. contraentrega)
        router.push(`/pedido/${order.id}`);
      }
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError ? err.message : 'Error al procesar tu pedido. Intenta de nuevo.',
      );
    } finally {
      setIsPreparing(false);
    }
  };

  // Empty cart guard
  if (items.length === 0) {
    return (
      <div data-th-section="checkout" className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-accent text-4xl mb-4">✦</div>
        <h1 className="font-display text-3xl text-primary mb-3">Tu carrito está vacío</h1>
        <p className="text-primary/60 mb-8">Agrega productos antes de proceder al pago.</p>
        <Link href="/" className="btn-primary">Explorar catálogo</Link>
      </div>
    );
  }

  return (
    <div data-th-section="checkout" className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl text-primary mb-8">Finalizar compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-8">
          <Step1
            user={user}
            guestEmail={guestEmail} setGuestEmail={setGuestEmail}
            guestFirstName={guestFirstName} setGuestFirstName={setGuestFirstName}
            guestLastName={guestLastName} setGuestLastName={setGuestLastName}
            guestPhone={guestPhone} setGuestPhone={setGuestPhone}
            savedAddresses={savedAddresses}
            addressMode={addressMode} setAddressMode={setAddressMode}
            selectedAddressId={selectedAddressId} setSelectedAddressId={setSelectedAddressId}
            addressForm={addressForm} setAddressForm={setAddressForm}
            slots={slots}
            zones={zones}
            blockedDates={blockedDates}
            deliveryDate={deliveryDate} setDeliveryDate={setDeliveryDate}
            deliverySlotId={deliverySlotId} setDeliverySlotId={setDeliverySlotId}
            deliveryZoneId={deliveryZoneId} setDeliveryZoneId={setDeliveryZoneId}
            errors={step1Errors}
          />

          {/* Nota / dedicatoria */}
          <section>
            <label className="font-display text-xl text-primary block mb-3">
              Nota para el pedido <span className="text-sm text-primary/40 font-sans">(opcional)</span>
            </label>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Dedicatoria, instrucciones especiales de entrega, etc."
              className="w-full border border-primary/20 bg-surface px-4 py-2.5 text-sm focus:outline-none focus:border-primary/60 transition-colors resize-none"
            />
          </section>
        </div>

        {/* Resumen + pago */}
        <div className="lg:sticky lg:top-4 h-fit space-y-6">
          {/* Resumen del pedido */}
          <div className="bg-muted/50 border border-primary/10 p-6">
            <h3 className="font-display text-xl text-primary mb-4">Tu pedido</h3>
            <ul className="space-y-3 mb-4">
              {items.map((i) => (
                <li
                  key={`${i.productId}::${i.variantId ?? ''}`}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-primary">
                    {i.name}
                    {i.variantName && <span className="text-primary/50"> · {i.variantName}</span>}
                    <span className="text-primary/50"> × {i.quantity}</span>
                  </span>
                  <span className="text-primary font-semibold flex-shrink-0">
                    {formatCOP(i.unitPrice * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-primary/10 pt-3 space-y-2">
              <Row label="Subtotal" value={formatCOP(subtotal)} />
              {discount > 0 && (
                <Row
                  label={`Cupón (${appliedCoupon?.coupon.code})`}
                  value={`− ${formatCOP(discount)}`}
                  green
                />
              )}
              <Row
                label="Envío"
                value={
                  deliveryZoneId
                    ? deliveryFee > 0
                      ? formatCOP(deliveryFee)
                      : 'Gratis'
                    : '—'
                }
              />
              <div className="border-t border-primary/10 pt-2">
                <Row label="Total" value={formatCOP(total)} bold />
              </div>
            </div>

            {/* Cupón de descuento */}
            <div className="mt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2">
                  <span className="text-xs font-semibold text-green-800">
                    {appliedCoupon.coupon.code}
                  </span>
                  <button
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                    }}
                    className="text-xs text-green-700 underline hover:text-green-900"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Cupón de descuento"
                    className={`${INPUT} flex-1`}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                  />
                  <button
                    onClick={handleValidateCoupon}
                    disabled={!couponCode.trim() || isValidatingCoupon}
                    className="btn-outline px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {isValidatingCoupon ? '…' : 'Aplicar'}
                  </button>
                </div>
              )}
              {couponError && <p className={ERR}>{couponError}</p>}
            </div>
          </div>

          {/* Pago */}
          <div className="border border-primary/10 p-6 space-y-4">
            <BoldWidget />

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {submitError}
              </div>
            )}

            {payConfig ? (
              <div className="space-y-2">
                <BoldPaymentButton config={payConfig} />
                <p className="text-xs text-center text-primary/50">
                  Haz clic en el botón de Bold para completar tu pago.
                </p>
              </div>
            ) : (
              <button
                onClick={handlePreparePayment}
                disabled={isPreparing}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPreparing ? 'Preparando pago…' : `Pagar ${formatCOP(total)}`}
              </button>
            )}

            <p className="text-xs text-primary/50 leading-relaxed">
              Tus datos personales se utilizarán para procesar tu pedido y mejorar tu experiencia,
              según nuestra{' '}
              <Link href="/privacidad" className="text-accent hover:underline">
                política de privacidad
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
