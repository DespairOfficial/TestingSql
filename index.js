const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const homeRoutes = require('./routes/home')
const coursesRoutes = require('./routes/courses')
const profileRoutes = require('./routes/profile')
const Handlebars = require('handlebars')

const app = express()
const hbs = exphbs.create({
	defaultLayout: 'main',
	extname: 'hbs'
})

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, '/public')))
app.use(express.urlencoded({ extended: true })) // а это зачем...

hbs.handlebars.registerHelper('guesses', function (ticket) {
	const arrNotRand = [ticket.answer, ticket.guess1, ticket.guess2, ticket.guess3]
	const arrRand = []
	while (arrNotRand.length > 0) {
		if (Math.random() > 0.5) {
			const removed = arrNotRand.splice(Math.random() * arrNotRand.length, 1)
			const re = /"/gi
			arrRand.push(removed[0].replace(re, '&quot;'))
		}
	}
	return new Handlebars.SafeString(`
      <p>
        <label>
          <input lass="group1" name="${ticket.id}" type="radio" value="${arrRand[0]}" checked />
          <span>${arrRand[0]}</span>
        </label>
      </p>
      <p>
        <label>
          <input lass="group1" name="${ticket.id}" type="radio" value="${arrRand[1]}"/>
          <span>${arrRand[1]}</span>
        </label>
      </p>
      <p>
        <label>
          <input class="group1" name="${ticket.id}" type="radio"  value="${arrRand[2]}"/>
          <span>${arrRand[2]}</span>
        </label>
      </p>
      <p>
        <label>
          <input  class="group1" name="${ticket.id}" type="radio"  value="${arrRand[3]}"/>
          <span>${arrRand[3]}</span>
        </label>
      </p>`)
})

app.use('/', homeRoutes) // home routes stored there
app.use('/courses', coursesRoutes)
app.use('/profile', profileRoutes)

const PORT = process.env.PORT ?? 3000

async function start () {
	try {
		app.listen(PORT, () => {
			console.log(`Server has been started on port ${PORT}...`)
		})
	} catch (e) {
		console.log(e)
	}
}
start()
