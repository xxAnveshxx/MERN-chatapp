const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: false }, 
    file: { type: String, required: false } 
}, { timestamps: true });

const MessageModel = mongoose.model('Message', messageSchema);

module.exports = MessageModel;