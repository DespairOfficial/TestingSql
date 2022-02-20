const { Router } = require('express')
const router = new Router()

router.get('/', async (req, res) => {
	res.render('index', {
		title: 'Main page',
		isHome: true
	})
})
module.exports = router
