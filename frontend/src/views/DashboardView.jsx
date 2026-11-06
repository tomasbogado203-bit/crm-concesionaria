import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CalendarClock,
  Car,
  CircleDollarSign,
  Clock3,
  Gauge,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Warehouse,
  Zap,
} from 'lucide-react';

const formatMoney = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatCompact = (value) =>
  new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const parseDate = (value) => (value ? new Date(value) : null);

const diffDays = (value) => {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
};

export const DashboardView = ({ onNavigate }) => {
  const { usuario } = useAuth();
  const esAdmin = usuario?.perfiles?.includes('ADMIN');

  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState({
    oportunidades: [],
    vehiculos: [],
    testDrives: [],
    tasaciones: [],
    facturas: [],
  });

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setLoading(true);
        const [oportunidades, vehiculos, testDrives, tasaciones, facturas] = await Promise.all([
          apiFetch('/oportunidades').catch(() => []),
          apiFetch('/vehiculos').catch(() => []),
          apiFetch('/test-drives').catch(() => []),
          apiFetch('/tasaciones').catch(() => []),
          apiFetch('/facturas').catch(() => []),
        ]);

        setDatos({ oportunidades, vehiculos, testDrives, tasaciones, facturas });
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, []);

  const resumen = useMemo(() => {
    const oportunidades = datos.oportunidades || [];
    const vehiculos = datos.vehiculos || [];
    const testDrives = datos.testDrives || [];
    const tasaciones = datos.tasaciones || [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthStart = new Date(currentYear, currentMonth, 1);

    const ventasm = oportunidades.filter((op) => {
      if (op.etapa !== 'GANADA') return false;
      const fecha = parseDate(op.createdAt);
      if (!fecha) return false;
      return fecha >= currentMonthStart;
    });

    const ventasMesAnterior = oportunidades.filter((op) => {
      if (op.etapa !== 'GANADA') return false;
      const fecha = parseDate(op.createdAt);
      if (!fecha) return false;
      return fecha >= new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1) && fecha < currentMonthStart;
    });

    const pipelineAbierto = oportunidades.filter((op) => !['GANADA', 'PERDIDA'].includes(op.etapa));
    const oportunidadActivas = oportunidades.filter((op) => !['PERDIDA'].includes(op.etapa));

    const totalVentasMes = ventasm.reduce((sum, op) => sum + Number(op.montoEstimado || 0), 0);
    const totalVentasMesAnterior = ventasMesAnterior.reduce((sum, op) => sum + Number(op.montoEstimado || 0), 0);
    const deltaVentas = totalVentasMesAnterior > 0 ? ((totalVentasMes - totalVentasMesAnterior) / totalVentasMesAnterior) * 100 : 0;

    const pipelineValue = pipelineAbierto.reduce((sum, op) => sum + Number(op.montoEstimado || 0), 0);
    const oportunidadesMes = oportunidades.filter((op) => {
      const fecha = parseDate(op.createdAt);
      return fecha && fecha >= currentMonthStart;
    });
    const conversion = oportunidadesMes.length > 0
      ? (ventasm.length / oportunidadesMes.length) * 100
      : 0;

    const stockDisponible = vehiculos.filter((v) => v.estado === 'DISPONIBLE');
    const stock0km = stockDisponible.filter((v) => v.condicion === 'CERO_KM').length;
    const stockUsados = stockDisponible.filter((v) => v.condicion === 'USADO').length;
    const promedioDiasStock = stockDisponible.length
      ? stockDisponible.reduce((sum, v) => sum + diffDays(v.createdAt), 0) / stockDisponible.length
      : 0;

    const cobranzasPendientes = (datos.facturas || []).filter((f) => {
      const total = Number(f.total || 0);
      const pagos = Array.isArray(f.pagos) ? f.pagos.reduce((sum, p) => sum + Number(p.monto || 0), 0) : 0;
      return total > pagos;
    });

    const facturasPendientes = cobranzasPendientes.reduce((sum, f) => sum + (Number(f.total || 0) - (Array.isArray(f.pagos) ? f.pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0) : 0)), 0);

    const embedding = [
      { key: 'PROSPECTO', label: 'Prospectos', value: oportunidades.filter((op) => op.etapa === 'PROSPECTO').length },
      { key: 'TEST_DRIVE', label: 'Test Drive', value: oportunidades.filter((op) => op.etapa === 'TEST_DRIVE').length },
      { key: 'NEGOCIACION', label: 'Negociación', value: oportunidades.filter((op) => op.etapa === 'NEGOCIACION').length },
      { key: 'RESERVADO', label: 'Reservado', value: oportunidades.filter((op) => op.etapa === 'RESERVADO').length },
      { key: 'GANADA', label: 'Ganadas', value: oportunidades.filter((op) => op.etapa === 'GANADA').length },
    ];

    const rankingVendedores = Object.values(
      oportunidadesActivas.reduce((acc, op) => {
        const nombre = op.usuario?.nombreCompleto || op.usuario?.nombre || `Vendedor ${op.usuarioId || 'Sin asignar'}`;
        if (!acc[nombre]) acc[nombre] = { nombre, valor: 0, cantidad: 0 };
        acc[nombre].valor += Number(op.montoEstimado || 0);
        acc[nombre].cantidad += 1;
        return acc;
      }, {})
    ).sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    const ventasPorMes = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(currentYear, currentMonth - (5 - index), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('es-AR', { month: 'short' });
      const value = oportunidades.filter((op) => {
        if (op.etapa !== 'GANADA') return false;
        const fecha = parseDate(op.createdAt);
        if (!fecha) return false;
        return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}` === key;
      }).reduce((sum, op) => sum + Number(op.montoEstimado || 0), 0);
      return { label, value };
    });

    const turnosUrgentes = (testDrives || []).filter((td) => td.estado === 'PROGRAMADO').slice(0, 4);
    const oportunidadesSinSeguimiento = (oportunidades || []).filter((op) => !['GANADA', 'PERDIDA'].includes(op.etapa) && diffDays(op.updatedAt) > 5).slice(0, 4);
    const tasacionesPendientes = (tasaciones || []).filter((t) => ['SOLICITADA', 'EN_PERITAJE'].includes(t.estado)).slice(0, 4);
    const stockViejo = stockDisponible.filter((v) => diffDays(v.createdAt) > 90).slice(0, 4);

    return {
      ventasMes: totalVentasMes,
      ventasMesAnterior: totalVentasMesAnterior,
      deltaVentas,
      pipelineValue,
      conversion,
      stockDisponible: stockDisponible.length,
      stock0km,
      stockUsados,
      promedioDiasStock,
      facturasPendientes,
      embedding,
      rankingVendedores,
      ventasPorMes,
      turnosUrgentes,
      oportunidadesSinSeguimiento,
      tasacionesPendientes,
      stockViejo,
    };
  }, [datos]);

  const kpis = [
    {
      title: 'Ventas del mes',
      value: formatMoney(resumen.ventasMes),
      delta: `${resumen.deltaVentas >= 0 ? '+' : ''}${resumen.deltaVentas.toFixed(1)}% vs. mes anterior`,
      tone: 'emerald',
      icon: BadgeDollarSign,
    },
    {
      title: 'Pipeline abierto',
      value: formatCompact(resumen.pipelineValue),
      delta: `${resumen.embedding.reduce((acc, item) => acc + item.value, 0)} oportunidades activas`,
      tone: 'blue',
      icon: CircleDollarSign,
    },
    {
      title: 'Tasa de conversión',
      value: `${resumen.conversion.toFixed(1)}%`,
      delta: 'Oportunidades creadas vs. ganadas',
      tone: 'violet',
      icon: TrendingUp,
    },
    {
      title: 'Stock disponible',
      value: `${resumen.stockDisponible} unidades`,
      delta: `${resumen.stock0km} 0KM · ${resumen.stockUsados} usados`,
      tone: 'amber',
      icon: Warehouse,
    },
    {
      title: 'Cobranzas pendientes',
      value: formatMoney(resumen.facturasPendientes),
      delta: `${(datos.facturas || []).length} facturas en cartera`,
      tone: 'rose',
      icon: Gauge,
    },
  ];

  const toneClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-12 w-52 rounded-xl bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
            {esAdmin ? 'Consolidado general' : 'Tu negocio'}
          </p>
          <h1 className="mt-2 text-2xl font-black text-gray-900 tracking-tight">
            ¿Cómo va el negocio hoy?
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen operativo de ventas, stock, seguimiento y tareas prioritarias del día.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start lg:self-auto rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="w-4 h-4" />
          Sesión activa · {usuario?.rol || 'Operador'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {kpis.map(({ title, value, delta, tone, icon: Icon }) => (
          <div key={title} className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
              <span className={`p-2 rounded-xl border ${toneClasses[tone]}`}>
                <Icon className="w-4 h-4" />
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
              <p className="text-[11px] text-gray-500">{delta}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Embudo por etapa</h2>
              <p className="text-[11px] text-gray-500">Estado real del pipeline comercial</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('Ventas y Oportunidades')}
              className="text-[11px] font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1"
            >
              Ver detalle <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {['PROSPECTO', 'TEST_DRIVE', 'NEGOCIACION', 'RESERVADO', 'GANADA'].map((stage) => {
              const item = resumen.embedding.find((el) => el.key === stage);
              const maxValue = Math.max(...resumen.embedding.map((el) => el.value), 1);
              const width = item ? (item.value / maxValue) * 100 : 0;

              return (
                <div key={stage} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>{stage === 'PROSPECTO' ? 'Prospectos' : stage === 'TEST_DRIVE' ? 'Test Drive' : stage === 'NEGOCIACION' ? 'Negociación' : stage === 'RESERVADO' ? 'Reservados' : 'Ganadas'}</span>
                    <span className="font-semibold text-gray-800">{item?.value || 0}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-gray-900 via-slate-700 to-slate-500" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Ranking de vendedores</h2>
              <p className="text-[11px] text-gray-500">Valor en pipeline activo</p>
            </div>
            <Users className="w-4 h-4 text-gray-500" />
          </div>

          <div className="space-y-3">
            {resumen.rankingVendedores.length === 0 ? (
              <p className="text-sm text-gray-500">No hay datos de ventas para esta semana.</p>
            ) : (
              resumen.rankingVendedores.map((v, index) => (
                <div key={`${v.nombre}-${index}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-gray-100 text-xs font-bold text-gray-800">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{v.nombre}</p>
                      <p className="text-[10px] text-gray-500">{v.cantidad} oportunidades</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">{formatMoney(v.valor)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Ventas por mes</h2>
              <p className="text-[11px] text-gray-500">Últimos 6 meses</p>
            </div>
            <BarChart3 className="w-4 h-4 text-gray-500" />
          </div>

          <div className="flex items-end gap-3 h-44">
            {resumen.ventasPorMes.map((item) => {
              const maxValue = Math.max(...resumen.ventasPorMes.map((m) => m.value), 1);
              const height = (item.value / maxValue) * 100;

              return (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex justify-center items-end h-32">
                    <div
                      className="w-full max-w-10 rounded-t-xl bg-gradient-to-t from-zinc-900 via-zinc-700 to-zinc-400"
                      style={{ height: `${Math.max(height, 10)}%` }}
                      title={`${item.label}: ${formatMoney(item.value)}`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 uppercase">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Qué tengo que hacer hoy</h2>
              <p className="text-[11px] text-gray-500">Tareas y pendientes prioritarias</p>
            </div>
            <Clock3 className="w-4 h-4 text-gray-500" />
          </div>

          <div className="space-y-3">
            {resumen.turnosUrgentes.length === 0 && resumen.oportunidadesSinSeguimiento.length === 0 && resumen.tasacionesPendientes.length === 0 && resumen.stockViejo.length === 0 ? (
              <p className="text-sm text-gray-500">No hay tareas críticas en este momento.</p>
            ) : (
              <>
                {resumen.turnosUrgentes.length > 0 && (
                  <button
                    onClick={() => onNavigate && onNavigate('Test Drive')}
                    className="w-full text-left bg-blue-50 border border-blue-100 rounded-xl p-3 hover:bg-blue-100 transition"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Test drives</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {resumen.turnosUrgentes.length} turno(s) programado(s) para hoy o mañana.
                    </p>
                  </button>
                )}

                {resumen.oportunidadesSinSeguimiento.length > 0 && (
                  <button
                    onClick={() => onNavigate && onNavigate('Ventas y Oportunidades')}
                    className="w-full text-left bg-amber-50 border border-amber-100 rounded-xl p-3 hover:bg-amber-100 transition"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Seguimiento</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {resumen.oportunidadesSinSeguimiento.length} oportunidad(es) sin contacto activo por más de 5 días.
                    </p>
                  </button>
                )}

                {resumen.tasacionesPendientes.length > 0 && (
                  <button
                    onClick={() => onNavigate && onNavigate('Tasaciones y Permutas')}
                    className="w-full text-left bg-violet-50 border border-violet-100 rounded-xl p-3 hover:bg-violet-100 transition"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Tasaciones</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {resumen.tasacionesPendientes.length} tasación(es) pendientes de peritaje o resolución.
                    </p>
                  </button>
                )}

                {resumen.stockViejo.length > 0 && (
                  <button
                    onClick={() => onNavigate && onNavigate('Catálogo de Vehículos')}
                    className="w-full text-left bg-rose-50 border border-rose-100 rounded-xl p-3 hover:bg-rose-100 transition"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Stock</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {resumen.stockViejo.length} vehículo(s) con más de 90 días en stock.
                    </p>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Próximos turnos</h2>
          <div className="space-y-3">
            {resumen.turnosUrgentes.length === 0 ? (
              <p className="text-sm text-gray-500">No hay test drives programados.</p>
            ) : (
              resumen.turnosUrgentes.map((td) => (
                <div key={td.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{td.cliente?.nombres || td.cliente?.razonSocial || 'Cliente'}</p>
                    <p className="text-[11px] text-gray-500">{td.vehiculo?.marca || ''} {td.vehiculo?.modelo || ''}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 rounded-full px-2 py-1">
                    {td.fechaHora ? new Date(td.fechaHora).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : 'Sin fecha'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Estados accionables</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 border border-gray-100">
              <span className="text-xs font-medium text-gray-600">Días promedio en stock</span>
              <span className="text-sm font-bold text-gray-900">{Math.round(resumen.promedioDiasStock)} días</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 border border-gray-100">
              <span className="text-xs font-medium text-gray-600">Vehículos nuevos</span>
              <span className="text-sm font-bold text-gray-900">{resumen.stock0km}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 border border-gray-100">
              <span className="text-xs font-medium text-gray-600">Vehículos usados</span>
              <span className="text-sm font-bold text-gray-900">{resumen.stockUsados}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 border border-gray-100">
              <span className="text-xs font-medium text-gray-600">Tasas pendientes</span>
              <span className="text-sm font-bold text-gray-900">{resumen.tasacionesPendientes.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
