const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

//Get all blogs
blogRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', {username: 1, name: 1})
  response.json(blogs.map(blog => blog.toJSON()))
})

//Get blog by id
blogRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if(blog) {
    response.json(blog.toJSON())
  } else {
    response.status(404).end()
  }
})

//Post a new blog
blogRouter.post('/', async (request, response, next) => {
  try {
    const body = request.body
    const token = request.token
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!request.token || !decodedToken.id || !decodedToken) {
      return response.status(401).json({ error: 'token missing or invalid '})
    }
    
    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes,
      user: user._id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.json(savedBlog.toJSON())
  } catch (error) {
    next(error)
  }
  
})

//Delete blog by id
blogRouter.delete('/:id', async (request, response, next) => {
  try {
    const blogId = request.params.id
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!request.token || !decodedToken.id || !decodedToken) {
      return response.status(401).json({ error: 'token missing or invalid '})
    }
    const blog = await Blog.findById(blogId)
    const user = await User.findById(decodedToken.id)
    if (user === null || blog === null) return response.status(400).send({error: 'invalid blog or user'})
    console.log(blog.user.toString())
    console.log(user._id.toString())
    if (blog.user.toString() === user._id.toString()){
      await Blog.findByIdAndRemove(blogId)
      response.status(204).end()
    } else {
      return response.status(401).send({error: 'invalid user'})
    }

  } catch(error) {
    next(error)
  }
  
})

blogRouter.put('/:id', async (request, response, next) => {
  const likes = request.body.likes
  try {
    await Blog.findByIdAndUpdate(request.params.id, {likes: likes}, {new: true})
    response.status(204).end()
  } catch (error) {
    next(error)
  }
  
})

module.exports = blogRouter