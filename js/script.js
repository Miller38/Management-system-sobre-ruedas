// ============================================
// 1. VARIABLES GLOBALES
// ============================================
let currentUser = null;
let clientesCache = [];
let ordenesCache = [];

// Usar datos de empresa desde config.js
const empresa = CONFIG.empresa;

console.log('🏢 Empresa cargada desde config:', empresa.nombre);
// ============================================
// 2. INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación...');
    loadTheme();
    verificarSesion();
    initEventListeners();
});

function initEventListeners() {
    // Navegación
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            cambiarSeccion(section);
        });
    });
    
    // Buscador de clientes
    const searchInput = document.getElementById('search-clientes');
    if (searchInput) {
        console.log('✅ Buscador encontrado, agregando evento...');
        searchInput.addEventListener('input', filtrarClientes);
    }
}

// ============================================
// 3. AUTENTICACIÓN
// ============================================
async function verificarSesion() {
    try {
        console.log('🔄 Verificando sesión...');
        const user = await verificarAuth();
        
        if (user) {
            currentUser = user;
            console.log('✅ Usuario autenticado:', user.email);
            
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app-screen').style.display = 'flex';
            document.getElementById('user-name').textContent = user.email || 'Admin';
            
            cargarDashboard();
            
            setTimeout(() => {
                cargarClientesSelect();
            }, 1000);
        } else {
            console.log('🔒 Usuario no autenticado');
            document.getElementById('login-screen').style.display = 'flex';
            document.getElementById('app-screen').style.display = 'none';
            
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            const errorEl = document.getElementById('login-error');
            if (errorEl) {
                errorEl.style.display = 'none';
                errorEl.textContent = '';
            }
        }
    } catch (error) {
        console.error('❌ Error al verificar sesión:', error);
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-screen').style.display = 'none';
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    
    const btn = document.querySelector('.btn-login');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    btn.disabled = true;
    
    login(email, password)
        .then(() => {
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            
            btn.innerHTML = originalText;
            btn.disabled = false;
            verificarSesion();
        })
        .catch((error) => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            errorEl.textContent = '❌ ' + error.message;
            errorEl.style.display = 'block';
        });
}

function handleLogout() {
    if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) return;
    
    logout()
        .then(() => {
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            const errorEl = document.getElementById('login-error');
            if (errorEl) {
                errorEl.style.display = 'none';
                errorEl.textContent = '';
            }
            
            verificarSesion();
            mostrarNotificacion('Sesión cerrada correctamente', 'info');
        })
        .catch((error) => {
            console.error('❌ Error al cerrar sesión:', error);
            mostrarNotificacion('Error al cerrar sesión', 'error');
        });
}

// ============================================
// 4. MODO DARK / LIGHT
// ============================================
const THEME_KEY = 'sobre-ruedas-theme';

function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    const currentTheme = html.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        html.removeAttribute('data-theme');
        localStorage.setItem(THEME_KEY, 'light');
        if (icon) icon.className = 'fas fa-moon';
        console.log('☀️ Cambiando a modo claro');
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem(THEME_KEY, 'dark');
        if (icon) icon.className = 'fas fa-sun';
        console.log('🌙 Cambiando a modo oscuro');
    }
}

function loadTheme() {
    const icon = document.getElementById('theme-icon');
    const html = document.documentElement;
    const savedTheme = localStorage.getItem(THEME_KEY);
    
    console.log('🔄 Recuperando tema guardado:', savedTheme);
    
    if (!savedTheme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultTheme = prefersDark ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, defaultTheme);
        console.log('📱 Usando preferencia del sistema:', defaultTheme);
    }
    
    const theme = localStorage.getItem(THEME_KEY);
    
    if (theme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        if (icon) icon.className = 'fas fa-sun';
        console.log('🌙 Modo oscuro activado (guardado)');
    } else {
        html.removeAttribute('data-theme');
        if (icon) icon.className = 'fas fa-moon';
        console.log('☀️ Modo claro activado (guardado)');
    }
}

// ============================================
// 5. NAVEGACIÓN
// ============================================
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function cambiarSeccion(section) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === section);
    });
    
    document.querySelectorAll('.section').forEach(el => {
        el.classList.toggle('active', el.id === `section-${section}`);
    });
    
    const titulos = {
        dashboard: 'Dashboard',
        clientes: 'Gestión de Clientes',
        ordenes: 'Historial de Órdenes',
        'nueva-orden': 'Nueva Orden de Servicio',
        metricas: 'Métricas Avanzadas'
    };
    document.getElementById('page-title').textContent = titulos[section] || section;
    
    if (section === 'dashboard') cargarDashboard();
    if (section === 'clientes') cargarClientes();
    if (section === 'ordenes') cargarOrdenes();
    if (section === 'nueva-orden') {
        console.log('🔄 Cargando clientes para Nueva Orden...');
        setTimeout(() => {
            cargarClientesSelect();
        }, 100);
    }
    if (section === 'metricas') cargarMetricas();
    
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

function irANuevaOrden() {
    cambiarSeccion('nueva-orden');
}

