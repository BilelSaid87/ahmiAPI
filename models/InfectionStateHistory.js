const mongoose =require('mongoose');

const InfectionStateHistorySchema =new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    newState:{
        type: Boolean
    },
    datetimestamp:{
        type: Date
    }
});
module.exports= InfectionStateHistory= mongoose.model('infectionStateHistory',InfectionStateHistorySchema);
