const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { UserInputError } = require("apollo-server");

const { User } = require("../models");

module.exports = {
  Query: {
    getUsers: async () => {
      try {
        const users = await User.findAll();
        return users;
      } catch (err) {
        console.log(users);
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
