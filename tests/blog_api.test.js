const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../app')
const helper = require('./test_helper')
const api = supertest(app)
const bcrypt = require('bcrypt')
const Blog = require('../models/blog')
const User = require('../models/user')
jest.setTimeout(10000)

//Blog tests
describe ('when there is initially some blogs saved', () => {

  beforeEach(async () => {
    await User.deleteMany({})
    await Blog.deleteMany({})

    const passwordHash = await bcrypt.hash('passw0rd', 10)
    const user = new User({ username: 'firstUser', passwordHash })
    await user.save()

    await Blog.insertMany(helper.initialBlogs)

    const savedUsers = await helper.usersInDb()
    const savedBlogs = await helper.blogsInDb()

    const firstBlogId = savedBlogs[0].id

    await Blog.findByIdAndUpdate(firstBlogId, {user: savedUsers[0].id}, {new: true})
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

      const login = await api
        .post('/api/login')
        .send({ username: 'firstUser', password: 'passw0rd' })
        .expect(200)

      const token = login.body.token

      const newBlog = {
        title: 'Third Blog Saved',
        author: 'Juan José Mejía',
        url: 'https://examplethree.com',
        likes: 0
      }

      await api
        .post('/api/blogs')
        .set('Authorization', 'Bearer ' + token)
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

      const login = await api
        .post('/api/login')
        .send({ username: 'firstUser', password: 'passw0rd' })
        .expect(200)

      const token = login.body.token

      const newBlog = {
        title: 'Third Blog Saved',
        author: 'Juan José Mejía',
        url: 'https://examplethree.com'
      }

      await api
        .post('/api/blogs')
        .set('Authorization', 'Bearer ' + token)
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
      const login = await api
        .post('/api/login')
        .send({ username: 'firstUser', password: 'passw0rd' })
        .expect(200)

      const token = login.body.token

      const newBlog = {
        url: 'https://examplethree.com',
        likes: 1
      }

      await api
        .post('/api/blogs')
        .set('Authorization', 'Bearer ' + token)
        .send(newBlog)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
    })

    test('fails if the user is not logged in', async () => {
      const newBlog = {
        title: 'A new Blog',
        author: 'Juan José S',
        url: 'https://examplethree.com',
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
    })
  })

  describe('removing a blog', () => {
    
    test('succeeds with status code 204 if id is valid', async () => {
      const login = await api
        .post('/api/login')
        .send({ username: 'firstUser', password: 'passw0rd' })
        .expect(200)

      const token = login.body.token

      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', 'Bearer ' + token)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(blogsAtStart.length - 1)
    })

    test('fails with status code 400 if id is invalid', async () => {
      const login = await api
        .post('/api/login')
        .send({ username: 'firstUser', password: 'passw0rd' })
        .expect(200)

      const token = login.body.token

      const invalidId = await helper.nonExistingId()
      await api
        .delete(`/api/blogs/${invalidId}`)
        .set('Authorization', 'Bearer ' + token)
        .expect(400)
      
      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(helper.initialBlogs.length)
    })

    test('fails when the user has no token', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(401)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd.length).toBe(blogsAtStart.length)
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

//Users tests
describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('passw0rd', 10)
    const user = new User({ username: 'firstUser', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username ', async () => {
    const usersAtStar = await helper.usersInDb()

    const newUser = {
      username: 'SecondUser',
      name: 'LittleV',
      password: 'passw1rd'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStar.length + 1)

    const usernames = usersAtEnd.map(user => user.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails if username is already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'firstUser',
      name: 'sometihgCreative',
      password: 'passw2rd'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails if username is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      name: 'thisWillFail',
      password: 'passw2rd'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Path `username` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails if password is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'nowThePasswordIsMissing',
      name: 'thisWillFail',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Path `password` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})