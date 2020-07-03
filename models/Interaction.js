const mongoose =require('mongoose');

const InteractionSchema =new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'user'

    },
    metUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    interactionSeverity:{
        type: String

    },
    infectionLikelihood:{
        type: String
    },
    duration:{
        type: String
    },
    datetimestamp:{
        type: Date
    }

});
module.exports= Interaction= mongoose.model('interaction',InteractionSchema);
