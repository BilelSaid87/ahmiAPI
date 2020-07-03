const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const Interaction = require('../../models/Interaction');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../../middleware/auth');


const accountSid = 'ACd28e779ec69355788b2e855c8dadca95';
const authToken = '615807f67c535bed6e30ce086d33204e';
const client = require('twilio')(accountSid, authToken);
const axios = require('axios');
const infStateHistory = require('../../models/InfectionStateHistory');

router.get("/", (req, res) => {
    return res.status(200).send({ result: "users route" });
});

router.get('/userfromtoken', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-mac_address -token");

        res.json(user);
    } catch (error) {
        res.status(500).send("servor error");
    }
});




//authentication and gneration of token after login
router.post("/login", async (req, res) => {
    //log data
    console.log(req.body);

    //const errors =validationResult(req);
    //return error of validation
    /*
    if(!errors.isEmpty()){
    return  res.status(400).json({errors: errors.array()})
    }
    //if data is validated
    else{
        */
    //get data from request
    const { phone, mac_address } = req.body;
    try {
        //find user from email
        let user = await User.findOne({ phone });
        //if user is not found
        if (!user) {
            return res.status(400).json({ errors: [{ msg: "incorrect phone number" }] });
        }
        //if user is  found
        else {
            //compare the mac_address to the hashed mac_address
            const isMatch = await bcrypt.compare(mac_address, user.mac_address);

            //if mac_addresss  don t match
            if (!isMatch) {
                return res.status(400).json({ errors: [{ msg: "incorrect mac_address" }] });

            }

            //payload for the jwt
            const payload = {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName
                }
            }
            //jwt token
            jwt.sign(payload,
                config.get("jwtSecret"),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) {
                        throw err;
                    }
                    else {
                        res.status(200).json({ token });
                    }

                });


        }

    } catch (error) {
        console.log(error);
        return res.status(500).send(error.msg);

    }
    //}
});



//signup
router.post("/signup", async (req, res) => {
    const { phone, mac_address, bluetooth_id, password } = req.body;
    let existuser = await User.findOne({ phone: phone });
    console.log(phone);
    if (existuser) {
        return res.status(400).send({ result: "phone number exists" });
    } else {
        //  let user=new User({phone:phone,bluetooth_id:bluetooth_id,mac_address:mac_address});



        let salt = await bcrypt.genSalt(10);
        let mac = await bcrypt.hash(mac_address, salt);
        let salt1 = await bcrypt.genSalt(10);
        let pwd = await bcrypt.hash(password, salt);
        let user = new User({ phone: phone, bluetooth_id: bluetooth_id, mac_address: mac, password: pwd });
        try {
            user = await user.save();
            const payload = {
                user: {
                    id: user.id,

                }
            }
            jwt.sign(payload,
                config.get("jwtSecret"),
                { expiresIn: 360000 },
                async (err, token) => {
                    if (err) {
                        throw err;
                    }
                    else {
                        user.token = token;
                        await user.updateOne(user);
                        // let user1 =await User.findById(user.id).select("-_id -password");
                        res.status(200).json({ token: user.token });
                    }

                });


        } catch (error) {
            console.log(error);
            return res.status(500).send(error.msg);

        }


    }

});
/*
router.post("/verification_code",async (req,res)=>{

const{phone}=req.body;

        //   const accountSid = 'ACd28e779ec69355788b2e855c8dadca95';
        //   const authToken = 'your_auth_token';
        //   const client = require('twilio')(accountSid, authToken);
           let code=makeid(4);
     try {
        let  client1= await client.messages
        .create({
           body: 'votre code de confirmation est: \n'+code,
           from: '+14159414436',
           to: phone
         });
     //   .then((message ,status )=>{
       //    console.log("status",message.status ) ;
           // return res.status(200).send({code:code});});

     //result
          return res.status(200).send({code:code});

     //  return res.status(400).send();


     } catch (error) {
         console.log(error);
         return res.status(500).send();
        }
    // return res.status(500).send();
});

*/
function makeid(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}



router.post("/signin_mobile", async (req, res) => {
    const { phone, mac_address } = req.body;
    let user = await User.findOne({ phone });
    if (user) {
        const isMatch = await bcrypt.compare(mac_address, user.mac_address);
        if (isMatch) {

            //payload for the jwt
            const payload = {
                user: {
                    id: user.id,
                }
            }
            //jwt token
            jwt.sign(payload,
                config.get("jwtSecret"),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) {
                        throw err;
                    }
                    else {
                        res.status(200).json({ token, result: "1" });
                    }

                });


        } else {
            return res.status(200).send({ result: "2" });
        }
    } else {
        return res.status(400).send({ result: "0" });
    }
});


