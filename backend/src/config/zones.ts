// ─── Zonas de servicio — ZMG (Guadalajara) ───────
// Rutas de reparto con las colonias donde entregamos.
// Para agregar/quitar colonias solo edita este archivo.

export interface DeliveryZone {
  id: string;
  name: string;         // Nombre de la ruta
  days: string[];       // Días de reparto de esta ruta
  slots: string[];      // Horarios disponibles
  colonias: string[];   // Colonias cubiertas
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'norte',
    name: 'Ruta Norte — Zapopan / Andares',
    days: ['lunes', 'jueves'],
    slots: ['9:00 a 13:00', '16:00 a 20:00'],
    colonias: [
      'Puerta de Hierro',
      'Andares',
      'Valle Real',
      'Royal Country',
      'Solares',
      'Virreyes',
      'Puerta Plata',
      'Colinas de San Javier',
      'Lomas del Valle',
      'Cumbres',
      'Seattle',
      'Country Club',
    ],
  },
  {
    id: 'centro',
    name: 'Ruta Centro — Guadalajara Poniente',
    days: ['martes', 'viernes'],
    slots: ['9:00 a 13:00', '16:00 a 20:00'],
    colonias: [
      'Providencia',
      'Monraz',
      'Italia Providencia',
      'Ladrón de Guevara',
      'Americana',
      'Lafayette',
      'Obrera Centro',
      'Arcos Vallarta',
      'Vallarta Norte',
      'Vallarta Poniente',
      'Jardines del Bosque',
      'Moderna',
      'Chapultepec Country',
    ],
  },
  {
    id: 'sur',
    name: 'Ruta Sur — Chapalita / Bugambilias',
    days: ['miércoles', 'sábado'],
    slots: ['9:00 a 13:00', '16:00 a 20:00'],
    colonias: [
      'Chapalita',
      'Jardines de San Ignacio',
      'Ciudad del Sol',
      'La Calma',
      'Las Fuentes',
      'La Estancia',
      'Rinconada Santa Rita',
      'Ciudad Bugambilias',
      'El Palomar',
      'Jardines de La Patria',
      'Paseos del Sol',
      'Residencial Victoria',
    ],
  },
];

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

// Busca la zona a la que pertenece una colonia (tolerante a acentos y texto extra)
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
    `• ${z.name} (entregas ${z.days.join(' y ')}, horarios ${z.slots.join(' o ')}):\n  ${z.colonias.join(', ')}`,
  ).join('\n');
}

// Mensaje amable para clientes fuera de la zona de servicio
export function outOfZoneMessage(colonia?: string): string {
  const intro = colonia
    ? `😔 Lo sentimos, por ahora *no llegamos a ${colonia}*.`
    : '😔 Lo sentimos, por ahora no llegamos a esa zona.';
  const zoneLines = DELIVERY_ZONES.map(
    z => `📍 *${z.name}* (${z.days.join(' y ')}): ${z.colonias.slice(0, 6).join(', ')}…`,
  ).join('\n');
  return `${intro}\n\nEstas son nuestras zonas de reparto en la ZMG:\n${zoneLines}\n\nSi tu colonia está cerca de alguna, escríbenos y lo revisamos 💚`;
}
