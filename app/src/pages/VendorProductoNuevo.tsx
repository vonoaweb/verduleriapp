import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  X,
  Check,
  ChevronDown,
  DollarSign,
  Tag,
  FileText,
  ArrowLeft,
  Apple,
  Leaf,
  Loader2,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { productsApi } from '@/api/products';
import { uploadApi } from '@/api/upload';

/* ─── unit options ─── */
const unitOptions = ['kg', 'unidad', 'libra', 'bandeja', 'manojo'];

/* ─── form state ─── */
interface FormData {
  name: string;
  category: 'FRUIT' | 'VEGETABLE' | '';
  price: string;
  unit: string;
  description: string;
  image: string;
  imageFile: File | null;
  status: 'ACTIVE' | 'INACTIVE';
}

const initialForm: FormData = {
  name: '',
  category: '',
  price: '',
  unit: 'kg',
  description: '',
  image: '',
  imageFile: null,
  status: 'ACTIVE',
};

/* ─── success screen ─── */
function SuccessScreen({ isEdit = false }: { isEdit?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-24 h-24 rounded-full bg-[#52B788] flex items-center justify-center mx-auto mb-6"
        >
          <Check className="w-12 h-12 text-white" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-2xl font-bold text-[#2B3A29] mb-2"
        >
          {isEdit ? '¡Cambios guardados!' : '¡Producto publicado exitosamente!'}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-[#5C6F5A]"
        >
          Redirigiendo a tus productos...
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ─── main component ─── */
export default function VendorProductoNuevo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  // Regresar al panel correcto según el contexto (admin o vendedor)
  const listPath = location.pathname.startsWith('/admin') ? '/admin/productos' : '/vendedor/productos';
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  /* ─── cargar producto en modo edición ─── */
  useEffect(() => {
    if (!id) return;
    productsApi.getById(id)
      .then((p) => {
        setForm({
          name: p.name,
          category: p.category,
          price: String(p.price),
          unit: p.unit,
          description: p.description || '',
          image: p.imageUrl || '',
          imageFile: null,
          status: p.status,
        });
      })
      .catch(() => alert('No se pudo cargar el producto'))
      .finally(() => setLoadingProduct(false));
  }, [id]);

  /* ─── validate ─── */
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.category) e.category = 'Selecciona una categoría';
    if (!form.price || Number(form.price) <= 0) e.price = 'Ingresa un precio válido';
    if (!form.unit) e.unit = 'Selecciona una unidad';
    // En edición, la foto existente sirve; solo se exige al crear.
    if (!isEdit && !form.image) e.image = 'Sube una foto del producto';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [submitting, setSubmitting] = useState(false);

  /* ─── handle submit ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      // 1. Subir imagen solo si se eligió una nueva
      let imageUrl: string | undefined;
      if (form.imageFile) {
        const uploadResult = await uploadApi.image(form.imageFile);
        imageUrl = uploadResult.url;
      }

      const payload = {
        name: form.name.trim(),
        category: form.category as 'FRUIT' | 'VEGETABLE',
        price: Number(form.price),
        unit: form.unit,
        description: form.description.trim() || undefined,
        status: form.status,
        // En edición sin imagen nueva, no se envía imageUrl (se conserva la actual)
        ...(imageUrl ? { imageUrl } : {}),
      };

      if (isEdit && id) {
        await productsApi.update(id, payload);
      } else {
        await productsApi.create(payload);
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate(listPath);
      }, 1500);
    } catch (err: any) {
      alert(err.message || (isEdit ? 'Error al guardar los cambios' : 'Error al crear el producto'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── image helpers ─── */
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Solo se permiten imágenes (JPG, PNG)' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'La imagen no debe superar 5MB' }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({ ...f, image: reader.result as string, imageFile: file }));
      setErrors((prev) => ({ ...prev, image: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) processImageFile(file);
        break;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (unitRef.current && !unitRef.current.contains(e.target as Node)) {
        setUnitOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const removeImage = () => {
    setForm((f) => ({ ...f, image: '' }));
  };

  /* ─── computed preview data ─── */
  const previewName = form.name.trim() || 'Nombre del producto';
  const previewPrice = form.price ? `$${Number(form.price).toLocaleString()}` : '$0';
  const previewUnit = form.unit || 'kg';
  const previewCategory = form.category === 'FRUIT' ? 'Fruta' : form.category === 'VEGETABLE' ? 'Verdura' : '';
  const previewImage = form.image || null;

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AnimatePresence>
        {showSuccess && <SuccessScreen isEdit={isEdit} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <button
          onClick={() => navigate(listPath)}
          className="inline-flex items-center gap-1 text-sm text-[#5C6F5A] hover:text-[#2B3A29] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a productos
        </button>
        <h1 className="font-display text-3xl font-bold text-[#2B3A29]">
          {isEdit ? 'Editar Producto' : 'Subir Nuevo Producto'}
        </h1>
        <p className="text-[#5C6F5A] mt-1">
          {isEdit ? 'Actualiza el precio u otros datos del producto' : 'Completa los datos de tu producto'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* ─── FORM SECTION (60%) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-3"
        >
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 md:p-6 shadow-product space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A29] mb-1.5">
                Nombre del producto <span className="text-[#E63946]">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#95A893]" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Ej: Manzana Roja Premium"
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:ring-[3px] transition-all',
                    errors.name
                      ? 'border-[#E63946] focus:ring-[#E63946]/15'
                      : 'border-[#D9E2D7] focus:border-[#2D6A4F] focus:ring-[#2D6A4F]/15'
                  )}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-[#E63946]">{errors.name}</p>}
            </div>

            {/* Category pills */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A29] mb-2">
                Categoría <span className="text-[#E63946]">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, category: 'FRUIT' }));
                    if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200',
                    form.category === 'FRUIT'
                      ? 'border-[#F4A261] bg-[#FFF3E0] text-[#E65100]'
                      : 'border-[#D9E2D7] bg-white text-[#5C6F5A] hover:border-[#F4A261]/50'
                  )}
                >
                  <Apple className="w-4 h-4" />
                  Fruta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, category: 'VEGETABLE' }));
                    if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200',
                    form.category === 'VEGETABLE'
                      ? 'border-[#52B788] bg-[#E8F5E9] text-[#2E7D32]'
                      : 'border-[#D9E2D7] bg-white text-[#5C6F5A] hover:border-[#52B788]/50'
                  )}
                >
                  <Leaf className="w-4 h-4" />
                  Verdura
                </button>
              </div>
              {errors.category && <p className="mt-1 text-xs text-[#E63946]">{errors.category}</p>}
            </div>

            {/* Price & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2B3A29] mb-1.5">
                  Precio <span className="text-[#E63946]">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#95A893]" />
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, price: e.target.value }));
                      if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
                    }}
                    placeholder="0.00"
                    min="0"
                    step="1"
                    className={cn(
                      'w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:ring-[3px] transition-all',
                      errors.price
                        ? 'border-[#E63946] focus:ring-[#E63946]/15'
                        : 'border-[#D9E2D7] focus:border-[#2D6A4F] focus:ring-[#2D6A4F]/15'
                    )}
                  />
                </div>
                {errors.price && <p className="mt-1 text-xs text-[#E63946]">{errors.price}</p>}
              </div>

              <div ref={unitRef} className="relative">
                <label className="block text-sm font-medium text-[#2B3A29] mb-1.5">
                  Unidad <span className="text-[#E63946]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setUnitOpen(!unitOpen)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm text-[#2B3A29] focus:outline-none focus:ring-[3px] transition-all bg-white',
                    errors.unit
                      ? 'border-[#E63946] focus:ring-[#E63946]/15'
                      : 'border-[#D9E2D7] focus:border-[#2D6A4F] focus:ring-[#2D6A4F]/15'
                  )}
                >
                  <span className={form.unit ? 'text-[#2B3A29]' : 'text-[#95A893]'}>
                    {form.unit || 'Seleccionar'}
                  </span>
                  <ChevronDown className={cn('w-4 h-4 text-[#95A893] transition-transform', unitOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {unitOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#D9E2D7] rounded-xl shadow-lg overflow-hidden"
                    >
                      {unitOptions.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, unit: u }));
                            setUnitOpen(false);
                            if (errors.unit) setErrors((prev) => ({ ...prev, unit: undefined }));
                          }}
                          className={cn(
                            'w-full text-left px-4 py-2.5 text-sm transition-colors',
                            form.unit === u
                              ? 'bg-[#D8F3DC] text-[#2D6A4F] font-medium'
                              : 'text-[#2B3A29] hover:bg-[#F1F3F0]'
                          )}
                        >
                          {u}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                {errors.unit && <p className="mt-1 text-xs text-[#E63946]">{errors.unit}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A29] mb-1.5">
                Descripción
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 w-4 h-4 text-[#95A893]" />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe tu producto: frescura, origen, usos..."
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D9E2D7] text-sm text-[#2B3A29] placeholder:text-[#95A893] focus:outline-none focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 transition-all resize-none"
                />
              </div>
            </div>

            {/* Photo Upload (MOST IMPORTANT) */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A29] mb-2">
                Foto del producto <span className="text-[#E63946]">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewImage ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-xl overflow-hidden border border-[#D9E2D7] w-full max-w-xs"
                >
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
                  >
                    <X className="w-4 h-4 text-[#E63946]" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                    <p className="text-xs text-white font-medium">Imagen seleccionada</p>
                  </div>
                </motion.div>
              ) : (
                <div
                  ref={dropRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'relative cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 hover:border-[#52B788] hover:bg-[#D8F3DC]/30',
                    isDragging
                      ? 'border-[#52B788] bg-[#D8F3DC]/40 scale-[1.02]'
                      : errors.image
                        ? 'border-[#E63946] bg-[#E63946]/5'
                        : 'border-[#D9E2D7] bg-[#F8FAF7]'
                  )}
                >
                  <motion.div
                    animate={isDragging ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-14 h-14 rounded-full bg-[#D8F3DC] flex items-center justify-center mx-auto mb-3"
                  >
                    <Camera className="w-7 h-7 text-[#2D6A4F]" />
                  </motion.div>
                  <p className="text-sm font-medium text-[#2B3A29] mb-1">
                    Arrastra una foto aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-[#95A893]">
                    Formatos: JPG, PNG. Máximo 5MB
                  </p>
                  <p className="text-xs text-[#95A893] mt-1">
                    También puedes pegar desde el portapapeles
                  </p>
                </div>
              )}
              {errors.image && <p className="mt-1 text-xs text-[#E63946]">{errors.image}</p>}
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[#2B3A29]">Estado</p>
                <p className="text-xs text-[#95A893]">
                  {form.status === 'ACTIVE' ? 'Visible en el catálogo' : 'Oculto temporalmente'}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    status: f.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                  }))
                }
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200',
                  form.status === 'ACTIVE' ? 'bg-[#52B788]' : 'bg-[#D9E2D7]'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-sm',
                    form.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#F1F3F0]">
              <button
                type="button"
                onClick={() => navigate(listPath)}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-[#5C6F5A] hover:bg-[#F1F3F0] transition-all border border-transparent hover:border-[#D9E2D7]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1B4332] transition-all duration-200 hover:-translate-y-0.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting
                  ? (isEdit ? 'Guardando...' : 'Publicando...')
                  : (isEdit ? 'Guardar cambios' : 'Publicar Producto')}
              </button>
            </div>
          </form>
        </motion.div>

        {/* ─── PREVIEW SECTION (40%) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="lg:col-span-2"
        >
          <div className="sticky top-6">
            <h2 className="text-sm font-semibold text-[#5C6F5A] mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Vista previa en el catálogo
            </h2>

            {/* Preview Card */}
            <div className="bg-white rounded-2xl border border-[#D9E2D7] shadow-product overflow-hidden max-w-sm">
              {/* Image */}
              <div className="relative aspect-[4/3] bg-[#F1F3F0]">
                {previewImage ? (
                  <motion.img
                    key={previewImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={previewImage}
                    alt={previewName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <Camera className="w-12 h-12 text-[#D9E2D7] mb-2" />
                    <span className="text-xs text-[#95A893]">Sin imagen</span>
                  </div>
                )}
                {previewCategory && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-3 left-3"
                  >
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        form.category === 'FRUIT'
                          ? 'bg-[#FFF3E0] text-[#E65100]'
                          : 'bg-[#E8F5E9] text-[#2E7D32]'
                      )}
                    >
                      {previewCategory}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <motion.h3
                  key={previewName}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  className="font-semibold text-[#2B3A29] text-base mb-1 truncate"
                >
                  {previewName}
                </motion.h3>
                <div className="flex items-baseline gap-1.5 mb-3">
                  <motion.span
                    key={previewPrice}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    className="text-2xl font-bold text-[#E76F51] font-display"
                  >
                    {previewPrice}
                  </motion.span>
                  <span className="text-sm text-[#95A893]">/ {previewUnit}</span>
                </div>
                {form.description && (
                  <p className="text-xs text-[#5C6F5A] mb-3 line-clamp-2">{form.description}</p>
                )}
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 rounded-xl bg-[#2D6A4F] text-white font-semibold text-sm opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Preview tips */}
            <div className="mt-4 p-4 bg-[#D8F3DC]/40 rounded-xl border border-[#D8F3DC]">
              <p className="text-xs font-medium text-[#2D6A4F] mb-1">Consejos</p>
              <ul className="text-xs text-[#5C6F5A] space-y-1">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#52B788] mt-0.5 shrink-0" />
                  Usa fotos claras con buena iluminación
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#52B788] mt-0.5 shrink-0" />
                  Nombres descriptivos ayudan a los clientes
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#52B788] mt-0.5 shrink-0" />
                  Precios competitivos generan más ventas
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