router.post("/signin_admin", async (req, res) => {
    const { phone, password } = req.body;
    let user = await User.findOne({ phone: phone });

    if (user && user.role === "ADMIN") {
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            //payload for the jwt
            const payload = {
                user: {
                    id: user.id,
                }
            }
            //jwt token
            jwt.sign(payload,
                config.get("jwtSecret"),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) {
                        throw err;
                    }
                    else {
                        res.status(200).json({ token });
                    }

                });
        }


    } else {
        console.log('NOT FOUND', req.body);
        return res.status(400).send();
    }
});









//post for registering
router.post("/register",
    [
        check("firstName", "firstname should not be empty").not().isEmpty(),
        check("lastName", "laststname should not be empty").not().isEmpty(),
        check("mac_address", "mac_address should contain 6 caracteres").isLength({ min: 6 }),
    ],
    async (req, res) => {

        console.log(req.body);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        } else {
            const { firstName,
                lastName,
                email,
                mac_address,
                gender,
                date_of_birth,
                registration_date,
                phone,
                address,
                health_stat_info,
                bluetooth_id,
                bluetooth_info } = req.body;
            try {
                let user = await User.findOne({ phone });

                if (user) {
                    return res.status(400).json({ errors: [{ msg: "phone number is already used" }] });
                }

                let salt = await bcrypt.genSalt(10);
                let pwd = await bcrypt.hash(mac_address, salt);
                user = new User({
                    firstName,
                    lastName,
                    email,
                    mac_address: pwd,
                    gender,
                    date_of_birth,
                    registration_date,
                    phone,
                    address,
                    health_stat_info,
                    bluetooth_id,
                    bluetooth_info
                });
                const payload = {
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                }
                jwt.sign(payload,
                    config.get("jwtSecret"),
                    { expiresIn: 360000 },
                    async (err, token) => {
                        if (err) {
                            throw err;
                        }
                        else {
                            user.token = token;
                            await user.save();
                            user = await User.findOne({ phone: phone }).select("-mac_address -token");
                            res.status(200).json(user);
                        }

                    });


            } catch (error) {
                console.log(error);
                return res.status(500).send(error.msg);

            }
        }
    });



router.get("/all", auth, async (req, res) => {

    try {
        users = await User.find({ role: "USER" }).select("-mac_address -token");
        return res.status(200).send(users);
    } catch (error) {
        return res.status(500).send();
    }

});

router.get("/all_with_direct_interraction_number", auth, async (req, res) => {

    try {
        all_users = await User.find({ role: "USER" }).select("phone infection _id registration_date health_stat_info date_of_birth gender");
        const process =async()=>{
          let now =new Date(Date.now());
          let before=new Date();
          before.setDate(now.getDate()-parseInt(config.get("p_minTrackingDays")));
          result_arr=[];
          for(user in all_users ){
            let number_of_interractions =await Interaction.count({metUserId:all_users[user].id, datetimestamp:{$lt:now,$gt:before}});
            let infected_with_interractions_number={"user_data":all_users[user],"number_of_interractions":number_of_interractions};
            result_arr.push(infected_with_interractions_number);
            }
        };

        process().then(()=>{
          return res.status(200).send(result_arr);
        });
    } catch (error) {
        return res.status(500).send();
    }

});

router.get("/allinfected", auth, async (req, res) => {

    try {
       let users = await User.find({ "infection.is_infected": true , role: "USER" }).select("phone infection _id registration_date health_stat_info date_of_birth gender");


       return res.status(200).send(users);
    } catch (error) {
        console.log(error);
        return res.status(500).send();
    }
});


router.get("/allinfected_with_direct_interraction_number", auth, async (req, res) => {
    let final_array=[];

    try {
       let infected_users = await User.find({ "infection.is_infected": true , role: "USER" }).select("phone infection _id registration_date health_stat_info date_of_birth gender");
      const process =async()=>{
        let now =new Date(Date.now());
        let before=new Date();
        before.setDate(now.getDate()-parseInt(config.get("p_minTrackingDays")));
        result_arr=[];
        for(user in infected_users ){
             let number_of_interractions =await Interaction.count({metUserId:infected_users[user].id, datetimestamp:{$lt:now,$gt:before}});
             let infected_with_interractions_number={"user_data":infected_users[user],"number_of_interractions":number_of_interractions}
             result_arr.push(infected_with_interractions_number);
            }

      };

      process().then(()=>{
        return res.status(200).send(result_arr);

      });

    } catch (error) {
        console.log(error);
        return res.status(500).send();
    }
});


