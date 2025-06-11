const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 20,
    },
    password: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
