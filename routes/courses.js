const { Router } = require('express')
const router = new Router()
const db = require('../database')
const resultChecker = require('../models/resultChecker')

router.get('/', async (req, res) => {
	const coursesQuery = await db.query('SELECT * FROM  courses')
	const courses = coursesQuery.rows
	res.render('courses', {
		title: 'Courses',
		isCourses: true,
		courses
	})
})
router.get('/:id', async (req, res) => {
	const id = req.params.id
	const courseQuery = await db.query(`SELECT * FROM  courses WHERE id = ${id}`)
	const course = courseQuery.rows[0]
	res.render('course', {
		layout: 'main',
		title: `Course ${course.title}`,
		course
	})
})
router.get('/:id/theory', async (req, res) => {
	const id = req.params.id
	const courseQuery = await db.query(`SELECT * FROM  courses WHERE id = ${id}`)
	const course = courseQuery.rows[0]
	res.render('theory', {
		layout: 'main',
		title: `${course.title} Theory`,
		course
	})
})
router.get('/:id/practice', async (req, res) => {
	const levels = (await db.query(`select DISTINCT level from course_levels where course_id =${req.params.id} order by 1`)).rows
	const course = (await db.query(`SELECT * FROM  courses WHERE id = ${req.params.id}`)).rows[0]
	for (let i = 0; i < levels.length; i++) {
		const description = () => {
			if (levels[i].level === 1) {
				return 'Basic level'
			} else if (levels[i].level === 2) {
				return 'Intermidiate'
			} else {
				return 'Hard level'
			}
		}
		levels[i] = {
			level: levels[i].level,
			description: description
		}
	}
	res.render('practiceLevelsList', {
		layout: 'main',
		title: `${course.title}`,
		levels

	})
})
router.get('/:id/practice/:difficulty', async (req, res) => {
	const courseId = req.params.id
	const testDifficulty = req.params.difficulty
	const courseQuery = await db.query(`SELECT * FROM  courses WHERE id = ${courseId}`)
	const course = courseQuery.rows[0]
	const tickets = (await db.query(`SELECT question, tickets.id, answer, guess1, guess2, guess3, course_level, category, explanation from tickets INNER Join course_levels on tickets.course_level = course_levels.id Where course_id = ${courseId} and level = ${testDifficulty}`)).rows
	res.render('practice', {
		layout: 'main',
		title: `${course.title}'s practice`,
		course,
		tickets

	})
})
router.post('/:id/practice/:difficulty', async (req, res) => {
	const results = await resultChecker.check(req.params.id, req.body)
	res.render('practiceResults', {
		layout: 'main',
		title: 'Practice results',
		results

	})
})
router.get('/:id/exam', async (req, res) => {
	const levels = (await db.query(`select DISTINCT level from course_levels where course_id =${req.params.id} order by 1`)).rows
	const course = (await db.query(`SELECT * FROM  courses WHERE id = ${req.params.id}`)).rows[0]
	res.render('examLevelsList', {
		layout: 'main',
		title: `${course.title}`,
		levels

	})
})
router.get('/:id/exam/:difficulty', async (req, res) => {
	const courseId = req.params.id
	const testDifficulty = req.params.difficulty
	const courseQuery = await db.query(`SELECT * FROM  courses WHERE id = ${courseId}`)
	const course = courseQuery.rows[0]
	const tickets = (await db.query(`SELECT question, tickets.id, answer, guess1, guess2, guess3, course_level, category, explanation from tickets INNER Join course_levels on tickets.course_level = course_levels.id Where course_id = ${courseId} and level = ${testDifficulty}`)).rows
	res.render('exam', {
		layout: 'main',
		title: `${course.title}'s exam`,
		course,
		tickets

	})
})
router.post('/:id/exam/:difficulty', async (req, res) => {
	const userId = 1
	const results = await resultChecker.check(req.params.id, req.body)
	const courseLevelId = (await db.query(`SELECT id FROM course_levels WHERE course_id = ${req.params.id} and level = ${req.params.difficulty}`)).rows[0].id
	const completeness = results.stats.completeness
	const integrity = results.stats.integrity
	const skills = results.stats.skills
	const avg = ((completeness + integrity + skills) / 3).toFixed(3)
	const grade = (completeness * integrity * skills === 0)
		? 2
		: () => {
			if (avg <= 0.5) { return 2 } else if (avg <= 0.63) { return 3 } else if (avg <= 0.74) { return 4 } else return 5
		}
	const passedThisLevel = (await db.query(`SELECT * FROM user_grades WHERE user_id = ${userId} and course_level_id = ${courseLevelId}`)).rows
	console.log(passedThisLevel)
	if (passedThisLevel.length) {
		await db.query(`UPDATE user_grades SET completeness = ${completeness}, integrity = ${integrity}, skills = ${skills} where user_id = ${userId} and course_level_id = ${courseLevelId} `)
	} else {
		await db.query(`INSERT INTO user_grades (user_id, course_level_id, completeness, integrity, skills) VALUES (${userId},${courseLevelId},${completeness},${integrity},${skills})`)
	}

	res.render('examResults', {
		layout: 'main',
		title: 'Exam results',
		results,
		avg,
		grade
	})
})
module.exports = router
