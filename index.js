require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');




const app = express();
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldoz9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const campaignCollection = client.db("campaignDB").collection("campaigns");
        const donatedCollection = client.db("campaignDB").collection("donations");

        // Read

        // for home page 
        app.get('/homeCampaigns', async (req, res) => {
            const currentDate = new Date();
            const result = await campaignCollection.find({
                deadline: { $gte: currentDate.toISOString().split('T')[0] }
            }).toArray()
            res.send(result)
        })
        // all campaigns
        app.get('/campaigns', async (req, res) => {
            const { sort } = req.query; // Fetch sort order from query params
            console.log('Sort Order:', sort);

            // Determine sort direction
            const sortOrder = sort === "Low to High" ? 1 : sort === "High to Low" ? -1 : null;

            if (sortOrder !== null) {
                // Use aggregation to handle numeric sorting
                const result = await campaignCollection.aggregate([
                    {
                        //ad new field
                        $addFields: {
                            // convert string to number
                            amountNumeric: { $toDouble: "$amount" }, 
                        },
                    },
                    {
                        // sort by numeric value
                        $sort: {
                            amountNumeric: sortOrder,
                        },
                    },
                ]).toArray();

                res.send(result);
            } else {
                // Default fetch without sorting
                const result = await campaignCollection.find().toArray();
                res.send(result);
            }
        })

        //// get campaign emails

        app.get('/myCampaigns', async (req, res) => {
            const email = req.query.email;

            const query = { email: email };
            const result = await campaignCollection.find(query).toArray();
            res.send(result);
        });

        // get campaigns with specfic id

        app.get('/campaigns/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await campaignCollection.findOne(query);
            res.send(result)
        })




        //  Create
        app.post('/campaigns', async (req, res) => {
            const newCampaign = req.body;
            const result = await campaignCollection.insertOne(newCampaign,)
            res.send(result)
        })

        // Update

        app.patch("/campaign/:id", async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const update = {
                $set: {
                    image: data?.image,
                    title: data?.title,
                    type: data?.type,
                    description: data?.description,
                    amount: data?.amount,
                    deadline: data?.deadline
                }
            }
            const result = await campaignCollection.updateOne(query, update, options);
            res.send(result)
        })


        //Delete
        app.delete('/campaign/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId(id) };
            const result = await campaignCollection.deleteOne(query);
            res.send(result)
        })



        // for my donations 

        // app.get('/myDonations', async (req, res) => {
        //     const cursor = donatedCollection.find()
        //     const result = await cursor.toArray();
        //     res.send(result)
        // })

        app.post('/myDonations', async (req, res) => {
            const myDonation = req.body;
            const result = await donatedCollection.insertOne(myDonation)
            res.send(result)
        })

        app.get('/myDonations', async (req, res) => {
            const email = req.query.email;

            const query = { donatedUserEmail: email };
            const result = await donatedCollection.find(query).toArray();
            res.send(result);
        });





        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('fund spring server is running')
});

app.listen(port, () => {
    console.log(`coffee server is running on port : ${port}`);
})