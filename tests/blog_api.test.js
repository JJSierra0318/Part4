const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../app')
const Blog =require('../models/blog')
const helper = require('./test_helper')
const api = supertest(app)

describe ('when there is initially some blogs saved', () => {

  beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObject = helper.initialBlogs
      .map(blog => new Blog(blog))
    const promiseArray = blogObject.map(blog => blog.save())
    await Promise.all(promiseArray)
  })

  test('notes are returned as JSON', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('the correct number of blogs is returned', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body.length).toBe(helper.initialBlogs.length)
  })

  test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')
    const contents = response.body.map(b => b.title)
    expect(contents).toContain('First Blog Saved')
  })

  test('blog unique identifier is defined as id', async () => {
    const response = await api.get('/api/blogs')

    const content = response.body[0]
    expect(content.id).toBeDefined()
  })

  describe('adding a new blog', () => {

    test('is succesfull when data is valid', async () => {
      const newBlog = {
        title: 'Third Blog Saved',
        author: 'Juan José Mejía',
        url: 'https://examplethree.com',
        likes: 0
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1)

      const contents = blogsAtEnd.map(blog => blog.title)
      expect(contents).toContain(
        'Third Blog Saved'
      ) 
    })

    test('without likes component', async () => {
      const newBlog = {
        title: 'Third Blog Saved',
        author: 'Juan José Mejía',
        url: 'https://examplethree.com'
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1)
  
      const contents = blogsAtEnd.map(blog => blog.title)
      expect(contents).toContain(
        'Third Blog Saved'
      ) 
    })

    test('fails with status code 400 if data is invalid', async () => {
      const newBlog = {
        url: 'https://examplethree.com',
        likes: 1
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
    })
  })

  describe('removing a blog', () => {
    
    test('succeeds with status code 204 if id is valid', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]
      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(blogsAtStart.length - 1)
    })

    test('fails with status code 400 if is is invalid', async () => {
      const invalidId = await helper.nonExistingId()
      await api
        .delete(`/api/blogs/${invalidId}`)
        .expect(204)
      
      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
    })
  })

  describe('updating the likes of a blog', () => {

    test('succeeds when given a valid id and parameters', async () => {
      const blogAtStart = await helper.blogsInDb()
      const blogToUpdate = blogAtStart[0]

      const updatedLikes = {
        likes: 10
      }

      await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedLikes)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd[0].likes).toEqual('10')
    })

    test('fails when given a invalid id', async () => {
      const invalidId = await helper.nonExistingId()
      
      const updatedLikes = {
        likes: 10
      }

      await api
        .put(`/api/blogs/${invalidId}`)
        .send(updatedLikes)
        .expect(204)
    })
  })
})


afterAll(() => {
  mongoose.connection.close()
})