const _ = require('lodash')

// eslint-disable-next-line no-unused-vars
const dummy = (blog) => {
  return 1
}

const totalLikes = (blogs) => {
  if (!blogs) return 0

  let total = 0
  blogs.map(blog => {
    total += blog.likes
  })

  return total
}

const favoriteBlog = (blogs) => {
  if (!blogs) return 0

  const mostLikes = {
    title: '',
    author: '',
    likes: 0
  }

  blogs.map(blog => {
    if (blog.likes > mostLikes.likes) {
      mostLikes.title = blog.title
      mostLikes.author = blog.author
      mostLikes.likes = blog.likes
    }
  })

  return mostLikes
}

const mostBlogs = (blogs) => {
  if (!blogs) return 0

  const authorsObject = _.countBy(blogs, 'author')

  const authorIndex = _.indexOf(Object.values(authorsObject), _.max(Object.values(authorsObject)))

  const selectedAuthor = {
    author: Object.keys(authorsObject)[authorIndex],
    blogs: Object.values(authorsObject)[authorIndex]
  }

  return selectedAuthor
}

const mostLikes = (blogs) => {
  if (!blogs) return 0

  const authors = []
  const likes = []

  _.forEach(blogs, (blog) => {
    if (authors.includes(blog.author)) {
      let authorIndex = authors.indexOf(blog.author)
      likes[authorIndex] += blog.likes
    } else {
      authors.push(blog.author)
      likes.push(blog.likes)
    }
  })
  
  const authorIndex = likes.indexOf(_.max(likes))
  const selectedAuthor = {
    author: authors[authorIndex],
    likes: likes[authorIndex]
  }

  return selectedAuthor
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}