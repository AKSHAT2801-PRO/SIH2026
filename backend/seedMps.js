const mongoose = require("mongoose");
require("dotenv").config();

const mp = require("./model/mp");
const data = require("../data/allMps.json");

const seedMps = async () => {
    try {
        await mongoose.connect(process.env.MongoDB_URL);

        console.log("MongoDB connected");

        const existingCount = await mp.countDocuments();

        console.log(`Existing MP records: ${existingCount}`);

        if (existingCount > 0) {
            console.log("MP data already exists. Nothing inserted.");
            process.exit(0);
        }

        await mp.insertMany(data);

        console.log(`Successfully inserted ${data.length} MP records`);

        const finalCount = await mp.countDocuments();

        console.log(`Total MP records now: ${finalCount}`);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding MP data:");
        console.error(error);
        process.exit(1);
    }
};

seedMps();