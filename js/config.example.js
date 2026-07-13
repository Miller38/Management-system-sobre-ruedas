// ============================================
// 🔐 CONFIGURACIÓN - EJEMPLO (config.example.js)
// ============================================
// 🔴 COPIA ESTE ARCHIVO A config.js Y REEMPLAZA CON TUS DATOS

const CONFIG = {
    // Firebase - Obtén estos datos de Firebase Console
    firebase: {
        apiKey: "TU_API_KEY",
        authDomain: "TU_PROYECTO.firebaseapp.com",
        databaseURL: "https://TU_PROYECTO-default-rtdb.firebaseio.com",
        projectId: "TU_PROYECTO",
        storageBucket: "TU_PROYECTO.firebasestorage.app",
        messagingSenderId: "TU_ID",
        appId: "TU_APP_ID"
    },
    
    // Empresa - Tus datos
    empresa: {
        nombre: 'NOMBRE_EMPRESA',
        telefono: 'TELEFONO',
        email: 'EMAIL',
        web: 'WEB',
        direccion: 'DIRECCION',
        nit: 'NIT'
    }
};

// Exportar
window.CONFIG = CONFIG;

console.log('✅ Configuración cargada correctamente');