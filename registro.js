    function showToast(msg, type = 'success') {
    document.querySelectorAll('.ff-toast').forEach(t => t.remove());
    const cfg = {
        success: { bg: 'linear-gradient(135deg,#059669,#047857)', icon: '✅' },
        error:   { bg: 'linear-gradient(135deg,#dc2626,#b91c1c)', icon: '❌' },
        warning: { bg: 'linear-gradient(135deg,#d97706,#b45309)', icon: '⚠️' },
        info:    { bg: 'linear-gradient(135deg,#0891b2,#0e7490)', icon: '💬' }
    }[type] || { bg: '#059669', icon: '✅' };

    const el = document.createElement('div');
    el.className = 'ff-toast';
    el.style.cssText = `
        position:fixed;top:20px;right:20px;z-index:99999;
        background:${cfg.bg};color:#fff;
        padding:12px 18px;border-radius:14px;
        font-weight:700;font-size:13px;
        display:flex;align-items:center;gap:10px;
        box-shadow:0 8px 32px rgba(0,0,0,0.45);
        animation:ffToastIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
        max-width:320px;font-family:'DM Sans',sans-serif;
        border:1px solid rgba(255,255,255,0.15);
    `;
    el.innerHTML = `<span style="font-size:18px;flex-shrink:0">${cfg.icon}</span><span>${msg}</span>`;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'all 0.3s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateX(110%)';
        setTimeout(() => el.remove(), 300);
    }, 3200);
}


// HELPERS

function formatCOP(n) {
    return '$' + Number(n).toLocaleString('es-CO');
}

function nextOrderNum() {
    const n = (parseInt(localStorage.getItem('ff_counter') || '0')) + 1;
    localStorage.setItem('ff_counter', n);
    return String(n).padStart(3, '0');
}
// SESIÓN
function getSession()  { return localStorage.getItem('ff_session'); }
function requireAuth() {
    if (!getSession()) { window.location.href = 'index.html'; return false; }
    return true;
}
function logout() {
    localStorage.removeItem('ff_session');
    localStorage.removeItem('ff_counter');
    window.location.href = 'index.html';
}
// MENÚ
const MENU = [
    {
        categoria: "🍔 Hamburguesas",
        items: [
            { n: "Sencilla",        p: 15000 },
            { n: "Doble Carne",     p: 22000 },
            { n: "BBQ Crispy",      p: 24000 },
            { n: "Pollo Crispy",    p: 20000 }
        ]
    },
    {
        categoria: "🍟 Acompañantes",
        items: [
            { n: "Papas Medianas",  p: 8000  },
            { n: "Papas Grandes",   p: 10000 },
            { n: "Nuggets x6",      p: 12000 },
            { n: "Aros de Cebolla", p: 9000  }
        ]
    },
    {
        categoria: "🥤 Bebidas",
        items: [
            { n: "Gaseosa",         p: 5000  },
            { n: "Agua",            p: 3000  },
            { n: "Jugo Natural",    p: 7000  },
            { n: "Malteada",        p: 9000  }
        ]
    },
    {
        categoria: "🍨 Postres",
        items: [
            { n: "Helado Vainilla", p: 6000  },
            { n: "Sundae Choco",    p: 8000  },
            { n: "Brownie",         p: 7000  }
        ]
    }
];
// MESERO — Pedido
let pedido = [];