router.get("/alluserswithgeneration", auth, (req, res) => {
    const process = async () => {
        try {
            users = await User.find({ role: "USER" }).select("phone infection _id registration_date health_stat_info date_of_birth gender");
            finaltree = [];
            for (user of users) {
                firstgeneration = [];
                interactions = await Interaction.find({ userId: user.id });
                const process2 = async () => {
                    if (interactions) {


                        for (interaction of interactions) {
                            secondgeneration = [];

                            user1 = await User.findById(interaction.metUserId).select("-mac_address -token");
                            interactions1 = await Interaction.find({ userId: user1.id });
                            console.log("interactions gen 2", interactions1);

                            const process1 = async () => {
                                if (interactions1) {
                                    for (interaction1 in interactions1) {
                                        console.log("interaction gen 2", interaction1);
                                        let user2 = await User.findById(interactions1[interaction1].metUserId).select("-mac_address -token");
                                        secondgeneration.push({ user: user2 });
                                        console.log("user level 2", user2);
                                    }
                                }
                            };
                            process1().then(() => {
                                firstgeneration.push({ user: user1, secondgeneration: secondgeneration });
                            });
                        }
                    }
                }; process2().then(() => {
                    finaltree.push({ user: user, firstgeneration: firstgeneration })
                });

            }
        } catch (error) {
            console.log(error)
        }
    }
    process().then(() => {
        return res.status(200).send(finaltree);

    });
});


//find user by phone number
router.post("/userbyphone", auth, async (req, res) => {
    const { phone } = req.body;
    try {
        user = await User.findOne({ phone: phone, role: "USER" }).select("-mac_address -token");
        if (user) {
            return res.status(200).send(user);

        } else {
            return res.status(400).send();

        }
    } catch (error) {
        return res.status(500).send();
    }
});



