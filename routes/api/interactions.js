const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');

const Interaction = require('../../models/Interaction');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../../middleware/auth');
var TeleSignSDK = require('telesignsdk');

const accountSid = 'ACd28e779ec69355788b2e855c8dadca95';
const authToken = '615807f67c535bed6e30ce086d33204e';
const client = require('twilio')(accountSid, authToken);

router.get("/", (req, res) => {
    return res.status(200).send({ result: "interactions route" });
});

router.post("/add", auth, async (req, res) => {
    console.log("begin process");
    let user = await User.findById(req.user.id);
    let userId = user.id;
    let observations = [];
    interactionsforproc = [];
    /*const{
    metUserId,
    datetimestamp,
    interactionSeverity,
    infectionLikelihood}=*/
    let i = 0;
    //push all obervations in observations
    // let list=[];
    const list = req.body;

    for (const element in list) {


        //console.log(list[element]);
        let interactions = [];
        i++;
        for (const element1 in list[element].interactions) {

            interactions.push({ interaction: list[element].interactions[element1], observationlevel: element });
            interactionsforproc.push({
                timestamp: list[element].interactions[element1].timestamp,
                distance: list[element].interactions[element1].distance,
                BT_id: list[element].interactions[element1].BT_id,
                observationlevel: element
            })


        };

        observations.push(interactions);
    };

    let finalInteractions = [];
    finalInteractions = parsedata(interactionsforproc);
    const process = async () => {
        for (element of finalInteractions) {
            try {
                let metuser = await User.findOne({ bluetooth_id: element.BT_id });
                if (metuser) {
                    let interaction = new Interaction({
                        userId: user.id,
                        metUserId: metuser.id,
                        datetimestamp: element.timestamp,
                        duration: element.duration,
                        interactionSeverity: calculateInteractionSeverity(element.distance, element.duration),
                        infectionLikelihood: calculateInfectionlikelihood(calculateInteractionSeverity(element.distance, element.duration), user)
                    });
                    await interaction.save(interaction);

                }
            } catch (error) {
                // return res.status(500).send();
                console.log(error);
            }
        };
    }
    process().then(() => {
        return res.status(200).send(finalInteractions);

    });
});


//gets interactions for process array and calculate each interaction time by calling calculate duration
//return an array
function parsedata(interactions) {
    let finalInteractions = [];
    let checkarray = [];
    for (const key in interactions) {
        let interactionsbyindex = [];
        if (checkarray.findIndex(element => element == interactions[key].BT_id) == -1) {
            checkarray.push(interactions[key].BT_id);

            for (const key1 in interactions) {


                if (interactions[key1].BT_id === interactions[key].BT_id) {
                    interactionsbyindex.push(interactions[key1]);
                }
            }
        }
        console.log("calling split intractions for", interactionsbyindex);
        let localarray = splitinteractions(interactionsbyindex);
        for (const key2 in localarray) {
            finalInteractions.push(localarray[key2]);
        }

    }
    return finalInteractions;
}



function splitinteractions(interactions) {
    let splitarray = [];
    let newarray = [];
    console.log("begin split interraction...", "input", interactions);
    for (const key in interactions) {

        if (parseInt(key) < (interactions.length - 1) && interactions.length > 1) {
            if (parseInt(interactions[key].observationlevel) == parseInt(interactions[parseInt(key) + 1].observationlevel) - 1) {
                newarray.push(interactions[key]);
            }
            else {
                newarray.push(interactions[key]);
                splitarray.push(calculateduration(newarray));
                newarray = [];
            }
        } else {
            if (interactions.length > 1) {
                if (parseInt(interactions[key].observationlevel) == parseInt(interactions[key - 1].observationlevel) + 1) {
                    newarray.push(interactions[key]);
                    splitarray.push(calculateduration(newarray));
                }
                else {

                    splitarray.push(calculateduration([interactions[key]]));
                    newarray = [];
                }

            } else {
                splitarray.push(calculateduration([interactions[key]]));

            }

        }

    }
    console.log("output of split interaction: ", splitarray);
    return splitarray;
}

function calculateduration(interactions) {
    let key = 0;
    console.log("calcul input : ", interactions);

    for (key in interactions) {
        console.log("calcul", interactions[key]);

    } let duration = interactions[interactions.length - 1].timestamp - interactions[0].timestamp;

    const interaction = {
        timestamp: interactions[0].timestamp,
        distance: interactions[0].distance,
        BT_id: interactions[0].BT_id,
        duration: duration
    }
    console.log("calcul output:", interaction);
    return interaction;
}

function calculateInfectionlikelihood(interactionSeverity, user) {
    //a faire
    let healthStateCoeff = CalculateHealthStateCoeff(user);

    if (user.hasOwnProperty("date_of_birth")) {
        let year = (user.date_of_birth + "").substring(0, 4);
        let age = Date.now().toString().substring(0, 4) - year;
        let AgeRiskCoef = calculateAgeRiskCoef(age);
            console.log("users age: ",age);
        return AgeRiskCoef * healthStateCoeff * interactionSeverity;
    } else {
        return healthStateCoeff * interactionSeverity;
    }
}

