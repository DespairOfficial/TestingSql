const db = require('../database.js')

class ResChecker {
	async check (courseId, testResults) {
		const categoriesCounter = {
			completeness: 0,
			integrity: 0,
			skills: 0
		}
		const categoriesRightCounter = {
			completeness: 0,
			integrity: 0,
			skills: 0
		}
		const tickets = []
		for (const ticket in testResults) {
			const getAnswerQuery = await db.query(`SELECT answer, question, category, explanation FROM tickets WHERE id = ${ticket}`)
			const answer = getAnswerQuery.rows[0].answer
			const category = getAnswerQuery.rows[0].category
			categoriesCounter[category] += 1

			if (testResults[ticket] === answer) {
				categoriesRightCounter[category] += 1
			}
			tickets.push({
				id: ticket,
				question: getAnswerQuery.rows[0].question,
				givenAnswer: testResults[ticket],
				isRight: testResults[ticket] === answer,
				rightAnswer: answer,
				explanation: getAnswerQuery.rows[0].explanation
			})
		}
		const completeness = categoriesRightCounter.completeness / categoriesCounter.completeness ? categoriesRightCounter.completeness / categoriesCounter.completeness : 0
		const integrity = categoriesRightCounter.integrity / categoriesCounter.integrity ? categoriesRightCounter.integrity / categoriesCounter.integrity : 0
		const skills = categoriesRightCounter.skills / categoriesCounter.skills ? categoriesRightCounter.skills / categoriesCounter.skills : 0
		const results = {
			tickets,
			stats: {
				completeness: completeness,
				integrity: integrity,
				skills: skills
			}
		}

		return results
	}
}
const resCheck = new ResChecker()
module.exports = resCheck
