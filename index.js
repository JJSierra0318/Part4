const http = require('http')
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
//const Blog = require('./models/blog')
const blogRouter = require('./controllers/blogs')


const mongoUrl = 'mongodb+srv://fullstack:WZefGP1i985gGFH5@phonebook.e6lnc.mongodb.net/bloglist-app?retryWrites=true&w=majority'
mongoose.connect(mongoUrl)

app.use(cors())
app.use(express.json())
app.use('/api/blogs', blogRouter)

const PORT = 3003
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})