function CalculateHealthStateCoeff(user) {
 console.log("start calculating health state coeff daata: ",[user.health_stat_info]);
coef=0.0;
if(!(user.health_stat_info.length && user.health_stat_info)){
    console.log("no data for gealth_state");
    coef = parseFloat(config.get("p_none_disease_coeff"));
}else{
    console.log("data found for health state");
    console.log("test: ",config.get("p_asmathic_disease_key"));
    if (user.health_stat_info.includes(config.get("p_none_disease_key"))) {
        coef = parseFloat(config.get("p_none_disease_coeff"));

    }else{
        if (user.health_stat_info.includes(config.get("p_heart_disease_key"))) {
            coef =coef+ parseFloat(config.get("p_heart_disease_coeff"));
        }
        if (user.health_stat_info.includes(config.get("p_other_disease_key"))) {
            coef =coef+ parseFloat(config.get("p_other_disease_coeff"));
        }
        if (user.health_stat_info.includes(config.get("p_asmathic_disease_key"))) {
            coef =coef+ parseFloat(config.get("p_asmathic_disease_coeff"));
            console.log(config.get("p_asmathic_disease_coeff"));
        }

    }

}

if(coef>=1){
        coef=1;
    }

    console.log("Output of health coeff: ",coef);
    return coef;
}

function calculateAgeRiskCoef(age) {
    console.log("start age coeff");
    if (age < parseFloat("p_age_less_level_1"))
    {
        return parseFloat("p_age_less_level_1_coeff");
    } else {
        if (age < parseFloat("p_age_less_level_2")) {
            return parseFloat("p_age_less_level_2_coeff");

        } else {
            if (age < parseFloat("p_age_less_level_3")) {
                return parseFloat("p_age_less_level_3_coeff");

            } else {
                if (age < parseFloat("p_age_less_level_4")) {
                    return parseFloat("p_age_less_level_4_coeff");

                } else {
                    return 1;
                }
            }

        }
    }
}

function calculateInteractionSeverity(distance, time) {
    let PTime = 0.0;
    let PDist = 0.0;
    //extract PTime
    if (parseFloat(time) > parseFloat(config.get('p_interractionMaxTime'))) {
        PTime = 1;
    } else {
        if (parseFloat(time) > parseFloat(config.get('p_interractionMinTime'))) {
            PTime = (
                ((parseFloat(time) - parseFloat(config.get('p_interractionMinTime'))) * (parseFloat(time) - parseFloat(config.get('p_interractionMinTime'))))
                / ((parseFloat(config.get('p_interractionMaxTime')) - parseFloat(config.get('p_interractionMinTime'))) * (parseFloat(config.get('p_interractionMaxTime')) - parseFloat(config.get('p_interractionMinTime')))

                ));

        } else {
            PTime = 0;
        }
    }
    //extract PDist
    if (parseFloat(distance) > parseFloat(config.get("p_interractionMaxDist"))) {
        PDist = 0;
    } else {
        if (parseFloat(distance) > parseFloat(config.get("p_interractionMinDist"))) {
            PDist = 1.0 - (
                ((parseFloat(distance) - parseFloat(config.get('p_interractionMinDist'))) * (parseFloat(distance) - parseFloat(config.get('p_interractionMinDist'))))
                / ((parseFloat(config.get('p_interractionMaxDist')) - parseFloat(config.get('p_interractionMinDist'))) * (parseFloat(config.get('p_interractionMaxDist')) - parseFloat(config.get('p_interractionMinDist')))

                ));


        } else {
            PDist = 1;
        }
    }
    console.log("distance",distance,"time:",time,"Pdistance: ",PDist,"Ptime",PTime);
    console.log("output interaction severity:",PTime * PDist)
    return PTime * PDist;

}




router.post("/store_data", auth, async (req, res) => {

    const list = req.body;
    let user = await User.findById(req.user.id);

console.log("start parsing")
    const process = async () => {
        for (const element in list) {
            try {
                let metuser = await User.findOne({ bluetooth_id: list[element].BleMac });
                if (metuser) {
                    /**
                     userId: ,
                    metUserId:,
                    datetimestamp:,
                    interactionSeverity:,
                    infectionLikelihood:,
                    duration:

                    **/
                   let date = new Date(parseFloat(list[element].startTime));
                   let interactionserverity=calculateInteractionSeverity(list[element].avgDist, list[element].interractionTime)
                    interaction = new Interaction({
                        userId: user.id,
                        metUserId: metuser.id,
                        datetimestamp: date,
                        interactionSeverity: interactionserverity,
                        infectionLikelihood: calculateInfectionlikelihood(interactionserverity, user),
                        duration: list[element].interractionTime
                    });
                    interaction.save();
                } else { return res.status(400).send(); }
            } catch (error) {
                console.log(error);
                return res.status(500).send();
            }
        }
    };
    process().then(() => {
        return res.status(200).send();
    });
});

module.exports = router;
