const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Base de données] Connexion établie avec succès sur l'hôte : ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Base de données] Erreur de connexion Mongoose : ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Base de données] Connexion Mongoose interrompue.');
    });

    return conn;
  } catch (error) {
    console.error(`[Base de données] Échec critique de connexion : ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[Base de données] Connexion fermée proprement.');
  } catch (error) {
    console.error(`[Base de données] Erreur lors de la fermeture : ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
