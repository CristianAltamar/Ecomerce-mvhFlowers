'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/api-client';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function ContactForm() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState({ nombre: '', correo: '', asunto: '', mensaje: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.nombre.trim()) e.nombre = 'Requerido';
    if (!form.correo.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.correo = 'Correo inválido';
    if (!form.asunto.trim()) e.asunto = 'Requerido';
    if (form.mensaje.trim().length < 10) e.mensaje = 'Mínimo 10 caracteres';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStatus('sending');
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('sent');
        setForm({ nombre: '', correo: '', asunto: '', mensaje: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    },
  });

  return (
    <div className="text-center p-8 border border-primary/10 bg-surface">
      <div className="text-accent text-3xl mb-4">✦</div>
      <h2 className="font-display text-xl text-primary mb-3">Email</h2>

      {!open ? (
        <>
          <p className="text-sm text-primary/70 mb-4">mvhflowersshop@gmail.com</p>
          <button
            onClick={() => setOpen(true)}
            className="text-xs uppercase tracking-widest border border-primary/30 px-5 py-2 text-primary hover:bg-primary hover:text-surface transition-colors"
          >
            Enviar mensaje
          </button>
        </>
      ) : status === 'sent' ? (
        <div className="py-4">
          <p className="text-accent font-display text-lg mb-2">¡Mensaje enviado!</p>
          <p className="text-sm text-primary/60 mb-4">Te respondemos pronto.</p>
          <button
            onClick={() => { setStatus('idle'); setOpen(false); }}
            className="text-xs text-primary/50 hover:text-primary underline"
          >
            Cerrar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-left" noValidate>
          {/* Nombre */}
          <div>
            <input
              type="text"
              placeholder="Tu nombre"
              className={`w-full border px-3 py-2 text-sm text-primary bg-transparent outline-none focus:border-primary transition-colors ${errors.nombre ? 'border-red-400' : 'border-primary/20'}`}
              {...field('nombre')}
            />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          {/* Correo */}
          <div>
            <input
              type="email"
              placeholder="Tu correo"
              className={`w-full border px-3 py-2 text-sm text-primary bg-transparent outline-none focus:border-primary transition-colors ${errors.correo ? 'border-red-400' : 'border-primary/20'}`}
              {...field('correo')}
            />
            {errors.correo && <p className="text-xs text-red-500 mt-1">{errors.correo}</p>}
          </div>

          {/* Asunto */}
          <div>
            <input
              type="text"
              placeholder="Asunto"
              className={`w-full border px-3 py-2 text-sm text-primary bg-transparent outline-none focus:border-primary transition-colors ${errors.asunto ? 'border-red-400' : 'border-primary/20'}`}
              {...field('asunto')}
            />
            {errors.asunto && <p className="text-xs text-red-500 mt-1">{errors.asunto}</p>}
          </div>

          {/* Mensaje */}
          <div>
            <textarea
              rows={4}
              placeholder="Tu mensaje…"
              className={`w-full border px-3 py-2 text-sm text-primary bg-transparent outline-none focus:border-primary transition-colors resize-none ${errors.mensaje ? 'border-red-400' : 'border-primary/20'}`}
              {...field('mensaje')}
            />
            {errors.mensaje && <p className="text-xs text-red-500 mt-1">{errors.mensaje}</p>}
          </div>

          {status === 'error' && (
            <p className="text-xs text-red-500">Hubo un error. Intenta de nuevo o escríbenos directamente.</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex-1 bg-primary text-surface text-xs uppercase tracking-widest py-2.5 hover:bg-ink transition-colors disabled:opacity-50"
            >
              {status === 'sending' ? 'Enviando…' : 'Enviar'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setStatus('idle'); setErrors({}); }}
              className="text-xs text-primary/40 hover:text-primary transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
