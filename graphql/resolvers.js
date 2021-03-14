const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { UserInputError, AuthenticationError } = require("apollo-server");
const jwt = require("jsonwebtoken");

const { User } = require("../models");
const { JWT_SECRET } = require("../config/env.json");

module.exports = {
  Query: {
    getUsers: async (_, __, context) => {
      let token, user;
      try {
        if (context.req && context.req.headers.authorization) {
          token = context.req.headers.authorization.split("Bearer ")[1];

          jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
            if (err) {
              throw new AuthenticationError("Unauthenticated");
            }
            user = decodedToken;
            console.log(user);
          });
        }
        const users = await User.findAll({
          where: { username: { [Op.ne]: user.username } },
        });
        return users;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    login: async (_, { username, password }) => {
      // Check and compare against database record
      let errors = {};
      try {
        if (username.trim() === "")
          errors.username = "username must not be empty";
        if (password.trim() === "")
          errors.password = "password must not be empty";

        if (Object.keys(errors).length > 0)
          throw new UserInputError("Bad input", { errors });

        const user = await User.findOne({ where: { username } });
        if (!user) {
          errors.username = "User not found";
          throw new UserInputError("user not found", { errors });
        }

        //check if password matches
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          errors.password = "Password is incorrect";
          throw new AuthenticationError("password is incorrect", { errors });
        }
        // this means user is valid we need to issue a token
        const token = jwt.sign(
          {
            username,
          },
          JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );
        //here if we return "user" directly then sequelize will convert
        // to json otherwise we manually call toJSON to conver
        return {
          ...user.toJSON(),
          createdAt: user.createdAt.toISOString(),
          token,
        };
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
  },
  Mutation: {
    register: async (
      parent,
      { username, email, password, confirmPassword },
      context,
      info
    ) => {
      let errors = {};
      try {
        // TODO : Validate Input data
        if (email.trim() === "") errors.email = "Email must not be empty";
        if (username.trim() === "")
          errors.username = "Username must not be empty";
        if (password.trim() === "")
          errors.password = "Password must not be empty";
        if (confirmPassword.trim() === "")
          errors.confirmPassword = "Repeat password must not be empty";

        // TODO : Check if username/ email already exists
        // const userNameOrEmailTaken = await User.findOne({
        //   where: {
        //     [Op.or]: [{ username }, { email }],
        //   },
        // });
        // // const userByEmail = await User.findOne({ where: { email } });

        // if (userNameOrEmailTaken)
        //   errors.userTaken = `${
        //     userNameOrEmailTaken.username === username ? "Username" : "Email"
        //   } is taken`;
        // console.log(userNameOrEmailTaken, errors.userTaken);

        if (password !== confirmPassword)
          errors.confirmPassword = "Passwords do not match";
        if (Object.keys(errors).length > 0) throw errors; // we will catch this in try catch block

        // DONE : Hash password

        password = await bcrypt.hash(password, 6);
        // TODO : Create User
        const user = await User.create({
          username,
          email,
          password,
        });
        // TODO: Return User
        return user;
      } catch (err) {
        if (err.name === "SequelizeUniqueConstraintError") {
          err.errors.forEach(
            (e) => (errors[e.path] = `${e.path} is already taken`)
          );
        } else if (err.name === "SequelizeValidationError") {
          err.errors.forEach((e) => (errors[e.path] = e.message));
        }
        throw new UserInputError("Bad Input", {
          errors,
        });
      }
    },
  },
};
