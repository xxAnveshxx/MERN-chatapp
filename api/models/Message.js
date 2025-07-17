const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
    sender : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    recipient : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    text: {type: String, required: true}
}, {timestamps: true});

const MessageModel = mongoose.model('Message', messageSchema);

module.exports = MessageModel;