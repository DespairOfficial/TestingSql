const { Router } = require('express')
const db = require('../database')
const router = new Router()

router.get('/', async (req, res) => {
	const userId = 1
	const user = (await db.query(`SELECT * FROM users where id = ${userId}`)).rows[0]
	const username = user.name
	const userData = (await db.query(`SELECT * FROM user_grades where user_id = ${userId}`)).rows
	const courses = (await db.query('SELECT * FROM courses')).rows
	let avgCompleteness = 0
	let avgIntegrity = 0
	let avgSkills = 0

	userData.forEach(element => {
		avgCompleteness += element.completeness
		avgIntegrity += element.integrity
		avgSkills += element.skills
	})

	avgCompleteness = avgCompleteness / userData.length
	avgIntegrity = avgIntegrity / userData.length
	avgSkills = avgSkills / userData.length
	const percent = ((avgCompleteness + avgIntegrity + avgSkills) / 3).toFixed(3)
	const isCertificate = percent >= 0.6
	const today = new Date()
	const dateTime = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()

	const coursesResults = []

	await Promise.all(courses.map(async (course) => {
		let completeness = 0
		const completenesses = (await db.query(`SELECT * FROM user_grades join course_levels on user_grades.course_level_id = course_levels.id where course_levels.course_id = ${course.id} and user_id = ${userId}`)).rows
		completenesses.forEach((element) => {
			completeness += element.completeness
		})

		completeness /= ((await db.query(`SELECT COUNT(*) FROM user_grades join course_levels on user_grades.course_level_id = course_levels.id where course_levels.course_id = ${course.id} and user_id = ${userId}`)).rows[0]).count

		let integrity = 0
		const integrities = (await db.query(`SELECT * FROM user_grades join course_levels on user_grades.course_level_id = course_levels.id where course_levels.course_id = ${course.id} and user_id = ${userId}`)).rows
		integrities.forEach((element) => {
			integrity += element.integrity
		})
		integrity /= ((await db.query(`SELECT COUNT(*) FROM user_grades join course_levels on user_grades.course_level_id = course_levels.id where course_levels.course_id = ${course.id} and user_id = ${userId}`)).rows[0]).count

		let skills = 0
		const skillses = (await db.query(`SELECT * FROM user_grades join course_levels on user_grades.course_level_id = course_levels.id where course_levels.course_id = ${course.id} and user_id = ${userId}`)).rows
		skillses.forEach((element) => {
			skills += element.skills
		})
		skills /= ((await db.query(`SELECT COUNT(*) FROM user_grades join course_levels on user_grades.course_level_id = course_levels.id where course_levels.course_id = ${course.id} and user_id = ${userId}`)).rows[0]).count

		const userData = (await db.query(`SELECT * FROM user_grades join course_levels on user_grades.course_level_id = course_levels.id where user_id = ${userId} and course_levels.course_id = ${course.id} ORDER BY course_levels.level`)).rows

		const levelItems = []
		await Promise.all(userData.map((level) => (
			levelItems.push({
				id: level.id,
				level: level.level,
				course: level.course_id,
				completeness: level.completeness,
				integrity: level.integrity,
				skills: level.skills
			})
		)))

		coursesResults.push({
			course: {
				id: course.id,
				name: course.title,
				completeness: completeness,
				integrity: integrity,
				skills: skills
			},
			levelItems: levelItems
		})
	}))
	const coursesDiagrams = []
	coursesResults.forEach((course) => {
		const inCoursesDiagrams = []
		course.levelItems.forEach((item) => {
			inCoursesDiagrams.push(`
			        <div style="display: flex; flex-direction: column;">
			            <p><h2 style="text-align:center"><a class="level_ref" href="/courses/${item.course}/practice/${item.level}">Level ${item.level}</a></h2></p>
		
			            <div style="border:1px solid #ccc; width:500px; height:500px;padding:5px; margin: 10px"; >
			                <canvas  class="cv" id="${item.id}Chart" width="250" height="250"></canvas>
			            </div>
			        </div>
			    <script>
		
			        var level_${item.level}Canvas = document.getElementById("${item.id}Chart").getContext("2d");
			        var radar = new Chart(level_${item.level}Canvas, {
			            type: 'radar',
			            data: {
			                labels: ["Completeness" , "Integrity"  , "Skills" ],
			                datasets: [{
			                label: 'Grades',
			                data: [${item.completeness},${item.integrity}, ${item.skills}],
			                backgroundColor: [
			                    'rgba(255, 99, 132, 0.6)',
			                    'rgba(255, 206, 86, 0.6)'
			                ]
			                }]
			            },
			            options: {
			                plugins: {
			                    legend: {
			                        labels: {
			                            // This more specific font property overrides the global property
			                            font: {
			                                size: 24
			                            }
			                        }
			                    }
			                },
			                scales: {
			                    r: {
			                        pointLabels: {
			                            font: {
			                                size: 20
			                            }
			                        }
			                    }
			                },
			                scale:{
			                    ticks: {
			                        display: false,
			                        beginAtZero: true
			                      },
			                    pointLabels: { fontSize: 20 } ,
			                    reverse: false,
			                    r :{
			                        angleLines: {
			                            display: false
			                        },
			                        beginAtZero: true,
			                        min: 0,
			                        max: 1
			                    }
			                }
			            }
			        });
		
			        </script>
			    `)
		})
		const avgDiagram = `
		<div style="display: flex; flex-direction: column;">
			<p><h2 style="text-align:center"><a href="/courses/${course.course.id}">${course.course.name}</a></h2></p>

			<div style="border:1px solid #ccc; width:500px; height:500px;padding:5px; margin: 10px"; >
				<canvas  class="cv" id="${course.course.name}Chart" width="250" height="250"></canvas>
			</div>
		</div>
	<script>

		var ${course.course.name}Canvas = document.getElementById("${course.course.name}Chart").getContext("2d");
		var radar = new Chart(${course.course.name}Canvas, {
			type: 'radar',
			data: {
				labels: ["Completeness" , "Integrity"  , "Skills" ],
				datasets: [{
				label: 'Grades',
				data: [${course.course.completeness},${course.course.integrity}, ${course.course.skills}],
				backgroundColor: [
					'rgba(100, 255, 132, 0.6)',
					'rgba(255, 99, 132, 0.6)',
					'rgba(255, 206, 86, 0.6)'

				]
				}]
			},
			options: {
				plugins: {
					legend: {
						labels: {
							// This more specific font property overrides the global property
							font: {
								size: 24
							}
						}
					}
				},
				scales: {
					r: {
						pointLabels: {
							font: {
								size: 20
							}
						}
					}
				},
				scale:{
					ticks: {
						display: false,
						beginAtZero: true
					  },
					pointLabels: { fontSize: 20 } ,
					reverse: false,
					r :{
						angleLines: {
							display: false
						},
						beginAtZero: true,
						min: 0,
						max: 1
					}
				}
			}
		});

		</script>
	`
		coursesDiagrams.push({
			avgDiagram: avgDiagram,
			levelsDiagrams: inCoursesDiagrams
		})
	})
	res.render('profile', {
		title: 'Profile',
		isProfile: true,
		avgCompleteness,
		avgIntegrity,
		avgSkills,
		username,
		coursesDiagrams,
		percent,
		dateTime,
		isCertificate
	})
})
module.exports = router