//update user state by phone number
router.post("/updatestate", auth, async (req, res) => {
    const { phone, state } = req.body;
    try {
        user = await User.findOne({ phone: phone }).select("-mac_address -token");
        if (user) {
            console.log(user);
            let now =new Date(Date.now());
            user = await User.updateOne({ _id: user.id },
                {$set: { "infection.is_infected": state}});
            let tmp_user = await User.findOne({ phone: phone }).select("-mac_address -token");
            user = await User.updateOne({ _id: tmp_user.id },
                {$set: { "infection.date": now}});
            // add row to infStateHistory
            let infState = new infStateHistory({userId: tmp_user.id, newState: state, datetimestamp: now});
            await infState.save();
            return res.status(200).send({"result":"user updated successfully"});
        } else {
            return res.status(400).send({"result":"user update failed"});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send();
    }
});


router.post("/updatestate_by_group", auth, async (req, res) => {
    const { phones, state } = req.body;

    const process = async () => {
        try {
            for (let phone of phones) {
                let user = await User.findOne({ phone: phone }).select("-mac_address -token");
                if (user) {
                    console.log(user);
                    let now =new Date(Date.now());
                    user = await User.updateOne({ _id: user.id },
                        {$set: { "infection.is_infected": state}});
                    let tmp_user = await User.findOne({ phone: phone }).select("-mac_address -token");
                    user = await User.updateOne({ _id: tmp_user.id },
                        {$set: { "infection.date": now}});
                    // add row to infStateHistory
                    let infState = new infStateHistory({userId: tmp_user.id, newState: state, datetimestamp: now});
                    await infState.save();
                } else {
                    return res.status(400).send({"result": "user " + user.id + " update failed"});
                }
            }
        } catch (error) {
            console.log(error);
            return res.status(500).send();
        }
    };
    process().then(() => {
        return res.status(200).send({"result":"all users updated successfully"});
    })

});



router.post("/userbyidwithgeneration", auth, async (req, res) => {

    const { userid } = req.body;
    let finaltree = [];

    try {
        let now =new Date(Date.now());
        let before=new Date();
        before.setDate(now.getDate()-parseInt(config.get("p_minTrackingDays")));
        current_user = await User.findById(userid).select("phone infection registration_date health_stat_info date_of_birth gender");
        let firstgeneration = [];
        let secondgeneration = [];
        first_interactions = await Interaction.find({ metUserId: current_user.id, datetimestamp:{$lt:now,$gt:before} });
        console.log("all relevant interactions of first generation: ", first_interactions);
        const process2 = async () => {
            if (first_interactions) {

                for (first_interaction of first_interactions) {
                    secondgeneration = [];
                    let user_first_gen = await User.findById(first_interaction.userId).select("phone infection health_stat_info");
                    let user_first_gen_int_severity = parseFloat(first_interaction.interactionSeverity);
                    let user_first_gen_inf_likelihood = parseFloat(first_interaction.infectionLikelihood);
                    let first_gen_interaction_timestamp = first_interaction.datetimestamp;
                    second_interactions = await Interaction.find({ metUserId: user_first_gen.id, datetimestamp:{$lt:now,$gt:first_gen_interaction_timestamp}});
                    console.log("all relevant interactions of second generation: ", second_interactions);

                    const process1 = async () => {
                        if (second_interactions) {
                            for (second_interaction in second_interactions) {
                                console.log("interaction second generation: ", second_interactions);
                                let user_second_gen = await User.findById(second_interactions[second_interaction].userId).select("phone infection health_stat_info");
                                let user_second_gen_int_severity = parseFloat(second_interactions[second_interaction].interactionSeverity);
                                let user_second_gen_inf_likelihood = parseFloat(second_interactions[second_interaction].infectionLikelihood);
                                user_second_gen_int_severity = user_second_gen_int_severity * user_first_gen_int_severity;
                                user_second_gen_inf_likelihood = user_second_gen_inf_likelihood * user_first_gen_inf_likelihood;
                                secondgeneration.push({ "user_data": user_second_gen,"interactionSeverity":user_second_gen_int_severity, "infectionLikelihood":user_second_gen_inf_likelihood });
                                console.log("second generation user: ", user_second_gen);
                            }
                        }
                    };
                    await process1().then(() => {
                        firstgeneration.push({ "user_data": user_first_gen,"interactionSeverity":user_first_gen_int_severity, "infectionLikelihood":user_first_gen_inf_likelihood, "secondgeneration": secondgeneration });
                    });
                }
            }
        }; process2().then(() => {
            return res.status(200).send({ "user_data": current_user, "firstgeneration": firstgeneration });
        });


    } catch (error) {
        console.log(error);
        return res.status(500).send(error);
    }

});

router.post("/update_profile_info", auth, async (req, res) => {
    try {
        let id = req.user.id;
        const { health_info, date_of_birth,gender } = req.body;
        let user = await User.findById(id);
        for(element in health_info){
            user.health_stat_info.push(health_info[element]);

        }
       // user.health_stat_info.push(health_info);
        user = await user.save(user);
        await User.updateOne({ _id: user.id },
            { $set: { "date_of_birth": date_of_birth } });
            await User.updateOne( { _id: user.id },
                { $set: { "gender" : gender } });
        return res.status(200).send();
    } catch (error) {
        console.log(error);
        return res.status(500).send();
    }
});

router.post("/update_mac_address", async (req, res) => {
    const { phone, mac_address } = req.body;

    try {
        let salt = await bcrypt.genSalt(10);
        let mac = await bcrypt.hash(mac_address, salt);

        await User.updateOne({ phone: phone },
            { $set: { "mac_address": mac, "bluetooth_id": mac_address } });
        return res.status(200).send();
    } catch (error) {
        return res.status(500).send();
    }
});

router.post("/verification_code", (req, res) => {


    let { phone } = req.body;
    let code = makeid(4);
    let msg = "votre code de verification pour l'application AHMI est:\n" + code;

    axios.post("https://www.tunisiesms.tn/client/Api/Api.aspx? fct=sms&key=cLUe6wRTL2oSy6sI6OK4BQ/-/MvtLPIF6BM5S3qilDvSjCGc6hUBCph7Kfzx/-/n79wrsLnJZZojYz3MhlgUboSHqHh0FlAG9NVe&sms=" +
        msg + "&sender=TunSMS Test&mobile=" + phone, {


    })
        .then((response1) => {
            console.log('status_code:', response1.status)
            if (response1.status == 200) {
                return res.status(200).send({ result: response1.statusText, code: code });

            } else {
                return res.status(response1.status).send({ result: response1.statusText, code: code });
            }
            //console.log(res)
        })
        .catch((error) => {
            console.error(error)
        })


});


module.exports = router;
