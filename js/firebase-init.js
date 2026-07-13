// ============================================
// 🔥 CONFIGURACIÓN DE FIREBASE - VERSIÓN CDN
// ============================================

// ✅ Verificar que CONFIG existe
if (typeof CONFIG === 'undefined') {
    console.error('❌ ERROR: CONFIG no está definido. Verifica que config.js se cargó correctamente.');
    alert('❌ Error de configuración. Revisa la consola para más detalles.');
    throw new Error('CONFIG no está definido');
}

// ✅ Verificar que CONFIG.firebase existe
if (!CONFIG.firebase) {
    console.error('❌ ERROR: CONFIG.firebase no está definido.');
    alert('❌ Error de configuración: Faltan credenciales de Firebase.');
    throw new Error('CONFIG.firebase no está definido');
}

// Usar configuración desde config.js
const firebaseConfig = CONFIG.firebase;

console.log('📧 Configuración de Firebase cargada:');
console.log('  - apiKey:', firebaseConfig.apiKey ? '✅ OK' : '❌ FALTA');
console.log('  - authDomain:', firebaseConfig.authDomain ? '✅ OK' : '❌ FALTA');
console.log('  - projectId:', firebaseConfig.projectId ? '✅ OK' : '❌ FALTA');

// ============================================
// INICIALIZAR FIREBASE
// ============================================
firebase.initializeApp(firebaseConfig);

// ============================================
// SERVICIOS DE FIREBASE
// ============================================
const db = firebase.firestore();
const auth = firebase.auth();

console.log('✅ Firebase inicializado correctamente');
console.log('📧 Proyecto:', firebaseConfig.projectId);

// ============================================
// COLECCIONES
// ============================================
const COLECCIONES = {
    CLIENTES: 'clientes',
    ORDENES: 'ordenes',
    USUARIOS: 'usuarios',
    CONFIG: 'config'
};

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================
function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

function logout() {
    return auth.signOut();
}

function verificarAuth() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(user => {
            resolve(user);
        });
    });
}

