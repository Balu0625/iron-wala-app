
const admin = require('firebase-admin');

// Initialize the app with a service account, granting admin privileges
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function populateConfig() {
    try {
        const configRef = db.collection('config').doc('fees');
        await configRef.set({
            serviceFee: 15,
            discount: 10,
        });
        console.log('Successfully populated config with service fee and discount.');
    } catch (error) {
        console.error('Error populating config:', error);
    }
}

populateConfig();