// ============================================
// 6. DASHBOARD
// ============================================
async function cargarDashboard() {
    try {
        const result = await obtenerMetricas();
        if (result.success) {
            const data = result.data;
            
            const statClientes = document.getElementById('stat-clientes');
            const statOrdenesHoy = document.getElementById('stat-ordenes-hoy');
            const statIngresos = document.getElementById('stat-ingresos');
            const statPendientes = document.getElementById('stat-pendientes');
            
            if (statClientes) statClientes.textContent = data.totalClientes || 0;
            if (statOrdenesHoy) statOrdenesHoy.textContent = data.totalOrdenesHoy || 0;
            if (statIngresos) statIngresos.textContent = `$${data.totalIngresos.toLocaleString('es-CO')}`;
            if (statPendientes) statPendientes.textContent = data.ordenesPorEstado?.pendiente || 0;
            
            const estados = ['pendiente', 'en_proceso', 'completada', 'cancelada'];
            const labels = { pendiente: 'Pendiente', en_proceso: 'En Proceso', completada: 'Completada', cancelada: 'Cancelada' };
            const colores = { pendiente: '#f59e0b', en_proceso: '#3b82f6', completada: '#10b981', cancelada: '#ef4444' };
            
            const max = Math.max(...estados.map(e => data.ordenesPorEstado?.[e] || 0), 1);
            const barsContainer = document.getElementById('chart-bars');
            if (barsContainer) {
                barsContainer.innerHTML = '';
                
                estados.forEach(estado => {
                    const valor = data.ordenesPorEstado?.[estado] || 0;
                    const altura = Math.max((valor / max) * 160, 10);
                    barsContainer.innerHTML += `
                        <div class="bar-item">
                            <div class="bar" style="height:${altura}px;background:${colores[estado]};"></div>
                            <span class="bar-label">${labels[estado]}</span>
                            <span class="bar-label" style="font-weight:600;">${valor}</span>
                        </div>
                    `;
                });
            }
            
            await cargarUltimasOrdenes();
        }
    } catch (error) {
        console.error('Error en cargarDashboard:', error);
    }
}

async function cargarUltimasOrdenes() {
    try {
        const result = await obtenerOrdenes();
        const container = document.getElementById('recent-orders-table');
        if (!container) return;
        
        if (result.success && result.data.length > 0) {
            const ordenes = result.data.slice(0, 5);
            
            let html = `<div style="overflow-x:auto;"><table><thead><tr><th># Orden</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>`;
            
            for (const orden of ordenes) {
                const clienteResult = await obtenerCliente(orden.clienteId);
                const nombreCliente = clienteResult.success ? clienteResult.data.nombre : 'N/A';
                const estadoClass = `estado-${orden.estado}`;
                const estadoLabel = { pendiente: 'Pendiente', en_proceso: 'En Proceso', completada: 'Completada', cancelada: 'Cancelada' }[orden.estado] || orden.estado;
                
                html += `
                    <tr>
                        <td><strong>#${orden.numeroOrden}</strong></td>
                        <td>${nombreCliente}</td>
                        <td>$${parseFloat(orden.total).toLocaleString('es-CO')}</td>
                        <td><span class="estado-badge ${estadoClass}">${estadoLabel}</span></td>
                        <td>${orden.fechaCreacion ? orden.fechaCreacion.toDate().toLocaleDateString('es-CO') : '-'}</td>
                    </tr>
                `;
            }
            
            html += `</tbody></table></div>`;
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted);">No hay órdenes recientes</p>';
        }
    } catch (error) {
        console.error('Error en cargarUltimasOrdenes:', error);
        const container = document.getElementById('recent-orders-table');
        if (container) {
            container.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted);">Error al cargar órdenes</p>';
        }
    }
}

// ============================================
// 7. CLIENTES
// ============================================
async function cargarClientes() {
    console.log('🔄 Cargando clientes...');
    
    try {
        const result = await obtenerClientes();
        console.log('📊 Resultado de obtenerClientes:', result);
        
        if (result.success) {
            clientesCache = result.data || [];
            console.log('✅ Clientes cargados en caché:', clientesCache.length);
            renderizarClientes(clientesCache);
        } else {
            console.error('❌ Error al cargar clientes:', result.error);
            mostrarNotificacion('Error al cargar clientes', 'error');
        }
    } catch (error) {
        console.error('❌ Error en cargarClientes:', error);
        mostrarNotificacion('Error al cargar clientes', 'error');
    }
}

