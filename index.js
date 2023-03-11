require('dotenv').config();
var nodemailer = require('nodemailer');
const KVdb = require('kvdb.io')


async function main(params) {
    // Prepare remote key-value storage.
    // Generate a new Bucket using kvdb.io
    // Follow these docs to generate a new token
    // https://kvdb.io/docs/access-tokens
    const kvdbBucket = KVdb.bucket(process.env.KVDB_BUCKET_ID, process.env.KVDB_ACCESS_TOKEN);

    // Users list to send emails to.
    var users = [];

    // Get index from remote key-value database.
    try {
        var index = await kvdbBucket.get("USERS_INDEX");
    } catch (error) {
        await kvdbBucket.set('USERS_INDEX', 0);
        var index = await kvdbBucket.get("USERS_INDEX");
    }

    // Checking the type of index if not number, parse it to Int.
    if (typeof index != 'number') {
        index = parseInt(index);
    }

    // Validating `index` is ready.
    if (isNaN(index)) {
        index = 0;
    }

    // Validating there is no outbounded error
    if (index > users.length - 1) {
        throw new Error(`USERS_INDEX is out of range ${index} is greater than ${users.length - 1}`)
    }

    // Creating a Trsporter object
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Prepare the email options
    var mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: users,
        subject: 'Email Subject DEMO',
        text: 'Hello this is a test email send from aws lambda.'
    };

    // Trigger the email
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent');
            console.log(info.response);
            kvdbBucket.set('USERS_INDEX', index + 1);
        }
    });
}

try {
    main({});
} catch (error) {
    console.error(error);
}
