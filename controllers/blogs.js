const blogRouter = require('express').Router()
const Blog = require('../models/blog')

//Get all blogs
blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  response.json(blogs.map(blog => blog.toJSON()))
})

//Get blog by id
blogRouter.get('/:id', async (request, response) => {
  const blog = await Blog.find(request.params.id)
  if(blog) {
    response.json(blog.toJSON())
  } else {
    response.status(404).end()
  }
})

//Post a new blog
blogRouter.post('/', async (request, response, next) => {
  const body = request.body

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  })

  try {
    const savedBlog = await blog.save()
    response.json(savedBlog.toJSON())
  } catch (error) {
    next(error)
  }
  
})

//Delete blog by id
blogRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

blogRouter.put('/:id', async (request, response, next) => {
  const likes = request.body.likes
  console.log(likes)
  try {
    await Blog.findByIdAndUpdate(request.params.id, {likes: likes}, {new: true})
    response.status(204).end()
  } catch (error) {
    next(error)
  }
  
})

module.exports = blogRouter