function renderizarClientes(clientes) {
    const container = document.getElementById('clientes-table');
    if (!container) return;
    
    if (!clientes || clientes.length === 0) {
        container.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted);">No hay clientes registrados</p>';
        return;
    }
    
    let html = `<div style="overflow-x:auto;"><table><thead><tr><th>Nombre</th><th>NIT/CC</th><th>Teléfono</th><th>Email</th><th>Órdenes</th><th>Acciones</th></tr></thead><tbody>`;
    
    clientes.forEach(cliente => {
        html += `
            <tr>
                <td><strong>${cliente.nombre || 'N/A'}</strong></td>
                <td>${cliente.nit || 'N/A'}</td>
                <td>${cliente.telefono || 'N/A'}</td>
                <td>${cliente.email || '-'}</td>
                <td>${cliente.totalOrdenes || 0}</td>
                <td>
                    <button class="btn btn-primary btn-small" onclick="verHistorialCliente('${cliente.id}')" title="Ver historial">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn btn-primary btn-small" onclick="editarCliente('${cliente.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="eliminarClienteHandler('${cliente.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// ============================================
// CARGAR CLIENTES EN SELECT (SOLO NOMBRE)
// ============================================
async function cargarClientesSelect() {
    console.log('🔄 Cargando clientes en el select...');
    
    try {
        const select = document.getElementById('orden-cliente');
        if (!select) {
            console.error('❌ Select #orden-cliente no encontrado');
            return;
        }
        
        select.innerHTML = '<option value="">Cargando clientes...</option>';
        
        const snapshot = await db.collection('clientes')
            .where('estado', '==', 'activo')
            .get();
        
        console.log('📊 Clientes encontrados:', snapshot.size);
        
        select.innerHTML = '<option value="">Seleccionar cliente...</option>';
        
        if (snapshot.empty) {
            select.innerHTML += '<option value="" disabled>No hay clientes registrados</option>';
            console.warn('⚠️ No hay clientes activos');
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = data.nombre || 'Sin nombre';
            select.appendChild(option);
        });
        
        console.log(`✅ ${snapshot.size} clientes cargados correctamente`);
        
    } catch (error) {
        console.error('❌ Error en cargarClientesSelect:', error);
        const select = document.getElementById('orden-cliente');
        if (select) {
            select.innerHTML = '<option value="" disabled>Error al cargar clientes</option>';
        }
    }
}

// ============================================
// FILTRAR CLIENTES
// ============================================
function filtrarClientes() {
    const input = document.getElementById('search-clientes');
    if (!input) {
        console.error('❌ Input de búsqueda no encontrado');
        return;
    }
    
    const termino = input.value.toLowerCase().trim();
    console.log('🔍 Buscando:', termino);
    
    if (!termino) {
        console.log('📊 Mostrando todos los clientes:', clientesCache.length);
        renderizarClientes(clientesCache);
        return;
    }
    
    const filtrados = clientesCache.filter(cliente => {
        const nombre = (cliente.nombre || '').toLowerCase();
        const nit = (cliente.nit || '').toLowerCase();
        const telefono = (cliente.telefono || '').toLowerCase();
        const email = (cliente.email || '').toLowerCase();
        
        return nombre.includes(termino) || 
               nit.includes(termino) || 
               telefono.includes(termino) || 
               email.includes(termino);
    });
    
    console.log(`📊 Resultados: ${filtrados.length} clientes encontrados`);
    renderizarClientes(filtrados);
}

// ============================================
// MODALES DE CLIENTE
// ============================================
function abrirModalCliente(cliente = null) {
    const modal = document.getElementById('modal-cliente');
    if (!modal) return;
    
    const title = document.getElementById('modal-cliente-title');
    
    if (cliente) {
        title.textContent = 'Editar Cliente';
        document.getElementById('cliente-id').value = cliente.id || '';
        document.getElementById('cliente-nombre').value = cliente.nombre || '';
        document.getElementById('cliente-nit').value = cliente.nit || '';
        document.getElementById('cliente-telefono').value = cliente.telefono || '';
        document.getElementById('cliente-email').value = cliente.email || '';
        document.getElementById('cliente-direccion').value = cliente.direccion || '';
    } else {
        title.textContent = 'Nuevo Cliente';
        document.getElementById('cliente-id').value = '';
        document.getElementById('cliente-form').reset();
    }
    
    modal.style.display = 'flex';
}

function cerrarModalCliente() {
    const modal = document.getElementById('modal-cliente');
    if (modal) modal.style.display = 'none';
}

async function guardarCliente(e) {
    e.preventDefault();
    
    const id = document.getElementById('cliente-id').value;
    const data = {
        nombre: document.getElementById('cliente-nombre').value.trim(),
        nit: document.getElementById('cliente-nit').value.trim(),
        telefono: document.getElementById('cliente-telefono').value.trim(),
        email: document.getElementById('cliente-email').value.trim(),
        direccion: document.getElementById('cliente-direccion').value.trim()
    };
    
    try {
        let result;
        if (id) {
            result = await actualizarCliente(id, data);
        } else {
            result = await crearCliente(data);
        }
        
        if (result.success) {
            mostrarNotificacion(id ? 'Cliente actualizado' : 'Cliente creado', 'success');
            cerrarModalCliente();
            cargarClientes();
            cargarClientesSelect();
        } else {
            mostrarNotificacion('Error: ' + result.error, 'error');
        }
    } catch (error) {
        mostrarNotificacion('Error al guardar cliente', 'error');
    }
}

async function editarCliente(id) {
    try {
        const result = await obtenerCliente(id);
        if (result.success) {
            abrirModalCliente(result.data);
        }
    } catch (error) {
        mostrarNotificacion('Error al cargar cliente', 'error');
    }
}

async function eliminarClienteHandler(id) {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
        const result = await eliminarCliente(id);
        if (result.success) {
            mostrarNotificacion('Cliente eliminado', 'success');
            cargarClientes();
            cargarClientesSelect();
        }
    } catch (error) {
        mostrarNotificacion('Error al eliminar cliente', 'error');
    }
}

// ============================================
// 8. ÓRDENES
// ============================================
function calcularTotalOrden() {
    const valor = parseFloat(document.getElementById('orden-valor').value) || 0;
    const abono = parseFloat(document.getElementById('orden-abono').value) || 0;
    const total = Math.max(0, valor - abono);
    document.getElementById('orden-total').value = `$${total.toLocaleString('es-CO')}`;
}

async function guardarOrden() {
    const clienteId = document.getElementById('orden-cliente').value;
    const descripcion = document.getElementById('orden-descripcion').value.trim();
    const valor = parseFloat(document.getElementById('orden-valor').value) || 0;
    const abono = parseFloat(document.getElementById('orden-abono').value) || 0;
    const vendedor = document.getElementById('orden-vendedor').value.trim() || 'No especificado';
    
    if (!clienteId) {
        mostrarNotificacion('Selecciona un cliente', 'warning');
        return;
    }
    if (!descripcion) {
        mostrarNotificacion('Ingresa la descripción del servicio', 'warning');
        return;
    }
    if (valor <= 0) {
        mostrarNotificacion('Ingresa un valor válido', 'warning');
        return;
    }
    
    const data = {
        clienteId: clienteId,
        descripcion: descripcion,
        valor: valor,
        abono: abono,
        total: Math.max(0, valor - abono),
        vendedor: vendedor,
        estado: 'pendiente',
        creadoPor: currentUser?.uid || 'sistema'
    };
    
    try {
        const result = await crearOrden(data);
        if (result.success) {
            mostrarNotificacion(`Orden #${result.numeroOrden} creada exitosamente`, 'success');
            limpiarFormularioOrden();
            cargarDashboard();
        } else {
            mostrarNotificacion('Error: ' + result.error, 'error');
        }
    } catch (error) {
        mostrarNotificacion('Error al guardar orden', 'error');
    }
}

function limpiarFormularioOrden() {
    document.getElementById('orden-cliente').selectedIndex = 0;
    document.getElementById('orden-descripcion').value = '';
    document.getElementById('orden-valor').value = '';
    document.getElementById('orden-abono').value = '';
    document.getElementById('orden-total').value = '$0';
    document.getElementById('orden-vendedor').value = '';
}

