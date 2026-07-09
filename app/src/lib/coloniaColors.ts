// ─── Colores de etiqueta por colonia/coto/torre ───
// Cada colonia recibe siempre el mismo color (hash estable del nombre),
// para que en el panel se identifiquen los pedidos de un vistazo.

export interface ColoniaColor {
  bg: string;
  text: string;
  border: string;
}

const PALETTE: ColoniaColor[] = [
  { bg: '#E8F5E9', text: '#1B5E20', border: '#A5D6A7' }, // verde
  { bg: '#E3F2FD', text: '#0D47A1', border: '#90CAF9' }, // azul
  { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' }, // naranja
  { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8' }, // morado
  { bg: '#FFEBEE', text: '#B71C1C', border: '#EF9A9A' }, // rojo
  { bg: '#E0F7FA', text: '#006064', border: '#80DEEA' }, // cian
  { bg: '#FFF8E1', text: '#B26A00', border: '#FFE082' }, // ámbar
  { bg: '#EFEBE9', text: '#4E342E', border: '#BCAAA4' }, // café
  { bg: '#E8EAF6', text: '#283593', border: '#9FA8DA' }, // índigo
  { bg: '#FCE4EC', text: '#880E4F', border: '#F48FB1' }, // rosa
  { bg: '#F1F8E9', text: '#33691E', border: '#C5E1A5' }, // lima
  { bg: '#ECEFF1', text: '#37474F', border: '#B0BEC5' }, // gris azulado
];

// Hash simple y estable del nombre normalizado
function hashName(name: string): number {
  const n = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return h;
}

export function coloniaColor(name: string): ColoniaColor {
  return PALETTE[hashName(name) % PALETTE.length];
}
