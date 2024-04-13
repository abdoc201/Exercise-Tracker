const express = require('express')
const app = express()
const cors = require('cors')
const { json, type } = require('express/lib/response')
const bodyParser = require('body-parser')
require('dotenv').config()
const mongoose = require('mongoose')
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: String
})
const exercisesSchema = new mongoose.Schema({
  user_id: {type:String , required: true},
  description: String,
  duration: Number,
  date: Date
})

const User = mongoose.model("User",userSchema)
const Exercise = mongoose.model("Exercise",exercisesSchema)

app.post('/api/users',async (req,res)=>{
  const responseObject = new User({
      username: req.body.username
  })
  try {
    const user = await responseObject.save()
    res.json(user)
  } catch(err){
    console.log(err)
  }}
)

app.get('/api/users',async(req,res)=>{
  const users = await User.find()
  if(!users)
    res.send("no users!")
  else 
  res.send(users)
})

app.post('/api/users/:_id/exercises',async(req,res)=>{
  req.body.date = req.body.date?req.body.date:new Date().toDateString()
  try{
    const user = await User.findById(req.params._id)
    if(!user) {
      res.json({
            error: "this user does not existe"
          })
    }
    else {
      const responseObject = new Exercise({
        user_id: user._id,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date
      })
      const exercise = await responseObject.save()
      res.json({
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
        _id: user._id
      })
    }
  }catch(err){
    console.log(err)
  }
})

app.get('/api/users/:_id/logs',async (req,res)=>{
  const {from ,to ,limit} = req.query
  const user = await User.findById(req.params._id)
  if(!user){
    res.json({
      error: "could not find this user"
    })
    return;
  }
  let dateObj = {}
  if(from){
    dateObj["$gte"] = new Date(from)
  }
  if(to){
    dateObj["$lte"] = new Date(to)
  }
  filter = {
    user_id: req.params._id
  }
  if(from || to){
    filter.date = dateObj
  }
  const exercises = await Exercise.find(filter).limit(+limit ?? 10)
  const log = exercises.map(it=>({
    description: it.description,
    duration: it.duration,
    date: it.date.toDateString()
  }))

  res.json({
    _id: user._id,
    username: user.username,
    count: exercises.length,
    log: log
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
