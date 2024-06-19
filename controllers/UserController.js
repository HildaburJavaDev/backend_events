const APIErrors = require("../errors/APIErrors");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const sequelize = require('../db');
const { User, UserRole } = require("../models/models");
const { where } = require("sequelize");

const generateJwt = (id, role_id) => {
	return jwt.sign(
		{ id, role_id },
		process.env.SECRET_KEY,
		{ expiresIn: '24h' }
	)
}

class UserController {
	async login(req, res, next) {
		try {
			const { phoneNumber, password } = req.body;
			const user = await User.findOne({ where: { phoneNumber } });
			if (!user) {
				console.log("not exists")
				return next(APIErrors.badRequest('Пользователь с таким номером не найден'))
			}
			if (!bcrypt.compareSync(password, user.password)) {
				console.log("bad password!")
				return res.status(401).json({ message: 'Неверный пароль' });
			}
			const token = generateJwt(user.id, user.role_id)
			return res.json({ token })
		} catch (error) {
			console.log(error.message)
			return next(APIErrors.badRequest('SQL Failed'))
		}
	}

	async getProfile(req, res, next) {
		try {
			console.log(req.user)
			return res.json(await User.findByPk(req.user.id, {
				attributes: { exclude: ['id', 'password', 'role_id'] }
			}))
		} catch (error) {
			console.log(error.message)
			return next(APIErrors.badRequest('SQL Failed'))
		}
	}

	async updateProfile(req, res, next) {
		try {
			const { firstname, lastname, patronimyc, email, phoneNumber } = req.body;
			const userId = req.user.id;
	
			const updatedUser = await User.update(
				{ firstname, lastname, patronimyc, email, phoneNumber },
				{ where: { id: userId } }
			);
			if (updatedUser[0] === 1) {
				res.status(200).json({ message: 'Профиль пользователя успешно обновлен' });
			} else {
				res.status(400).json({ error: 'Не удалось обновить профиль пользователя' });
			}
		} catch (error) {
			console.error(error.message);
			res.status(500).json({ error: 'Внутренняя ошибка сервера' });
		}
	}

	async registration(req, res, next) {
		try {
			const { firstname, lastname, patronimyc, phoneNumber, email, password } = req.body
			if (!email || !password || !firstname || !lastname || !phoneNumber) {
				return next(APIErrors.badRequest('Введены не все данные'))
			}
			const candidate = await User.findOne({ where: { phoneNumber } })
			if (candidate) {
				return next(APIErrors.badRequest('Пользователь с таким номером телефона уже существует'))
			}
			const hashPassword = await bcrypt.hash(password, 5)
			const roleId = await UserRole.findOne({
				where: {
					role_name: 'user'
				}
			})
			const user = await User.create({
				firstname: firstname,
				lastname: lastname,
				email: email,
				password: hashPassword,
				phoneNumber: phoneNumber,
				patronimyc: patronimyc,
				role_id: roleId.id
			})
			return res.json(user)
		} catch (error) {
			console.log(error)
			return next(APIErrors.internalQuery('SQL Failed'))
		}
	}

	async registrationEmployee(req, res, next) {
		const { firstname, lastname, patronimyc, phoneNumber, email, password, role_id } = req.body
		console.log(req.body)
		if (!email || !password || !firstname || !lastname || !phoneNumber || !role_id) {
			console.log(1)
			return next(APIErrors.badRequest('Введены не все данные'))
		}
		const candidate = await User.findOne({ where: { phoneNumber } })
		if (candidate) {
			console.log(2)
			return next(APIErrors.badRequest('Пользователь с таким номером телефона уже существует'))
		}
		const hashPassword = await bcrypt.hash(password, 5)
		const user = await User.create({
			firstname: firstname,
			lastname: lastname,
			email: email,
			password: hashPassword,
			phoneNumber: phoneNumber,
			patronimyc: patronimyc,
			role_id: role_id
		})
		return res.json(user)
	}


	async update(req, res, next) {
		try {
			const { firstname, lastname, patronimyc, phoneNumber, email } = req.body;
			const user = await User.findOne({ where: { id: req.user.id } });
			const updatedUser = await User.update(
				{
					firstname,
					lastname,
					patronimyc,
					phoneNumber,
					email
				},
				{ where: { id: req.user.id } }
			);
			return res.json(updatedUser);
		} catch (error) {
			console.error(error);
			return next(APIErrors.internalQuery('Ошибка при обновлении данных пользователя'));
		}
	}

	async getRoles(req, res, next) {
		try {
			return res.json(await UserRole.findAll())
		} catch (error) {
			return next(APIErrors.internalQuery('Ошибка'));
		}
	}


	async getUserById(req, res, next) {
		console.log("here")
		try {
			const userId = req.user.id;
			const user = await User.findByPk(userId, {
				attributes: { exclude: ['id', 'role_id', 'password'] }
			});
			if (!user) {
				return res.status(404).json({ message: 'Пользователь не найден' });
			}
			res.json(user);
		} catch (error) {
			console.error(error);
			next(APIErrors.internalQuery('Failed to fetch user'));
		}
	}

}

module.exports = new UserController()