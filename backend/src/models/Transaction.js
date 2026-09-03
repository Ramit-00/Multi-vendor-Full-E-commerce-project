const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.Mixed,  
        required: true
    },
    order: {
        type: mongoose.Schema.Types.Mixed,  
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.Mixed, 
        required: true
    },
    date: {
        type: Date,
        default: Date.now 
    }
}, {
    timestamps: true  
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
