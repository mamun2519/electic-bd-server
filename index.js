const express = require('express')
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middale ware 
app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.NAME}:${process.env.PASSWORD}@admin.tk0bb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifayJwt(req , res , next){
      const authHeader = req.headers.authorization

      if(!authHeader){
            return res.status(401).send({ massage: 'Unauthorization Access' })
      }

      const token = authHeader.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEEN, function(err, decoded) {
            if(err){
                  return res.status(403).send({ massage: 'Forbidden Access' })
            }
            req.decoded = decoded
            next()
          });

} 


async function run(){
      try{
            await client.connect()
            const productCollection = client.db("manufacture").collection("product");
            const bookingCollection = client.db("manufacture").collection("bookings");
            const userCollection = client.db("manufacture").collection("users");



            // read data -------
            app.get('/product' , async (req , res)=>{
                  const query = {}
                  const product = await productCollection.find(query).toArray()
                  res.send(product)     
            })

            // read data specific ----------
            app.get('/product/:id' , async (req , res) =>{
                  const id = req.params.id
                  const query = {_id: ObjectId(id)}
                  const result = await productCollection.findOne(query)
                  res.send(result)
            })

            // updateQunetity -----------
            app.put('/products/:id' , async (req , res)=>{
                  const id = req.params.id
                  const quentity = req.body
                  console.log(quentity);
                  const filter = {_id: ObjectId(id)}
                  const options = { upsert: true };
                  const updateDoc = {
                        $set: {
                              abalivaleQuentity: quentity.newAvailabeQuntity
                        },
                      };
                      const result = await productCollection.updateOne( filter, updateDoc, options);
                      res.send({message: "done"})

            })

            // post oder ------------
            app.post('/booking' ,verifayJwt , async (req , res) =>{
                  const booking = req.body
                  const result = await bookingCollection.insertOne(booking)
                  res.send({message: "Your Order SuccessFull"})
            })

            // read my order 
            app.get('/booking/:email' , verifayJwt, async (req , res) =>{
                  const email = req.params.email;
                  const query = {email: email}
                  const product = await bookingCollection.find(query).toArray()
                  res.send(product)
            })

            app.delete('/booking/:id' , async (req , res) =>{
                  const id = req.params.id
                  const query = {id : id}
                  const result = await bookingCollection.deleteOne(query)
                  res.send(result)
            })

            // create user ................
            app.put('/user/:email' , async (req , res) =>{
                  const email = req.params.email
                  const user = req.body
                  const filter = { email : email}
                  const options = { upsert: true };
                  const updateDoc = {
                        $set: user
                  }
                  // create jwt token -----------
                  const token = jwt.sign({email: email}, process.env.ACCESS_TOKEEN  , { expiresIn: '1h' });

                  const result = await userCollection.updateOne(filter, updateDoc, options);

                  res.send({result , token})
                  


            })}


      
      finally{

      }
}
run().catch(console.dir)



app.get('/', (req, res) => {
  res.send('Hello manufactoral!')
})

app.listen(port, () => {
  console.log(`this server is start ${port}`)
})