function renderMenu() {
    const c = document.getElementById('contenedor-menu');
    if (!c) return;
    c.innerHTML = MENU.map(cat => `
        <div class="mb-5">
            <h3 class="text-cyan-500 text-[10px] font-black mb-3 uppercase tracking-widest
                        flex items-center gap-2 border-b border-gray-800 pb-2">
                ${cat.categoria}
            </h3>
            <div class="grid grid-cols-2 gap-2">
                ${cat.items.map(p => `
                    <button onclick="addItem('${p.n.replace(/'/g,"\\'")}', ${p.p})"
                        class="menu-item-btn bg-gray-800 hover:bg-gray-750 active:scale-95
                               p-3 rounded-xl border border-gray-700 hover:border-cyan-600
                               text-left transition-all group relative overflow-hidden">
                        <span class="block font-bold text-xs text-white group-hover:text-cyan-300 transition-colors leading-tight">${p.n}</span>
                        <span class="text-cyan-400 font-black text-sm mt-1 block">${formatCOP(p.p)}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function addItem(nombre, precio) {
    const ex = pedido.find(i => i.nombre === nombre);
    if (ex) { ex.qty++; } else { pedido.push({ id: Date.now() + Math.random(), nombre, precio, qty: 1 }); }
    renderTicket();
    document.querySelectorAll('.menu-item-btn').forEach(btn => {
        if (btn.querySelector('span')?.textContent === nombre) {
            btn.style.borderColor = '#06b6d4';
            btn.style.backgroundColor = '#164e63';
            setTimeout(() => { btn.style.borderColor = ''; btn.style.backgroundColor = ''; }, 400);
        }
    });
}

function removeItem(id) { pedido = pedido.filter(i => i.id !== id); renderTicket(); }

function changeQty(id, d) {
    const item = pedido.find(i => i.id === id);
    if (!item) return;
    item.qty += d;
    if (item.qty <= 0) pedido = pedido.filter(i => i.id !== id);
    renderTicket();
}

function clearOrder() {
    if (pedido.length === 0) return;
    if (confirm('¿Vaciar el pedido actual?')) { pedido = []; renderTicket(); }
}

function renderTicket() {
    const lista   = document.getElementById('lista-seleccionada');
    const totalEl = document.getElementById('total-precio');
    const countEl = document.getElementById('item-count');
    if (!lista) return;

    if (pedido.length === 0) {
        lista.innerHTML = `<div class="text-center py-6">
            <p class="text-4xl mb-2">🧾</p>
            <p class="text-gray-600 text-xs italic">Selecciona productos del menú</p>
        </div>`;
    } else {
        lista.innerHTML = pedido.map(item => `
            <div class="flex items-center gap-2 bg-black/30 p-2.5 rounded-xl border border-gray-800/50">
                <div class="flex-1 min-w-0">
                    <p class="text-white text-xs font-bold truncate leading-tight">${item.nombre}</p>
                    <p class="text-cyan-400 text-xs font-bold mt-0.5">${formatCOP(item.precio * item.qty)}</p>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                    <button onclick="changeQty(${item.id}, -1)"
                        class="w-6 h-6 bg-gray-700 hover:bg-red-800 rounded-lg text-xs font-black
                               flex items-center justify-center transition-colors text-white">−</button>
                    <span class="w-6 text-center text-cyan-300 font-black text-xs">${item.qty}</span>
                    <button onclick="changeQty(${item.id}, 1)"
                        class="w-6 h-6 bg-gray-700 hover:bg-emerald-800 rounded-lg text-xs font-black
                               flex items-center justify-center transition-colors text-white">+</button>
                </div>
            </div>
        `).join('');
    }

    const total      = pedido.reduce((a, c) => a + c.precio * c.qty, 0);
    const totalItems = pedido.reduce((a, c) => a + c.qty, 0);
    if (totalEl) totalEl.textContent = formatCOP(total);
    if (countEl) {
        countEl.textContent = totalItems > 0 ? totalItems : '';
        countEl.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

async function submitOrder() {
    if (pedido.length === 0) { showToast('El pedido está vacío', 'warning'); return; }

    const btn = document.getElementById('btn-enviar');
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

    const mesa = document.getElementById('mesa')?.value || 'General';
    const obs  = document.getElementById('observaciones')?.value.trim() || '';
    const num  = nextOrderNum();

    const ticket = {
        numero:    num,
        mesa:      mesa,
        mesero:    getSession() || 'Anónimo',
        items:     pedido,
        notas:     obs,
        hora:      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estado:    'pendiente',
        timestamp: Date.now()
    };

    try {
        const res  = await fetch('api.php?action=submit_order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticket)
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ Pedido #${num} enviado a cocina — ${mesa}`, 'success');
            pedido = [];
            const obs = document.getElementById('observaciones');
            if (obs) obs.value = '';
            renderTicket();
        } else {
            showToast(data.error || 'Error al enviar el pedido', 'error');
        }
    } catch (e) {
        showToast('Error de conexión con el servidor', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🚀 Confirmar Pedido'; }
    }
}

// Alias para compatibilidad
const enviarPedido  = submitOrder;
const limpiarPedido = clearOrder;

// COCINA

const ESTADO_CFG = {
    pendiente:  {
        label:  'Pendiente',
        border: 'border-amber-500',
        badge:  'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        btnCls: 'bg-blue-600 hover:bg-blue-500',
        btnTxt: '⚡ Iniciar Preparación',
        next:   'preparando'
    },
    preparando: {
        label:  'En Preparación',
        border: 'border-blue-500',
        badge:  'bg-blue-500/10 text-blue-400 border border-blue-500/30',
        btnCls: 'bg-emerald-600 hover:bg-emerald-500',
        btnTxt: '✓ Marcar como Listo',
        next:   'listo'
    },
    listo: {
        label:  '✓ Listo para entregar',
        border: 'border-emerald-500',
        badge:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        btnCls: 'bg-violet-600 hover:bg-violet-500',
        btnTxt: '🚚 Despachar al mesero',
        next:   'despachado'
    }
};

async function loadOrders() {
    const c = document.getElementById('listaPedidos');
    if (!c) return;

    try {
        const res    = await fetch('api.php?action=get_orders&estado=activos');
        const orders = await res.json();

        updateKitchenStats(orders);

        if (orders.length === 0) {
            c.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-24 text-center">
                    <span class="text-8xl mb-5 block animate-bounce">🍽️</span>
                    <p class="text-slate-500 font-black uppercase tracking-widest text-sm">Sin pedidos activos</p>
                </div>`;
            return;
        }

        c.innerHTML = orders.map(p => {
            const est   = p.estado || 'pendiente';
            const cfg   = ESTADO_CFG[est] || ESTADO_CFG.pendiente;
            const total = p.items.reduce((a, i) => a + (i.precio || i.p || 0) * (i.qty || i.cantidad || 1), 0);
            const mins  = Math.floor((Date.now() - (p.timestamp || Date.now())) / 60000);

            return `
            <div class="bg-slate-800/90 backdrop-blur rounded-2xl border-t-8 ${cfg.border}
                        p-5 shadow-2xl ticket-animado flex flex-col gap-3 min-w-0">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-3xl font-black text-white leading-none"
                            style="font-family:'Bebas Neue',sans-serif">${p.mesa}</h2>
                        <span class="text-[10px] text-slate-500 font-mono mt-0.5 block">#${p.numero || p.id}</span>
                    </div>
                    <span class="text-[9px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded">
                        ${p.hora} · ${mins < 1 ? '<1' : mins} min
                    </span>
                </div>

                <span class="text-[10px] font-black uppercase tracking-widest px-3 py-1
                             rounded-full w-fit ${cfg.badge}">${cfg.label}</span>

                <p class="text-xs text-slate-400">
                    Mesero: <span class="text-white font-bold">${p.mesero}</span>
                </p>

                <ul class="space-y-1.5 flex-grow">
                    ${p.items.map(i => `
                        <li class="flex justify-between items-baseline text-sm">
                            <span class="text-slate-200 truncate flex-1">
                                • ${i.nombre}
                                <span class="text-cyan-400 font-bold ml-1">×${i.qty || i.cantidad || 1}</span>
                            </span>
                        </li>
                    `).join('')}
                </ul>

                ${p.notas ? `<p class="text-xs text-amber-400 bg-amber-900/20 rounded-lg px-3 py-1.5">
                    📝 ${p.notas}</p>` : ''}

                <div class="flex justify-between items-center pt-1 border-t border-slate-700">
                    <span class="text-cyan-400 font-black text-lg">${formatCOP(total)}</span>
                </div>

                <button onclick="advanceOrder(${p.id}, '${est}')"
                    class="${cfg.btnCls} py-3 rounded-xl font-black text-white uppercase
                           text-[11px] tracking-widest transition-all shadow-lg active:scale-95">
                    ${cfg.btnTxt}
                </button>
            </div>`;
        }).join('');

    } catch (e) {
        console.error('Error al cargar pedidos:', e);
    }
}

async function advanceOrder(id, currentState) {
    const cfg       = ESTADO_CFG[currentState];
    const nextState = cfg ? cfg.next : 'despachado';

    try {
        const res  = await fetch('api.php?action=update_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, nuevoEstado: nextState })
        });
        const data = await res.json();
        if (data.success) {
            const label = nextState === 'despachado' ? '✓ Pedido despachado' : `Pedido → ${ESTADO_CFG[nextState]?.label || nextState}`;
            showToast(label, nextState === 'despachado' ? 'success' : 'info');
            loadOrders();
        }
    } catch (e) {
        showToast('Error al actualizar pedido', 'error');
    }
}

function updateKitchenStats(orders) {
    const stats = {
        pendiente:  orders.filter(o => o.estado === 'pendiente').length,
        preparando: orders.filter(o => o.estado === 'preparando').length,
        listo:      orders.filter(o => o.estado === 'listo').length,
        total:      orders.length
    };
    ['pendiente', 'preparando', 'listo', 'total'].forEach(k => {
        const el = document.getElementById(`ks-${k}`);
        if (el) el.textContent = stats[k];
    });
}

// ADMIN

async function loadAdminPanel() {
    try {
        // Stats
        const statsRes = await fetch('api.php?action=get_stats');
        const stats    = await statsRes.json();

        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('adm-completed',       stats.completados);
        setEl('adm-active',          stats.activos);
        setEl('adm-revenue',         formatCOP(stats.ingresos));
        setEl('adm-avg',             formatCOP(stats.promedio));
        setEl('adm-employees',       stats.empleados);
        setEl('adm-completed-badge', stats.completados);
        setEl('adm-active-badge',    stats.activos);
        setEl('adm-employees-badge', stats.empleados);

        // Tabla: Pedidos completados
        const ordRes  = await fetch('api.php?action=get_orders&estado=despachado');
        const completed = await ordRes.json();
        const tbody   = document.getElementById('adm-orders-tbody');
        if (tbody) {
            if (completed.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-slate-500 text-sm">
                    No hay pedidos completados aún.</td></tr>`;
            } else {
                tbody.innerHTML = completed.slice(0, 25).map(o => {
                    const t = o.items.reduce((a, i) => a + (i.precio || i.p || 0) * (i.qty || i.cantidad || 1), 0);
                    const cnt = o.items.reduce((a, i) => a + (i.qty || i.cantidad || 1), 0);
                    return `
                    <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors">
                        <td class="py-3 px-4 text-cyan-400 font-mono font-black text-sm">#${o.numero || o.id}</td>
                        <td class="py-3 px-4 text-white font-semibold text-sm">${o.mesa}</td>
                        <td class="py-3 px-4 text-slate-300 text-sm">${o.mesero}</td>
                        <td class="py-3 px-4 text-xs text-slate-400">${cnt} ítem(s)</td>
                        <td class="py-3 px-4 text-emerald-400 font-black text-sm">${formatCOP(t)}</td>
                        <td class="py-3 px-4 text-slate-500 text-xs font-mono">${o.horaDespacho || o.hora}</td>
                    </tr>`;
                }).join('');
            }
        }

        // Tabla: Empleados
        const empRes = await fetch('api.php?action=get_users');
        const users  = await empRes.json();
        const etbody = document.getElementById('adm-emp-tbody');
        if (etbody) {
            if (users.length === 0) {
                etbody.innerHTML = `<tr><td colspan="4" class="text-center py-10 text-slate-500 text-sm">
                    No hay empleados registrados.</td></tr>`;
            } else {
                etbody.innerHTML = users.map(u => `
                    <tr class="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors">
                        <td class="py-3 px-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center
                                            text-white text-xs font-black flex-shrink-0">
                                    ${u.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p class="text-white font-bold text-sm">${u.nombre} ${u.apellidos}</p>
                                    <p class="text-slate-500 text-xs">${u.correo || '—'}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-3 px-4 text-slate-400 text-sm">${u.telefono || '—'}</td>
                        <td class="py-3 px-4 text-slate-500 text-xs">${u.fechaRegistro || '—'}</td>
                        <td class="py-3 px-4">
                            <button onclick="deleteEmployee('${u.nombre}')"
                                class="text-xs text-red-500 hover:text-red-300 transition-colors font-bold uppercase">
                                Eliminar
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Pedidos activos en la sección "activos"
        const actRes = await fetch('api.php?action=get_orders&estado=activos');
        const activos = await actRes.json();
        const container = document.getElementById('adm-active-orders');
        if (container) {
            if (activos.length === 0) {
                container.innerHTML = '<p class="text-slate-500 text-sm text-center py-8">Sin pedidos activos en cocina</p>';
            } else {
                const ESTADO_LABEL = {
                    pendiente:  '🟡 Pendiente',
                    preparando: '🔵 En Preparación',
                    listo:      '🟢 Listo'
                };
                container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    ${activos.map(o => {
                        const total = o.items.reduce((s, i) => s + (i.precio || i.p || 0) * (i.qty || i.cantidad || 1), 0);
                        const mins  = Math.floor((Date.now() - (o.timestamp || Date.now())) / 60000);
                        return `
                        <div class="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <p class="text-white font-black">${o.mesa}</p>
                                    <p class="text-slate-500 text-xs font-mono">#${o.numero || o.id}</p>
                                </div>
                                <span class="text-[9px] font-black text-slate-400 bg-slate-900 px-2 py-0.5 rounded">${o.hora}</span>
                            </div>
                            <p class="text-xs text-slate-400 mb-1">Mesero: <span class="text-white font-bold">${o.mesero}</span></p>
                            <p class="text-xs mb-2">${ESTADO_LABEL[o.estado] || o.estado}</p>
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] text-slate-500">⏱ ${mins < 1 ? '<1' : mins} min</span>
                                <span class="text-cyan-400 font-black text-sm">${formatCOP(total)}</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
            }
        }

    } catch (e) {
        console.error('Error al cargar panel admin:', e);
    }
}

async function deleteEmployee(nombre) {
    const session = getSession();
    if (nombre === session) { showToast('No puedes eliminar tu propia cuenta', 'error'); return; }
    if (!confirm(`¿Eliminar al empleado "${nombre}"?`)) return;

    try {
        const res  = await fetch('api.php?action=delete_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Empleado "${nombre}" eliminado`, 'warning');
            loadAdminPanel();
        }
    } catch (e) {
        showToast('Error al eliminar empleado', 'error');
    }
}

async function clearOrders() {
    if (!confirm('¿Borrar TODOS los pedidos de la base de datos?')) return;
    try {
        await fetch('api.php?action=clear_orders', { method: 'POST' });
        showToast('Pedidos borrados', 'warning');
        loadAdminPanel();
    } catch(e) { showToast('Error al borrar pedidos', 'error'); }
}

async function clearAllData() {
    if (!confirm('⚠️ ¿REINICIAR TODO el sistema?\n\nSe borrarán pedidos y empleados (excepto admin).\nEsta acción NO se puede deshacer.')) return;
    try {
        await fetch('api.php?action=clear_all', { method: 'POST' });
        localStorage.clear();
        showToast('Sistema reiniciado', 'warning');
        setTimeout(() => window.location.href = 'index.html', 1500);
    } catch(e) { showToast('Error al reiniciar', 'error'); }
}

function exportarDatos() {
    // Exporta datos desde la API en vez de localStorage
    Promise.all([
        fetch('api.php?action=get_orders').then(r => r.json()),
        fetch('api.php?action=get_users').then(r => r.json())
    ]).then(([pedidos, empleados]) => {
        const data = {
            exportado:  new Date().toISOString(),
            pedidos,
            empleados:  empleados.map(u => ({ nombre: u.nombre, apellidos: u.apellidos, correo: u.correo, telefono: u.telefono }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `fastfood-export-${Date.now()}.json`;
        a.click(); URL.revokeObjectURL(url);
        showToast('Datos exportados como JSON', 'success');
    });
}

// DOMContentLoaded — INICIALIZACIÓN

document.addEventListener('DOMContentLoaded', () => {

    // ── LOGIN 
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Mostrar contador de empleados registrados
        fetch('api.php?action=get_stats')
            .then(r => r.json())
            .then(data => {
                const el = document.getElementById('user-count');
                if (el) el.textContent = `${data.empleados} empleado(s) registrado(s)`;
            }).catch(() => {
                const el = document.getElementById('user-count');
                if (el) el.textContent = 'No se pudo conectar al servidor';
            });

        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const btn    = loginForm.querySelector('button[type="submit"]');
            const nombre = document.getElementById('login-nombre').value.trim();
            const pass   = document.getElementById('login-pass').value;

            if (!nombre || !pass) { showToast('Completa todos los campos', 'warning'); return; }
            if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }

            try {
                const res  = await fetch('api.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: nombre, pass })
                });
                const data = await res.json();

                if (data.success) {
                    localStorage.setItem('ff_session', data.nombre);
                    showToast(`¡Bienvenido, ${data.nombre}! 👋`, 'success');
                    setTimeout(() => window.location.href = 'roles1.html', 900);
                } else {
                    showToast(data.error || 'Usuario o contraseña incorrectos', 'error');
                    if (btn) { btn.disabled = false; btn.textContent = 'Ingresar al Sistema →'; }
                }
            } catch (err) {
                showToast('❌ No se puede conectar con el servidor.\nVerifica que XAMPP esté activo.', 'error');
                if (btn) { btn.disabled = false; btn.textContent = 'Ingresar al Sistema →'; }
            }
        });
    }

    // ── REGISTRO 
    const regForm = document.getElementById('regForm');
    if (regForm && !regForm.dataset.handled) {
        regForm.dataset.handled = 'true';

        regForm.addEventListener('submit', async e => {
            e.preventDefault();
            const btn       = regForm.querySelector('button[type="submit"]');
            const nombre    = document.getElementById('nombre').value.trim();
            const apellidos = document.getElementById('apellidos').value.trim();
            const telefono  = document.getElementById('telefono').value.trim();
            const correo    = document.getElementById('correo_electronico').value.trim();
            const pass      = document.getElementById('password').value;
            const pass2     = document.getElementById('password2').value;

            if (!nombre || !apellidos || !telefono || !correo || !pass) {
                showToast('Completa todos los campos', 'warning'); return;
            }
            if (pass !== pass2) { showToast('Las contraseñas no coinciden', 'error'); return; }
            if (pass.length < 4) { showToast('La contraseña debe tener al menos 4 caracteres', 'warning'); return; }

            if (btn) { btn.disabled = true; btn.textContent = 'Registrando...'; }

            try {
                const res  = await fetch('api.php?action=register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, apellidos, telefono, correo, password: pass })
                });
                const data = await res.json();

                if (data.success) {
                    localStorage.setItem('ff_session', data.nombre || nombre);
                    showToast(`¡Bienvenido al equipo, ${nombre}! 🎉`, 'success');
                    setTimeout(() => window.location.href = 'roles1.html', 900);
                } else {
                    showToast(data.error || 'Error en el registro', 'error');
                    if (btn) { btn.disabled = false; btn.textContent = 'Crear Cuenta y Continuar →'; }
                }
            } catch (err) {
                showToast('❌ No se puede conectar con el servidor.\nVerifica que XAMPP esté activo.', 'error');
                if (btn) { btn.disabled = false; btn.textContent = 'Crear Cuenta y Continuar →'; }
            }
        });
    }

    // ── ROLES 
    const nombreEl = document.getElementById('nombreUsuario');
    if (nombreEl) {
        if (!requireAuth()) return;
        const session = getSession();
        nombreEl.textContent = session;
        const avatar = document.getElementById('user-avatar');
        if (avatar) avatar.textContent = session.charAt(0).toUpperCase();
    }

    // ── MESERO 
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        if (!requireAuth()) return;
        const session = getSession();
        userNameEl.textContent = session;
        const avatarLetter = document.getElementById('user-avatar-letter');
        if (avatarLetter) avatarLetter.textContent = session.charAt(0).toUpperCase();
        renderMenu();
        renderTicket();
    }

    // ── ADMIN 
    const adminEl = document.getElementById('adm-panel-trigger');
    if (adminEl) {
        if (!requireAuth()) return;
        const nameEl = document.getElementById('adm-username');
        if (nameEl) nameEl.textContent = getSession();
        loadAdminPanel();
        setInterval(loadAdminPanel, 5000);
    }
});

// ── COCINA 
if (document.getElementById('listaPedidos')) {
    if (!localStorage.getItem('ff_session')) window.location.href = 'index.html';
    window.addEventListener('load', loadOrders);
    setInterval(loadOrders, 3000);
}
// ── COCINA ──────────────────────────────────
if (document.getElementById('listaPedidos')) {
    if (!localStorage.getItem('ff_session')) window.location.href = 'index.html';
    window.addEventListener('load', loadOrders);
    setInterval(loadOrders, 3000);
}
