const express = require('express')
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")('sk_test_51L1nmNCGpaTt0RU81oq26j6Ta7gwb9pGlOOwxjeXAQgefsXMvmRxFUopKE2St6GDbDpxjUug0KxRyqzL6oKarPcR00lqLjh70r');


// middale ware 
app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.NAME}:${process.env.PASSWORD}@admin.tk0bb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifayJwt(req, res, next) {
      const authHeader = req.headers.authorization

      if (!authHeader) {
            return res.status(401).send({ massage: 'Unauthorization Access' })
      }

      const token = authHeader.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEEN, function (err, decoded) {
            if (err) {
                  return res.status(403).send({ massage: 'Forbidden Access' })
            }
            req.decoded = decoded
            next()
      });

}


async function run() {
      try {
            await client.connect()
            const productCollection = client.db("manufacture").collection("product");
            const bookingCollection = client.db("manufacture").collection("bookings");
            const userCollection = client.db("manufacture").collection("users");
            const reviewCollection = client.db("manufacture").collection("reviwes");
            const profileCollection = client.db("manufacture").collection("myProfile");
            const paymentCollection = client.db("manufacture").collection("payments");


            // create payment maythod 
            app.post('/create-payment-intent', verifayJwt, async (req, res) => {
                  const service = req.body
                  const price = service.price
                  const amount = price * 100

                  const paymentIntent = await stripe.paymentIntents.create({
                        amount: amount,
                        currency: "usd",
                        payment_method_types: ['card']
                  });
                  res.send({ clientSecret: paymentIntent.client_secret })
            })



            // read data -------
            app.get('/product', async (req, res) => {
                  const query = {}
                  const product = await productCollection.find(query).toArray()
                  res.send(product)
            })



            // read data specific ----------
            app.get('/product/:id', async (req, res) => {
                  const id = req.params.id
                  const query = { _id: ObjectId(id) }
                  const result = await productCollection.findOne(query)
                  res.send(result)
            })

            // product add 
            app.post('/product', async (req, res) => {
                  const product = req.body
                  const result = await productCollection.insertOne(product)
                  res.send({ message: "Product Added Successfull!" })
            })

            app.get('/manageProduct', verifayJwt, async (req, res) => {
                  const query = {}
                  const product = await productCollection.find(query).toArray()
                  res.send(product)
            })

            app.delete('/product/:id', verifayJwt, async (req, res) => {
                  const id = req.params.id
                  const query = { _id: ObjectId(id) }
                  const result = await productCollection.deleteOne(query)
                  res.send(result)
            })

            // updateQunetity -----------
            app.put('/products/:id', async (req, res) => {
                  const id = req.params.id
                  const quentity = req.body
                  console.log(quentity);
                  const filter = { _id: ObjectId(id) }
                  const options = { upsert: true };
                  const updateDoc = {
                        $set: {
                              abalivaleQuentity: quentity.newAvailabeQuntity
                        },
                  };
                  const result = await productCollection.updateOne(filter, updateDoc, options);
                  res.send({ message: "done" })

            })

            // order api .....................

            // post oder ------------
            app.post('/booking', verifayJwt, async (req, res) => {
                  const booking = req.body
                  const result = await bookingCollection.insertOne(booking)
                  res.send({ message: "Your Order SuccessFull" })
            })

            // read my order 
            app.get('/booking/:email', verifayJwt, async (req, res) => {
                  const email = req.params.email;
                  const query = { email: email }
                  const product = await bookingCollection.find(query).toArray()
                  res.send(product)
            })

            // manage all order 
            app.get('/manageOrder', verifayJwt, async (req, res) => {
                  const query = {}
                  const product = await bookingCollection.find(query).toArray()
                  res.send(product)
            })

            // read specific 
            app.get('/bookings/:id', verifayJwt, async (req, res) => {
                  const id = req.params.id
                  const query = { _id: ObjectId(id) }
                  const result = await bookingCollection.findOne(query)
                  res.send(result)
            })
            // booking delete 

            app.delete('/booking/:id', async (req, res) => {
                  const id = req.params.id
                  const query = { _id: ObjectId(id) }
                  const result = await bookingCollection.deleteOne(query)
                  res.send(result)
            })
             
            // booking update and payment add 
            app.patch('/booking/:id' , verifayJwt , async (req , res) =>{
                  const id = req.params.id
                  const payment = req.body
                  const filter = {_id: ObjectId(id)}
                  const updateDoc = {
                        $set: {
                              paid: "Paid",
                              transactionId: payment.transactionId
                        }
                  }

                  const result = await bookingCollection.updateOne(filter , updateDoc)
                  const setPayment = await paymentCollection.insertOne(payment)
                  res.send(updateDoc)
            })

            // shipped confrom api 
            
            app.patch('/shipped/:id' , verifayJwt , async (req , res) =>{
                  const id = req.params.id
                  const filter = {_id: ObjectId(id)}
                  const updateDoc = {
                        $set: {
                              paid: "Shipped",
                        }
                  }

                  const result = await bookingCollection.updateOne(filter , updateDoc)
                  res.send(updateDoc)


            })


            // review api ..............
            // review post 
            app.post('/review', verifayJwt, async (req, res) => {
                  const review = req.body
                  const addedReview = await reviewCollection.insertOne(review)
                  res.send({ message: "Your Review Added Successfull" })

            })

            // review read to database 
            app.get('/review', async (req, res) => {
                  const query = {}
                  const review = await reviewCollection.find(query).toArray()
                  res.send(review)
            })


            // myProfile api 
            app.post('/profile', verifayJwt, async (req, res) => {
                  const profile = req.body
                  const setProfile = await profileCollection.insertOne(profile)
                  res.send({ message: "Your Profile Update SuccessFull" })
            })



            // create user ................
            app.put('/user/:email', async (req, res) => {
                  const email = req.params.email
                  const user = req.body
                  const filter = { email: email }
                  const options = { upsert: true };
                  const updateDoc = {
                        $set: user
                  }
                  // create jwt token -----------
                  const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEEN, { expiresIn: '1h' });

                  const result = await userCollection.updateOne(filter, updateDoc, options);

                  res.send({ result, token })
            })

            // get user 
            app.get('/user', verifayJwt, async (req, res) => {
                  const query = {}
                  const user = await userCollection.find(query).toArray()
                  res.send(user)

            })

            // user delete 
            app.delete('/user/:id', async (req, res) => {
                  const id = req.params.id
                  const query = { _id: ObjectId(id) }
                  const result = await userCollection.deleteOne(query)
                  res.send(result)
            })

            // make user admin 
            app.put('/user/admin/:email', verifayJwt, async (req, res) => {
                  const email = req.params.email

                  const adminRequster = req.decoded.email
                  const requestAccount = await userCollection.findOne({ email: adminRequster })

                  if (requestAccount.role === 'admin') {
                        const filter = { email: email }
                        const updateDoc = {
                              $set: { role: 'admin' }
                        }
                        const result = await userCollection.updateOne(filter, updateDoc)
                        res.send(result)

                  }
                  else {
                        res.status(403).send({ message: "forbiden" })
                  }
            })

            // chack admin 
            app.get('/user/:email', async (req, res) => {
                  const email = req.params.email
                  const user = await userCollection.findOne({ email: email })
                  const isAdmin = user.role === 'admin'
                  res.send({ admin: isAdmin })
            })

            // read transactionId 
            app.get('/transetion/:id' , async (req , res) =>{
                  const id = req.params.id
                  const query = {_id: ObjectId(id)}
                  const result = 
                  res.send(result)
            })






      }





      finally {

      }
}
run().catch(console.dir)



app.get('/', (req, res) => {
      res.send('Hello manufactoral!')
})

app.listen(port, () => {
      console.log(`this server is start ${port}`)
})