const Router = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware')
const router = new Router()

const eventController = require('../controllers/EventController')

router.get('/', authMiddleware, eventController.getAll)
router.get('/active', authMiddleware, eventController.getActiveEvents)
router.get('/history', authMiddleware, eventController.getPastEvents)
router.get('/:eventId', authMiddleware, eventController.getOne)
router.patch('/', authMiddleware, eventController.updateEvent)
router.patch('/changeregister', authMiddleware, eventController.changeRegistrationOpenned)
router.post('/create', authMiddleware, eventController.createEvent)
router.post('/:eventId/reg', authMiddleware, eventController.registerOnEvent)
router.post('/:eventId/confirmUser', checkRoleMiddleware(['admin', 'employee']), eventController.confirmUser)
router.post('/getstats', authMiddleware, eventController.getStatsByEvent)
module.exports = router