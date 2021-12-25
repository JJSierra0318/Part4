const Blog = require('../models/blog')

const initialBlogs = [
  {
    title: 'First Blog Saved',
    author: 'Juan José Sierra',
    url: 'https://exampleone.com',
    likes: 13
  },
  {
    title: 'Second Blog Saved',
    author: 'José Juan Mejía',
    url: 'https://exampletwo.com',
    likes: 5
  }
]

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const nonExistingId = async () => {
  const blog = new Blog({
    title: 'temporal',
    author: 'temporal',
    url: 'temporal',
    likes: 'temporal'
  })
  await blog.save()
  await blog.remove()

  return blog._id.toString()
}

module.exports = {
  initialBlogs,
  blogsInDb,
  nonExistingId
}