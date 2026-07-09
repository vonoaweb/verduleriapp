// ─── Zonas de servicio — Kampo (ZMG) ─────────────
// UNA sola ruta por ahora (pedido del cliente, 8-jul-2026): cotos y torres
// de la zona Puerta de Hierro / Andares. Entrega los JUEVES por la mañana;
// corte de pedidos los miércoles a las 7:00 pm.
// Para agregar/quitar cotos o torres solo edita este archivo.

export interface DeliveryZone {
  id: string;
  name: string;         // Nombre de la ruta
  days: string[];       // Días de reparto de esta ruta
  slots: string[];      // Horarios disponibles
  colonias: string[];   // Cotos / torres / colonias cubiertos
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'ruta1',
    name: 'Ruta 1 — Puerta de Hierro / Andares',
    days: ['jueves'],
    slots: ['9:00 a 13:00 (mañana)'],
    colonias: [
      'Puerta del Bosque',
      'Puerta Aqua',
      'West Point',
      'Villa La Cima',
      'Puerta del Roble',
      'Alcázar Oriente',
      'Alcázar Poniente',
      'Puerta Las Lomas',
      'Bosque de los Lagos',
      'Bosque de las Lomas',
      'Lomas Acueducto',
      'Abadía',
      'Torre Titanium',
      'Legacy',
      'Hyatt',
      'Landmark',
      'Ceiba',
    ],
  },
];

// ─── Próxima entrega (jueves) y corte (miércoles 7 pm) ──
// Regla del cliente: última orden miércoles 7:00 pm → se entrega el jueves.
// Una orden del miércoles 7:01 pm en adelante se va al jueves de la semana siguiente.
export interface NextDelivery {
  dateLabel: string;   // ej. "jueves 9 de julio"
  slot: string;        // ej. "9:00 a 13:00 (mañana)"
  cutoffLabel: string; // ej. "miércoles 8 de julio a las 7:00 pm"
}

export function nextDeliveryInfo(base: Date = new Date()): NextDelivery {
  // Hora actual en Guadalajara
  const mx = new Date(base.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  const day = mx.getDay(); // 0=dom, 3=mié, 4=jue

  let daysUntilThu = (4 - day + 7) % 7;
  if (daysUntilThu === 0) daysUntilThu = 7;           // hoy es jueves → el corte ya pasó, siguiente jueves
  if (day === 3 && mx.getHours() >= 19) daysUntilThu = 8; // miércoles después de las 7 pm → jueves de la otra semana

  const delivery = new Date(mx);
  delivery.setDate(mx.getDate() + daysUntilThu);
  const cutoff = new Date(delivery);
  cutoff.setDate(delivery.getDate() - 1); // miércoles anterior

  const fmt = (d: Date) =>
    d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return {
    dateLabel: fmt(delivery),
    slot: DELIVERY_ZONES[0].slots[0],
    cutoffLabel: `${fmt(cutoff)} a las 7:00 pm`,
  };
}

// Normaliza texto para comparar: minúsculas, sin acentos, sin espacios extra
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Busca la zona a la que pertenece un coto/torre/colonia (tolerante a acentos y texto extra)
export function findZoneByColonia(input: string): { zone: DeliveryZone; colonia: string } | null {
  const text = normalize(input);
  if (!text) return null;
  for (const zone of DELIVERY_ZONES) {
    for (const colonia of zone.colonias) {
      const c = normalize(colonia);
      if (text === c || text.includes(c) || c.includes(text)) {
        return { zone, colonia };
      }
    }
  }
  return null;
}

// Texto con todas las zonas (para el prompt del bot y mensajes de fuera de zona)
export function zonesSummary(): string {
  return DELIVERY_ZONES.map(z =>
    `• ${z.name} (entrega ${z.days.join(' y ')} ${z.slots.join(' o ')}):\n  ${z.colonias.join(', ')}`,
  ).join('\n');
}

// Mensaje amable para clientes fuera de la zona de servicio
export function outOfZoneMessage(colonia?: string): string {
  const intro = colonia
    ? `😔 Lo sentimos, por ahora *no llegamos a ${colonia}*.`
    : '😔 Lo sentimos, por ahora no llegamos a esa zona.';
  const z = DELIVERY_ZONES[0];
  return (
    `${intro}\n\nPor ahora entregamos los *jueves por la mañana* en la zona Puerta de Hierro / Andares:\n` +
    `📍 ${z.colonias.join(', ')}\n\n` +
    `Si tu coto o torre está cerca de alguno, escríbenos y lo revisamos 💚`
  );
}
