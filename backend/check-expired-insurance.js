const mongoose = require('mongoose');
const ServiceProvider = require('./models/ServiceProvider');
require('dotenv').config();

async function checkExpiredInsurance() {
    try {
        // Connecting to MongoDB...
        await mongoose.connect(process.env.MONGODB_URI);
        // Connected successfully

        const expiredProviders = await ServiceProvider.find({
            'insurance.expiryDate': { $lt: new Date() }
        }).select('businessName insurance.expiryDate');

        // Found expired providers (output removed)
        // expiredProviders.forEach(provider => {
        //   (output removed)
        // });

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        // Error occurred; exit with failure
        process.exit(1);
    }
}

checkExpiredInsurance();
