const mongoose = require('mongoose');
const ServiceProvider = require('./models/ServiceProvider');
require('dotenv').config();

async function checkExpiredInsurance() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully');

        const expiredProviders = await ServiceProvider.find({
            'insurance.expiryDate': { $lt: new Date() }
        }).select('businessName insurance.expiryDate');

        console.log(`Found ${expiredProviders.length} providers with expired insurance:`);
        expiredProviders.forEach(provider => {
            console.log(`- ${provider.businessName}: expires ${provider.insurance.expiryDate}`);
        });

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkExpiredInsurance();