async function cargarOrdenes() {
    try {
        const estado = document.getElementById('filter-estado')?.value || '';
        const filtros = {};
        if (estado) filtros.estado = estado;
        
        const result = await obtenerOrdenes(filtros);
        if (result.success) {
            ordenesCache = result.data || [];
            renderizarOrdenes(ordenesCache);
        }
    } catch (error) {
        console.error('Error al cargar órdenes:', error);
        mostrarNotificacion('Error al cargar órdenes', 'error');
    }
}

async function renderizarOrdenes(ordenes) {
    const container = document.getElementById('ordenes-table');
    if (!container) return;
    
    if (!ordenes || ordenes.length === 0) {
        container.innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted);">No hay órdenes registradas</p>';
        return;
    }
    
    let html = `<div style="overflow-x:auto;"><table><thead><tr>
        <th># Orden</th>
        <th>Cliente</th>
        <th>Descripción</th>
        <th>Valor</th>
        <th>Abono</th>
        <th>Total</th>
        <th>Estado</th>
        <th>Fecha</th>
        <th>Acciones</th>
    </tr></thead><tbody>`;
    
    for (const orden of ordenes) {
        const clienteResult = await obtenerCliente(orden.clienteId);
        const nombreCliente = clienteResult.success ? clienteResult.data.nombre : 'N/A';
        const estadoClass = `estado-${orden.estado}`;
        const estadoLabel = { pendiente: 'Pendiente', en_proceso: 'En Proceso', completada: 'Completada', cancelada: 'Cancelada' }[orden.estado] || orden.estado;
        
        html += `
            <tr>
                <td><strong>#${orden.numeroOrden}</strong></td>
                <td>${nombreCliente}</td>
                <td>${orden.descripcion ? orden.descripcion.substring(0, 30) : ''}${orden.descripcion && orden.descripcion.length > 30 ? '...' : ''}</td>
                <td>$${orden.valor ? orden.valor.toLocaleString('es-CO') : '0'}</td>
                <td>$${orden.abono ? orden.abono.toLocaleString('es-CO') : '0'}</td>
                <td><strong>$${orden.total ? orden.total.toLocaleString('es-CO') : '0'}</strong></td>
                <td><span class="estado-badge ${estadoClass}">${estadoLabel}</span></td>
                <td>${orden.fechaCreacion ? orden.fechaCreacion.toDate().toLocaleDateString('es-CO') : '-'}</td>
                <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">
                        <button class="btn btn-pdf btn-small" onclick="exportarOrdenPDF('${orden.id}')" title="Exportar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <select onchange="cambiarEstadoOrden('${orden.id}', this.value)" class="form-control" style="padding:4px 8px;font-size:12px;width:auto;">
                            <option value="pendiente" ${orden.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="en_proceso" ${orden.estado === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
                            <option value="completada" ${orden.estado === 'completada' ? 'selected' : ''}>Completada</option>
                            <option value="cancelada" ${orden.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                        </select>
                    </div>
                </td>
            </tr>
        `;
    }
    
    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

async function cambiarEstadoOrden(id, estado) {
    try {
        const result = await actualizarEstadoOrden(id, estado);
        if (result.success) {
            mostrarNotificacion('Estado actualizado', 'success');
            cargarOrdenes();
            cargarDashboard();
        }
    } catch (error) {
        mostrarNotificacion('Error al cambiar estado', 'error');
    }
}

// ============================================
// 9. EXPORTAR PDF
// ============================================
async function exportarOrdenPDF(ordenId) {
    try {
        mostrarNotificacion('Generando PDF...', 'info');
        
        const ordenResult = await obtenerOrdenes();
        if (!ordenResult.success) {
            mostrarNotificacion('Error al obtener la orden', 'error');
            return;
        }
        
        const orden = ordenResult.data.find(o => o.id === ordenId);
        if (!orden) {
            mostrarNotificacion('Orden no encontrada', 'error');
            return;
        }
        
        const clienteResult = await obtenerCliente(orden.clienteId);
        const cliente = clienteResult.success ? clienteResult.data : null;
        
        const html = construirHTMLPDF(orden, cliente);
        
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Orden-${orden.numeroOrden}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.background = '#ffffff';
        tempDiv.style.padding = '40px';
        tempDiv.style.width = '210mm';
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);
        
        html2pdf().set(opt).from(tempDiv).save().then(() => {
            document.body.removeChild(tempDiv);
            mostrarNotificacion('✅ PDF generado correctamente', 'success');
        }).catch((error) => {
            console.error('Error al generar PDF:', error);
            document.body.removeChild(tempDiv);
            mostrarNotificacion('❌ Error al generar PDF', 'error');
        });
        
    } catch (error) {
        console.error('Error en exportarOrdenPDF:', error);
        mostrarNotificacion('❌ Error al generar PDF', 'error');
    }
}

