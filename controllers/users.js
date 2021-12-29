const bcrypt = require('bcrypt')
const userRouter = require('express').Router()
const User = require('../models/user')

userRouter.get('/', async (request, response) => {
  const users = await User
    .find({}).populate('blogs')
  response.json(users)
})

userRouter.post('/', async (request, response, next) => {
  const body = request.body
  if (!body.password) return response.status(400).json({ error: 'Path `password` is required' })
  if (body.password.length < 3) return response.status(400).json({ error: 'password length must be 3 or longer' })
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    username: body.username,
    name: body.name,
    passwordHash
  })
  try {
    const savedUser = await user.save()
    response.json(savedUser)
  } catch (error) {
    next(error)
  }
  
})

module.exports = userRouter