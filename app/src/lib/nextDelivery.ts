// ─── Próxima entrega (jueves) y corte (miércoles 7 pm) ───
// Espejo de backend/src/config/zones.ts para mostrar el dato en el panel.
export interface NextDelivery {
  dateLabel: string;   // ej. "jueves, 16 de julio"
  cutoffLabel: string; // ej. "miércoles, 15 de julio a las 7:00 pm"
}

export function nextDeliveryInfo(base: Date = new Date()): NextDelivery {
  const mx = new Date(base.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  const day = mx.getDay(); // 0=dom, 3=mié, 4=jue

  let daysUntilThu = (4 - day + 7) % 7;
  if (daysUntilThu === 0) daysUntilThu = 7;               // hoy es jueves → siguiente jueves
  if (day === 3 && mx.getHours() >= 19) daysUntilThu = 8; // mié después de las 7 pm → otra semana

  const delivery = new Date(mx);
  delivery.setDate(mx.getDate() + daysUntilThu);
  const cutoff = new Date(delivery);
  cutoff.setDate(delivery.getDate() - 1);

  const fmt = (d: Date) => {
    const s = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1); // "Jueves, 16 de julio"
  };

  return {
    dateLabel: fmt(delivery),
    cutoffLabel: `${fmt(cutoff)} a las 7:00 pm`,
  };
}
