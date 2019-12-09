const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'local';

// Use connect method to connect to the server
MongoClient.connect(url, {
    useUnifiedTopology: true
}, async function (err, client) {
    const db = client.db(dbName);
    const users = db.collection('users');
    const articles = db.collection('articles');
    const students = db.collection('students');
    const showInConsole = arr => {
        arr.forEach(item => {
            console.log(item);
        });
    };
    //-----------1------------
    // 5 students with worst scores for homework:
    const worst5Score = await students.find({
            "scores.2.type": "homework"
        })
        .sort({
            "scores.2.score": 1
        })
        .limit(5)
        .toArray();
    showInConsole(worst5Score);

    // worst score got one student for homewrok:
    students.aggregate({
        $unwind: '$scores'
    }, {
        $match: {
            "scores.type": "homework"
        }
    }, {
        $group: {
            _id: null,
            minScore: {
                $min: "$scores.score"
            }
        }
    });

    // students with the worst score for homework (under 30 points)
    const worstScore = await students.find({
            'scores.2.type': 'homework',
            'scores.2.score': {
                $lt: 30
            }
        })
        .sort({
            'scores.2.score': -1
        })
        .toArray();
    showInConsole(worstScore);

    //-------------2---------------
    // 5 students who have the best score for quiz and the worst for homework, sort by ascending
    const bestQuiz = await students.find({
            $and: [{
                    "scores": {
                        $elemMatch: {
                            "score": {
                                $lte: 30
                            },
                            "type": "homework"
                        }
                    }
                },
                {
                    "scores": {
                        $elemMatch: {
                            "score": {
                                $gte: 80
                            },
                            "type": "quiz"
                        }
                    }
                }
            ]
        })
        .sort({
            'scores.1.score': 1
        })
        .limit(5)
        .toArray();
    showInConsole(bestQuiz);

    //-------------3---------------
    //The best 5 students who have best score for quiz and exam
    const bestQuizAndExam = await students.find({
            $and: [{
                    "scores": {
                        $elemMatch: {
                            "score": {
                                $gte: 80
                            },
                            "type": "exam"
                        }
                    }
                },
                {
                    "scores": {
                        $elemMatch: {
                            "score": {
                                $gte: 80
                            },
                            "type": "quiz"
                        }
                    }
                }
            ]
        })
        .sort({
            'scores.0.score': 1
        })
        .limit(5)
        .toArray();
    showInConsole(bestQuizAndExam);

    //-------------4---------------
    //Calculate the average score for homework for all students 
    //p.s. i dont know how to show it in console, but it works in studio 3T
    const avgScore = await db.collection('students').aggregate({
        $unwind: '$scores'
    }, {
        $match: {
            "scores.type": "homework"
        }
    }, {
        $group: {
            _id: "Avarage homework",
            avgAm: {
                $avg: "$scores.score"
            }
        }
    }).toArray();

    //------------5-----------------
    // Delete all students that have homework score <= 60
    students.deleteMany({
        'scores.2.type': 'homework',
        'scores.2.score': {
            $lte: 60
        }
    });

    //-------------6----------------
    //Mark students that have quiz score => 80
    students.updateMany({
        "scores.1.score": {
            $gte: 80
        }
    }, {
        $set: {
            "bestQuizScore": true
        }
    });

    console.log('works :)');

    client.close();
});