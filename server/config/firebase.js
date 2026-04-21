const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let db = null;
let useInMemory = true;

// In-memory store for demo mode
const inMemoryStore = {
  doctors: [],
  practitionerDoctors: [],
  appointments: [],
  reviews: [],
  hospitals: []
};

// ==========================================
// TRY TO CONNECT TO REAL FIREBASE FIRESTORE
// ==========================================
try {
  // Option 1: Service account JSON file
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const keyPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    useInMemory = false;
    console.log('🔥 Connected to Firebase Firestore (service account file)');
  }
  // Option 2: Service account JSON string in env
  else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    useInMemory = false;
    console.log('🔥 Connected to Firebase Firestore (env JSON)');
  }
  // Option 3: Default credentials (Google Cloud environment)
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    db = admin.firestore();
    useInMemory = false;
    console.log('🔥 Connected to Firebase Firestore (default credentials)');
  }
  // Option 4: Project ID only (for emulator or ADC)
  else if (process.env.FIREBASE_PROJECT_ID && process.env.USE_FIREBASE === 'true') {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    db = admin.firestore();
    useInMemory = false;
    console.log('🔥 Connected to Firebase Firestore (project ID)');
  }
  else {
    console.log('📦 No Firebase credentials found — using in-memory database');
    console.log('   To connect Firebase, add your service account key:');
    console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('   2. Click "Generate new private key" → save as serviceAccountKey.json');
    console.log('   3. Set in .env: FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json');
  }
} catch (error) {
  console.log('⚠️  Firebase connection failed:', error.message);
  console.log('   Falling back to in-memory database');
}

// ==========================================
// DATABASE WRAPPER
// Works with both Firestore and in-memory
// ==========================================
const getDB = () => {
  if (!useInMemory && db) {
    return db; // Return real Firestore
  }

  // In-memory fallback
  return {
    collection: (name) => ({
      doc: (id) => ({
        get: async () => {
          const item = (inMemoryStore[name] || []).find(i => i.id === id);
          return { exists: !!item, data: () => item, id: item?.id };
        },
        set: async (data) => {
          if (!inMemoryStore[name]) inMemoryStore[name] = [];
          const idx = inMemoryStore[name].findIndex(i => i.id === id);
          if (idx >= 0) inMemoryStore[name][idx] = { ...data, id };
          else inMemoryStore[name].push({ ...data, id });
        },
        update: async (data) => {
          if (!inMemoryStore[name]) return;
          const idx = inMemoryStore[name].findIndex(i => i.id === id);
          if (idx >= 0) inMemoryStore[name][idx] = { ...inMemoryStore[name][idx], ...data };
        },
        delete: async () => {
          if (!inMemoryStore[name]) return;
          inMemoryStore[name] = inMemoryStore[name].filter(i => i.id !== id);
        }
      }),
      add: async (data) => {
        const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        if (!inMemoryStore[name]) inMemoryStore[name] = [];
        inMemoryStore[name].push({ ...data, id });
        return { id };
      },
      where: (field, op, value) => {
        const filterFn = (item) => {
          const fieldValue = field.split('.').reduce((o, k) => o?.[k], item);
          if (op === '==') return fieldValue === value;
          if (op === '!=') return fieldValue !== value;
          if (op === '>=') return fieldValue >= value;
          if (op === '<=') return fieldValue <= value;
          return false;
        };
        return {
          get: async () => {
            const results = (inMemoryStore[name] || []).filter(filterFn);
            return {
              docs: results.map(r => ({ id: r.id, data: () => r, exists: true })),
              empty: results.length === 0,
              size: results.length
            };
          },
          where: (field2, op2, value2) => ({
            get: async () => {
              const filterFn2 = (item) => {
                const fv = field2.split('.').reduce((o, k) => o?.[k], item);
                if (op2 === '==') return fv === value2;
                if (op2 === '!=') return fv !== value2;
                return false;
              };
              const results = (inMemoryStore[name] || []).filter(i => filterFn(i) && filterFn2(i));
              return {
                docs: results.map(r => ({ id: r.id, data: () => r, exists: true })),
                empty: results.length === 0,
                size: results.length
              };
            }
          }),
          orderBy: () => ({ limit: () => ({
            get: async () => {
              const results = (inMemoryStore[name] || []).filter(filterFn);
              return { docs: results.map(r => ({ id: r.id, data: () => r, exists: true })), empty: results.length === 0 };
            }
          })})
        };
      },
      get: async () => {
        const results = inMemoryStore[name] || [];
        return {
          docs: results.map(r => ({ id: r.id, data: () => r, exists: true })),
          empty: results.length === 0,
          size: results.length
        };
      },
      orderBy: (field, dir) => ({
        get: async () => {
          let results = [...(inMemoryStore[name] || [])];
          results.sort((a, b) => {
            const av = field.split('.').reduce((o, k) => o?.[k], a);
            const bv = field.split('.').reduce((o, k) => o?.[k], b);
            return dir === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
          });
          return {
            docs: results.map(r => ({ id: r.id, data: () => r, exists: true })),
            empty: results.length === 0,
            size: results.length
          };
        },
        limit: (n) => ({
          get: async () => {
            let results = [...(inMemoryStore[name] || [])];
            return {
              docs: results.slice(0, n).map(r => ({ id: r.id, data: () => r, exists: true })),
              empty: results.length === 0
            };
          }
        })
      })
    })
  };
};

module.exports = { getDB, inMemoryStore, isUsingFirebase: () => !useInMemory };