// ============================================
// CRUD - CLIENTES
// ============================================
async function crearCliente(data) {
    try {
        const docRef = await db.collection(COLECCIONES.CLIENTES).add({
            ...data,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            estado: 'activo',
            creadoPor: auth.currentUser?.uid || 'sistema'
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error al crear cliente:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// OBTENER CLIENTES (SIN ÍNDICE)
// ============================================
async function obtenerClientes() {
    try {
        console.log('🔄 Obteniendo clientes...');
        
        const snapshot = await db.collection(COLECCIONES.CLIENTES)
            .where('estado', '==', 'activo')
            .get();
        
        console.log('📊 Documentos encontrados:', snapshot.size);
        
        const clientes = [];
        snapshot.forEach(doc => {
            clientes.push({ 
                id: doc.id, 
                ...doc.data() 
            });
        });
        
        // Ordenar manualmente en JavaScript
        clientes.sort((a, b) => {
            const dateA = a.fechaCreacion ? a.fechaCreacion.toDate() : new Date(0);
            const dateB = b.fechaCreacion ? b.fechaCreacion.toDate() : new Date(0);
            return dateB - dateA;
        });
        
        console.log('📊 Clientes obtenidos:', clientes.length);
        return { success: true, data: clientes };
        
    } catch (error) {
        console.error('❌ Error al obtener clientes:', error);
        return { success: false, error: error.message };
    }
}

async function obtenerCliente(id) {
    try {
        const doc = await db.collection(COLECCIONES.CLIENTES).doc(id).get();
        if (doc.exists) {
            return { success: true, data: { id: doc.id, ...doc.data() } };
        } else {
            return { success: false, error: 'Cliente no encontrado' };
        }
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        return { success: false, error: error.message };
    }
}

async function actualizarCliente(id, data) {
    try {
        await db.collection(COLECCIONES.CLIENTES).doc(id).update({
            ...data,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        return { success: false, error: error.message };
    }
}

async function eliminarCliente(id) {
    try {
        await db.collection(COLECCIONES.CLIENTES).doc(id).update({
            estado: 'inactivo',
            fechaEliminacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// CRUD - ÓRDENES
// ============================================
async function crearOrden(data) {
    try {
        const numeroOrden = await generarNumeroOrden();
        
        const docRef = await db.collection(COLECCIONES.ORDENES).add({
            ...data,
            numeroOrden,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            estado: 'pendiente',
            creadoPor: auth.currentUser?.uid || 'sistema'
        });
        
        await db.collection(COLECCIONES.CLIENTES).doc(data.clienteId).update({
            totalOrdenes: firebase.firestore.FieldValue.increment(1),
            ultimaOrden: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true, id: docRef.id, numeroOrden };
    } catch (error) {
        console.error('Error al crear orden:', error);
        return { success: false, error: error.message };
    }
}

async function obtenerOrdenes(filtros = {}) {
    try {
        let query = db.collection(COLECCIONES.ORDENES);
        
        // 🔴 IMPORTANTE: Verificar que clienteId existe y no es undefined
        if (filtros.clienteId) {
            console.log('🔍 Filtrando por clienteId:', filtros.clienteId);
            query = query.where('clienteId', '==', filtros.clienteId);
        }
        
        if (filtros.estado) {
            console.log('🔍 Filtrando por estado:', filtros.estado);
            query = query.where('estado', '==', filtros.estado);
        }
        
        query = query.orderBy('fechaCreacion', 'desc');
        
        const snapshot = await query.get();
        const ordenes = [];
        snapshot.forEach(doc => {
            ordenes.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('📊 Órdenes encontradas:', ordenes.length);
        return { success: true, data: ordenes };
    } catch (error) {
        console.error('❌ Error al obtener órdenes:', error);
        return { success: false, error: error.message };
    }
}

async function actualizarEstadoOrden(id, estado) {
    try {
        await db.collection(COLECCIONES.ORDENES).doc(id).update({
            estado: estado,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar orden:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// GENERAR NÚMERO DE ORDEN
// ============================================
async function generarNumeroOrden() {
    try {
        const configRef = db.collection(COLECCIONES.CONFIG).doc('contadores');
        const doc = await configRef.get();
        
        let numero = 1;
        if (doc.exists) {
            numero = doc.data().ultimaOrden || 1;
        }
        
        await configRef.set({
            ultimaOrden: numero + 1
        }, { merge: true });
        
        const año = new Date().getFullYear().toString().slice(-2);
        const mes = String(new Date().getMonth() + 1).padStart(2, '0');
        const dia = String(new Date().getDate()).padStart(2, '0');
        
        return `${año}${mes}${dia}-${String(numero).padStart(6, '0')}`;
    } catch (error) {
        console.error('Error al generar número de orden:', error);
        return `TEMP-${Date.now().toString().slice(-8)}`;
    }
}

// ============================================
// MÉTRICAS
// ============================================
async function obtenerMetricas() {
    try {
        const clientesSnapshot = await db.collection(COLECCIONES.CLIENTES)
            .where('estado', '==', 'activo')
            .get();
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const mañana = new Date(hoy);
        mañana.setDate(mañana.getDate() + 1);
        
        const ordenesHoy = await db.collection(COLECCIONES.ORDENES)
            .where('fechaCreacion', '>=', hoy)
            .where('fechaCreacion', '<', mañana)
            .get();
        
        const totalIngresos = await db.collection(COLECCIONES.ORDENES)
            .where('estado', 'in', ['completada', 'pagada'])
            .get();
        
        let ingresos = 0;
        totalIngresos.forEach(doc => {
            const data = doc.data();
            ingresos += parseFloat(data.total) || 0;
        });
        
        const estados = ['pendiente', 'en_proceso', 'completada', 'cancelada'];
        const ordenesPorEstado = {};
        for (const estado of estados) {
            const snap = await db.collection(COLECCIONES.ORDENES)
                .where('estado', '==', estado)
                .get();
            ordenesPorEstado[estado] = snap.size;
        }
        
        return {
            success: true,
            data: {
                totalClientes: clientesSnapshot.size,
                totalOrdenesHoy: ordenesHoy.size,
                totalIngresos: ingresos,
                ordenesPorEstado: ordenesPorEstado,
                ultimaActualizacion: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Error al obtener métricas:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================
window.db = db;
window.auth = auth;
window.firebase = firebase;
window.login = login;
window.logout = logout;
window.verificarAuth = verificarAuth;
window.crearCliente = crearCliente;
window.obtenerClientes = obtenerClientes;
window.obtenerCliente = obtenerCliente;
window.actualizarCliente = actualizarCliente;
window.eliminarCliente = eliminarCliente;
window.crearOrden = crearOrden;
window.obtenerOrdenes = obtenerOrdenes;
window.actualizarEstadoOrden = actualizarEstadoOrden;
window.obtenerMetricas = obtenerMetricas;

console.log('✅ Firebase listo y funciones exportadas');
console.log('📦 funciones exportadas:', {
    db: !!db,
    auth: !!auth,
    login: !!login,
    obtenerClientes: !!obtenerClientes,
    crearCliente: !!crearCliente
});