async function exportarTodasOrdenes() {
    try {
        const result = await obtenerOrdenes();
        if (!result.success || result.data.length === 0) {
            mostrarNotificacion('No hay órdenes para exportar', 'warning');
            return;
        }
        
        const ordenes = result.data;
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Reporte de Órdenes</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; }
                    .header { border-bottom: 3px solid #1a73e8; padding-bottom: 15px; margin-bottom: 25px; }
                    .header h1 { color: #1a73e8; font-size: 24px; }
                    .header p { color: #6b7280; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #1a73e8; color: #ffffff; padding: 12px; text-align: left; font-size: 12px; }
                    td { padding: 10px 12px; border-bottom: 1px solid #eef2f6; font-size: 13px; }
                    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #eef2f6; text-align: center; font-size: 12px; color: #9ca3af; }
                    .total { font-weight: 700; color: #1a73e8; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🚚 SOBRE RUEDAS</h1>
                    <p>Reporte de Órdenes - ${new Date().toLocaleDateString('es-CO')}</p>
                </div>
                <p><strong>Total de órdenes:</strong> ${ordenes.length}</p>
                <table>
                    <thead>
                        <tr>
                            <th># Orden</th>
                            <th>Cliente</th>
                            <th>Descripción</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        for (const orden of ordenes) {
            const clienteResult = await obtenerCliente(orden.clienteId);
            const nombreCliente = clienteResult.success ? clienteResult.data.nombre : 'N/A';
            const estadoLabel = { pendiente: 'Pendiente', en_proceso: 'En Proceso', completada: 'Completada', cancelada: 'Cancelada' }[orden.estado] || orden.estado;
            const fecha = orden.fechaCreacion ? orden.fechaCreacion.toDate().toLocaleDateString('es-CO') : '-';
            
            html += `
                <tr>
                    <td><strong>#${orden.numeroOrden}</strong></td>
                    <td>${nombreCliente}</td>
                    <td>${orden.descripcion || ''}</td>
                    <td class="total">$${parseFloat(orden.total).toLocaleString('es-CO')}</td>
                    <td>${estadoLabel}</td>
                    <td>${fecha}</td>
                </tr>
            `;
        }
        
        const totalGeneral = ordenes.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        
        html += `
                    </tbody>
                </table>
                <p style="text-align:right;margin-top:20px;font-size:16px;font-weight:700;">
                    Total General: $${totalGeneral.toLocaleString('es-CO')}
                </p>
                <div class="footer">
                    <p>${empresa.nombre} - ${empresa.telefono} | ${empresa.email}</p>
                    <p>${empresa.web}</p>
                    <p>Reporte generado: ${new Date().toLocaleString('es-CO')}</p>
                </div>
            </body>
            </html>
        `;
        
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Reporte-Ordenes-${new Date().toISOString().slice(0,10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.background = '#ffffff';
        tempDiv.style.padding = '40px';
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);
        
        html2pdf().set(opt).from(tempDiv).save().then(() => {
            document.body.removeChild(tempDiv);
            mostrarNotificacion('✅ PDF generado correctamente', 'success');
        }).catch((error) => {
            console.error('Error:', error);
            document.body.removeChild(tempDiv);
            mostrarNotificacion('❌ Error al generar PDF', 'error');
        });
        
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('❌ Error al generar PDF', 'error');
    }
}

function construirHTMLPDF(orden, cliente) {
    const fecha = orden.fechaCreacion ? orden.fechaCreacion.toDate().toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO');
    const hora = orden.fechaCreacion ? orden.fechaCreacion.toDate().toLocaleTimeString('es-CO') : new Date().toLocaleTimeString('es-CO');
    const estadoLabel = { pendiente: 'Pendiente', en_proceso: 'En Proceso', completada: 'Completada', cancelada: 'Cancelada' }[orden.estado] || orden.estado;
    const estadoColor = { pendiente: '#f59e0b', en_proceso: '#3b82f6', completada: '#10b981', cancelada: '#ef4444' }[orden.estado] || '#6b7280';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Orden de Servicio #${orden.numeroOrden}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; background: #ffffff; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #1a73e8; padding-bottom: 15px; margin-bottom: 25px; }
                .header-left h2 { color: #1a73e8; font-size: 22px; margin: 0; }
                .header-left p { color: #6b7280; font-size: 13px; margin: 2px 0 0 0; }
                .header-left .sub { font-size: 12px; color: #9ca3af; margin: 0; }
                .order-number { text-align: right; }
                .order-number h3 { color: #1a73e8; font-size: 22px; margin: 0; }
                .order-number p { color: #6b7280; font-size: 13px; margin: 2px 0 0 0; }
                .estado-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; color: #ffffff; background: ${estadoColor}; margin: 5px 0 15px 0; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0 20px 0; }
                .info-box { background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #eef2f6; }
                .info-box h4 { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                .info-box p { font-size: 14px; font-weight: 500; margin: 2px 0; }
                .info-box .sub { font-weight: 400; color: #6b7280; font-size: 13px; }
                .divider { border: none; border-top: 2px solid #f0f4f8; margin: 15px 0; }
                .service-detail { background: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #eef2f6; margin-bottom: 15px; }
                .service-detail p { font-size: 14px; line-height: 1.6; color: #374151; margin: 4px 0; }
                .service-detail strong { color: #1a1a2e; }
                .totals { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0; }
                .total-box { text-align: center; padding: 12px; border-radius: 10px; background: #f8fafc; border: 1px solid #eef2f6; }
                .total-box .label { font-size: 12px; color: #6b7280; }
                .total-box .value { font-size: 20px; font-weight: 700; color: #1a1a2e; }
                .total-box.total { background: #e8f0fe; border: 1px solid #d2e3fc; }
                .total-box.total .value { color: #1a73e8; }
                .terms { margin-top: 15px; padding: 12px 15px; background: #f9fafb; border-radius: 10px; border-left: 4px solid #1a73e8; }
                .terms small { color: #6b7280; font-size: 12px; line-height: 1.6; }
                .terms small strong { color: #1a1a2e; }
                .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 25px; }
                .signature-box { text-align: center; }
                .signature-box .line { border-top: 2px solid #d1d5db; width: 80%; margin: 10px auto 5px; }
                .signature-box .label { font-size: 12px; color: #6b7280; }
                .signature-box .name { font-size: 14px; font-weight: 600; margin: 0; }
                .footer { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #eef2f6; font-size: 12px; color: #9ca3af; }
                .footer p { margin: 2px 0; }
                .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; opacity: 0.03; color: #1a73e8; font-weight: 800; pointer-events: none; z-index: 0; }
            </style>
        </head>
        <body>
            <div class="watermark">SOBRE RUEDAS</div>
            
            <div class="header">
                <div class="header-left">
                    <h2>🚚 ${empresa.nombre}</h2>
                    <p>${empresa.direccion} | ${empresa.telefono}</p>
                    <p class="sub">NIT: ${empresa.nit}</p>
                </div>
                <div class="order-number">
                    <h3>#${orden.numeroOrden}</h3>
                    <p>${fecha} - ${hora}</p>
                </div>
            </div>

            <div style="text-align:center;margin:5px 0 10px 0;">
                <span class="estado-badge">${estadoLabel}</span>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <h4>👤 Cliente</h4>
                    <p>${cliente ? cliente.nombre : 'N/A'}</p>
                    <p class="sub"><i class="fas fa-id-card"></i> ${cliente && cliente.nit ? cliente.nit : 'N/A'}</p>
                    <p class="sub"><i class="fas fa-phone"></i> ${cliente && cliente.telefono ? cliente.telefono : 'N/A'}</p>
                </div>
                <div class="info-box">
                    <h4>📬 Contacto</h4>
                    <p>${cliente && cliente.direccion ? cliente.direccion : 'No especificada'}</p>
                    <p class="sub"><i class="fas fa-envelope"></i> ${cliente && cliente.email ? cliente.email : 'No especificado'}</p>
                </div>
            </div>

            <hr class="divider">

            <h4 style="margin-bottom:8px;color:#1a1a2e;">📋 Detalles del Servicio</h4>
            <div class="service-detail">
                <p><strong>Tipo de Servicio:</strong> ${orden.tipo || 'No especificado'}</p>
                <p><strong>Descripción:</strong> ${orden.descripcion || 'Sin descripción'}</p>
                <p><strong>Vendedor:</strong> ${orden.vendedor || 'No especificado'}</p>
                <p><strong>Método de Pago:</strong> ${orden.metodoPago || 'No especificado'}</p>
            </div>

            <div class="totals">
                <div class="total-box">
                    <div class="label">Valor Servicio</div>
                    <div class="value">$${parseFloat(orden.valor).toLocaleString('es-CO')}</div>
                </div>
                <div class="total-box">
                    <div class="label">Abono</div>
                    <div class="value">$${parseFloat(orden.abono || 0).toLocaleString('es-CO')}</div>
                </div>
                <div class="total-box total">
                    <div class="label">Total a Pagar</div>
                    <div class="value">$${parseFloat(orden.total).toLocaleString('es-CO')}</div>
                </div>
            </div>

            <div class="terms">
                <small>
                    <strong>📌 Términos y Condiciones:</strong><br>
                    • El servicio se realizará en un plazo máximo de 24 horas hábiles.<br>
                    • Los pagos se realizan contra entrega o transferencia bancaria.<br>
                    • Sobre Ruedas no se hace responsable por daños en productos no asegurados.<br>
                    • Esta orden es válida por 30 días a partir de la fecha de emisión.
                </small>
            </div>

            <div class="signature">
                <div class="signature-box">
                    <p class="name">${cliente ? cliente.nombre : '________________'}</p>
                    <div class="line"></div>
                    <div class="label">Firma del Cliente</div>
                </div>
                <div class="signature-box">
                    <p class="name">${orden.vendedor || '________________'}</p>
                    <div class="line"></div>
                    <div class="label">Firma del Vendedor</div>
                </div>
            </div>

            <div class="footer">
                <p><strong>${empresa.nombre}</strong> - ${empresa.telefono} | ${empresa.email}</p>
                <p>${empresa.web}</p>
                <p>Documento generado el ${new Date().toLocaleString('es-CO')}</p>
            </div>
        </body>
        </html>
    `;
}

// ============================================
// 10. HISTORIAL DEL CLIENTE
// ============================================
// ============================================
// HISTORIAL DEL CLIENTE - VERSIÓN CORREGIDA
// ============================================
async function verHistorialCliente(clienteId) {
    console.log('🔄 Ver historial del cliente ID:', clienteId);
    
    try {
        // 1. Obtener datos del cliente
        const clienteResult = await obtenerCliente(clienteId);
        if (!clienteResult.success) {
            mostrarNotificacion('Error al cargar cliente', 'error');
            return;
        }
        
        const cliente = clienteResult.data;
        console.log('👤 Cliente cargado:', cliente.nombre);
        console.log('🆔 ID del cliente:', clienteId);
        
        // 2. Obtener órdenes del cliente
        console.log('🔍 Buscando órdenes para clienteId:', clienteId);
        
        // Opción A: Usar consulta con índice
        let ordenes = [];
        try {
            const snapshot = await db.collection('ordenes')
                .where('clienteId', '==', clienteId)
                .orderBy('fechaCreacion', 'desc')
                .get();
            
            snapshot.forEach(doc => {
                ordenes.push({ id: doc.id, ...doc.data() });
            });
            console.log('📊 Órdenes encontradas (con orden):', ordenes.length);
        } catch (error) {
            console.warn('⚠️ Error con orden, intentando sin orden:', error.message);
            
            // Opción B: Sin orden (fallback)
            const snapshot = await db.collection('ordenes')
                .where('clienteId', '==', clienteId)
                .get();
            
            snapshot.forEach(doc => {
                ordenes.push({ id: doc.id, ...doc.data() });
            });
            console.log('📊 Órdenes encontradas (sin orden):', ordenes.length);
        }
        
        console.log('📊 Total órdenes encontradas:', ordenes.length);
        
        // 3. Mostrar modal
        const modal = document.getElementById('modal-historial');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            console.error('❌ Modal no encontrado');
            mostrarNotificacion('Error: Modal no encontrado', 'error');
            return;
        }
        
        // 4. Construir HTML
        const content = document.getElementById('historial-content');
        if (content) {
            content.innerHTML = construirHTMLHistorial(cliente, ordenes);
            content.dataset.clienteId = clienteId;
        } else {
            console.error('❌ Contenido del historial no encontrado');
            mostrarNotificacion('Error: Contenido no encontrado', 'error');
        }
        
    } catch (error) {
        console.error('❌ Error en verHistorialCliente:', error);
        mostrarNotificacion('Error al cargar historial: ' + error.message, 'error');
        
        // Mostrar error en el modal
        const content = document.getElementById('historial-content');
        if (content) {
            content.innerHTML = `
                <div style="text-align:center;padding:40px;color:#ef4444;">
                    <i class="fas fa-exclamation-circle" style="font-size:48px;margin-bottom:16px;"></i>
                    <p><strong>Error al cargar el historial</strong></p>
                    <p style="font-size:14px;color:#6b7280;">${error.message}</p>
                    <button class="btn btn-primary" onclick="cerrarHistorial()" style="margin-top:16px;">
                        Cerrar
                    </button>
                </div>
            `;
        }
    }
}

// ============================================
// CONSTRUIR HTML DEL HISTORIAL
// ============================================
function construirHTMLHistorial(cliente, ordenes) {
    console.log('🔄 Construyendo historial para:', cliente.nombre);
    console.log('📊 Órdenes a mostrar:', ordenes ? ordenes.length : 0);
    
    // Si no hay órdenes, ordenes debe ser un array vacío
    if (!ordenes) ordenes = [];
    
    const totalOrdenes = ordenes.length;
    const totalGastado = ordenes.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const ordenesCompletadas = ordenes.filter(o => o.estado === 'completada').length;
    const ordenesPendientes = ordenes.filter(o => o.estado === 'pendiente' || o.estado === 'en_proceso').length;
    
    const estados = {
        pendiente: { label: 'Pendiente', class: 'estado-pendiente' },
        en_proceso: { label: 'En Proceso', class: 'estado-en_proceso' },
        completada: { label: 'Completada', class: 'estado-completada' },
        cancelada: { label: 'Cancelada', class: 'estado-cancelada' }
    };
    
    // Cabecera con información del cliente
    let html = `
        <div class="historial-header">
            <div class="historial-cliente-info">
                <h4><i class="fas fa-user-circle"></i> ${cliente.nombre || 'Sin nombre'}</h4>
                <p><i class="fas fa-id-card"></i> NIT/CC: ${cliente.nit || 'N/A'}</p>
                <p><i class="fas fa-phone"></i> ${cliente.telefono || 'N/A'}</p>
                ${cliente.email ? `<p><i class="fas fa-envelope"></i> ${cliente.email}</p>` : ''}
                ${cliente.direccion ? `<p><i class="fas fa-map-marker-alt"></i> ${cliente.direccion}</p>` : ''}
                <div class="historial-actions" style="margin-top:10px;">
                    <button class="btn btn-primary btn-small" onclick="nuevaOrdenCliente('${cliente.id}')">
                        <i class="fas fa-plus"></i> Nueva Orden
                    </button>
                    <button class="btn btn-whatsapp btn-small" onclick="enviarWhatsAppCliente('${cliente.id}')">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                </div>
            </div>
            <div class="historial-stats">
                <div class="historial-stat">
                    <div class="number">${totalOrdenes}</div>
                    <div class="label">Total Órdenes</div>
                </div>
                <div class="historial-stat">
                    <div class="number">$${totalGastado.toLocaleString('es-CO')}</div>
                    <div class="label">Total Gastado</div>
                </div>
                <div class="historial-stat">
                    <div class="number">${ordenesCompletadas}</div>
                    <div class="label">Completadas</div>
                </div>
                <div class="historial-stat">
                    <div class="number">${ordenesPendientes}</div>
                    <div class="label">Pendientes</div>
                </div>
            </div>
        </div>
    `;
    
    // Lista de órdenes o mensaje vacío
    if (totalOrdenes === 0) {
        html += `
            <div class="historial-vacio">
                <i class="fas fa-inbox" style="font-size:48px;display:block;margin-bottom:12px;"></i>
                <p style="color:#6b7280;">Este cliente no tiene órdenes registradas</p>
                <button class="btn btn-primary btn-small" onclick="nuevaOrdenCliente('${cliente.id}')" style="margin-top:12px;">
                    <i class="fas fa-plus"></i> Crear primera orden
                </button>
            </div>
        `;
    } else {
        html += `<div class="historial-ordenes"><h4>📋 Historial de Órdenes (${totalOrdenes})</h4>`;
        
        // Ordenar por fecha (más reciente primero)
        ordenes.sort((a, b) => {
            const dateA = a.fechaCreacion ? a.fechaCreacion.toDate() : new Date(0);
            const dateB = b.fechaCreacion ? b.fechaCreacion.toDate() : new Date(0);
            return dateB - dateA;
        });
        
        ordenes.forEach(orden => {
            const estado = estados[orden.estado] || { label: orden.estado || 'Desconocido', class: '' };
            const fecha = orden.fechaCreacion ? orden.fechaCreacion.toDate().toLocaleDateString('es-CO') : 'Sin fecha';
            
            html += `
                <div class="historial-orden-item">
                    <div class="historial-orden-info">
                        <span><strong>#${orden.numeroOrden || 'N/A'}</strong></span>
                        <span>📅 ${fecha}</span>
                        <span>📝 ${orden.descripcion ? orden.descripcion.substring(0, 40) : ''}${orden.descripcion && orden.descripcion.length > 40 ? '...' : ''}</span>
                        <span class="estado-badge ${estado.class}">${estado.label}</span>
                    </div>
                    <div class="historial-orden-total">$${parseFloat(orden.total || 0).toLocaleString('es-CO')}</div>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    return html;
}

function cerrarHistorial() {
    document.getElementById('modal-historial').style.display = 'none';
}

function nuevaOrdenCliente(clienteId) {
    cerrarHistorial();
    cambiarSeccion('nueva-orden');
    
    setTimeout(() => {
        const select = document.getElementById('orden-cliente');
        if (select) {
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value === clienteId) {
                    select.selectedIndex = i;
                    break;
                }
            }
        }
    }, 300);
}

async function enviarWhatsAppCliente(clienteId) {
    try {
        const result = await obtenerCliente(clienteId);
        if (!result.success) {
            mostrarNotificacion('Error al cargar cliente', 'error');
            return;
        }
        
        const cliente = result.data;
        const telefono = cliente.telefono ? cliente.telefono.replace(/\s/g, '').replace(/\+/g, '') : '';
        
        if (!telefono) {
            mostrarNotificacion('El cliente no tiene teléfono registrado', 'warning');
            return;
        }
        
        const mensaje = `👋 Hola ${cliente.nombre}, soy de *SOBRE RUEDAS*.
        
📋 ¿Cómo podemos ayudarte hoy?

Puedes contactarnos al:
📞 ${empresa.telefono}
✉️ ${empresa.email}

¡Estamos para servirte! 🚀`;

        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al enviar WhatsApp', 'error');
    }
}

// ============================================
// 11. MÉTRICAS
// ============================================
async function cargarMetricas() {
    try {
        const result = await obtenerMetricas();
        const container = document.getElementById('metricas-content');
        if (!container) return;
        
        if (result.success) {
            const data = result.data;
            
            container.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-info">
                            <h3>${data.totalClientes || 0}</h3>
                            <p>Clientes Activos</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-file-invoice"></i></div>
                        <div class="stat-info">
                            <h3>${data.totalOrdenesHoy || 0}</h3>
                            <p>Órdenes Hoy</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
                        <div class="stat-info">
                            <h3>$${data.totalIngresos ? data.totalIngresos.toLocaleString('es-CO') : '0'}</h3>
                            <p>Ingresos Totales</p>
                        </div>
                    </div>
                </div>
                <div class="chart-section">
                    <h3>Distribución de Órdenes</h3>
                    <div class="chart-bars" id="metricas-chart">
                        ${['pendiente', 'en_proceso', 'completada', 'cancelada'].map(estado => {
                            const labels = { pendiente: 'Pendiente', en_proceso: 'En Proceso', completada: 'Completada', cancelada: 'Cancelada' };
                            const colores = { pendiente: '#f59e0b', en_proceso: '#3b82f6', completada: '#10b981', cancelada: '#ef4444' };
                            const valor = data.ordenesPorEstado?.[estado] || 0;
                            const max = Math.max(...Object.values(data.ordenesPorEstado || {}), 1);
                            const altura = Math.max((valor / max) * 160, 10);
                            return `
                                <div class="bar-item">
                                    <div class="bar" style="height:${altura}px;background:${colores[estado]};"></div>
                                    <span class="bar-label">${labels[estado]}</span>
                                    <span class="bar-label" style="font-weight:600;">${valor}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="chart-section">
                    <h3>Información Adicional</h3>
                    <p><strong>Última actualización:</strong> ${data.ultimaActualizacion ? new Date(data.ultimaActualizacion).toLocaleString('es-CO') : 'N/A'}</p>
                    <p><strong>Total órdenes:</strong> ${data.ordenesPorEstado ? Object.values(data.ordenesPorEstado).reduce((a, b) => a + b, 0) : 0}</p>
                </div>
            `;
        } else {
            container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">Error al cargar métricas</p>';
        }
    } catch (error) {
        console.error('Error en cargarMetricas:', error);
        const container = document.getElementById('metricas-content');
        if (container) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">Error al cargar métricas</p>';
        }
    }
}

// ============================================
// 12. NOTIFICACIONES Y RECARGA
// ============================================
function mostrarNotificacion(mensaje, tipo = 'info') {
    const container = document.getElementById('notifications-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${tipo}`;
    notification.textContent = mensaje;
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function recargarDatos() {
    const section = document.querySelector('.section.active');
    if (section) {
        const id = section.id.replace('section-', '');
        if (id === 'dashboard') cargarDashboard();
        if (id === 'clientes') cargarClientes();
        if (id === 'ordenes') cargarOrdenes();
        if (id === 'metricas') cargarMetricas();
        if (id === 'nueva-orden') cargarClientesSelect();
    }
    mostrarNotificacion('Datos actualizados', 'success');
}

// ============================================
// 13. EXPORTAR FUNCIONES
// ============================================
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.toggleSidebar = toggleSidebar;
window.cambiarSeccion = cambiarSeccion;
window.irANuevaOrden = irANuevaOrden;
window.cargarDashboard = cargarDashboard;
window.cargarClientes = cargarClientes;
window.cargarOrdenes = cargarOrdenes;
window.cargarMetricas = cargarMetricas;
window.cargarClientesSelect = cargarClientesSelect;
window.filtrarClientes = filtrarClientes;
window.abrirModalCliente = abrirModalCliente;
window.cerrarModalCliente = cerrarModalCliente;
window.guardarCliente = guardarCliente;
window.editarCliente = editarCliente;
window.eliminarClienteHandler = eliminarClienteHandler;
window.calcularTotalOrden = calcularTotalOrden;
window.guardarOrden = guardarOrden;
window.limpiarFormularioOrden = limpiarFormularioOrden;
window.cambiarEstadoOrden = cambiarEstadoOrden;
window.recargarDatos = recargarDatos;
window.verHistorialCliente = verHistorialCliente;
window.cerrarHistorial = cerrarHistorial;
window.nuevaOrdenCliente = nuevaOrdenCliente;
window.enviarWhatsAppCliente = enviarWhatsAppCliente;
window.mostrarNotificacion = mostrarNotificacion;
window.exportarOrdenPDF = exportarOrdenPDF;
window.exportarTodasOrdenes = exportarTodasOrdenes;
window.toggleTheme = toggleTheme;
window.loadTheme = loadTheme;

console.log('✅ Script cargado correctamente'); 