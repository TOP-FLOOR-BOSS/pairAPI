require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./config/dbconn');
const {compare, hash} = require('bcrypt');
// Express app
const app = express();
// Express router
const router = express.Router();
// Configuration
const port = parseInt(process.env.PORT) || 4000;
app.use(router, cors(), express.json(),
    express.urlencoded({
    extended: true})
);
//
app.listen(port, ()=> {
    console.log(`Server is running on port ${port}`);
});
// home
router.get('/', (req, res)=> {
    res.status(200).sendFile(path.join(__dirname, 'views', 'index.html'));
});
router.get('/register', (req, res)=> {
    res.status(200).sendFile(path.join(__dirname, 'views', 'register.html'));
});
// User registration
app.post('/register',bodyParser.json(),
    async (req, res)=> {
        const {firstname, lastname, gender, address, userRole, 
        email, userpassword} = req.body;
        if(userRole.length === 0) {
            userRole = 'user';
        }
        // Encrypting a password
        // Default value of salt is 10.
        userpassword = await hash(userpassword, 10);
        // Query
        const strQry =
        `
        INSERT INTO users(firstname, lastname, gender, address, userRole, email, userpassword)
        VALUES(?, ?, ?, ?, ?, ?, ?);
        `;
        db.query(strQry,
            [firstname, lastname, gender, address, userRole, email, userpassword],
            (err, results)=> {
                if(err) throw err;
                res.send(`number of affected row/s: ${results.affectedRows}`);
            })
        res.status(302).redirect('/'); 

});
// Login
router.post('/login', bodyParser.json(),
    (req, res)=> {
    try{
        // Get email and password
        const { email, userpassword } = req.body;
        const strQry =
        `
        SELECT firstname, gender, email, userpassword
        FROM users
        WHERE email = '${email}';
        `;
        db.query(strQry, async (err, results)=> {
            if(err) throw err;
            res.json({
                status: 200,
                results: (await compare(userpassword,
                    results[0].userpassword)) ? results :
                    'You provided a wrong email or password'
            })
        })
    }catch(e) {
        console.log(`From login: ${e.message}`);
    }
})
// Create new products
router.post('/products', bodyParser.json(),
    (req, res)=> {
    try{
        const bd = req.body;
        bd.totalamount = bd.quantity * bd.price;
        // Query
        const strQry =
        `
        INSERT INTO products(prodName, prodUrl, quantity, price, totalamount, dateCreated)
        VALUES(?, ?, ?, ?, ?, ?);
        `;
        //
        db.query(strQry,
            [bd.prodName, bd.prodUrl, bd.quantity, bd.price, bd.totalamount, bd.dateCreated],
            (err, results)=> {
                if(err) throw err
                res.send(`number of affected row/s: ${results.affectedRows}`);
            })
    }catch(e) {
        console.log(`Create a new product: ${e.message}`);
    }
});
// Get all products
router.get('/products', (req, res)=> {
    // Query
    const strQry =
    `
    SELECT id, prodName,prodUrl, quantity, price, totalamount, dateCreated, userid
    FROM products;
    `;
    db.query(strQry, (err, results)=> {
        if(err) throw err;
        res.json({
            status: 200,
            results: results
        })
        console.log(err)
    })
});
// Get one product
router.get('/products/:id', (req, res)=> {
    // Query
    const strQry =
    `
    SELECT id, prodName, prodUrl, quantity, price, totalamount, dateCreated, userid
    FROM products
    WHERE id = ?;
    `;
    db.query(strQry, [req.params.id], (err, results)=> {
        if(err) throw err;
        res.json({
            status: 200,
            results: (results.length <= 0) ? "Sorry, no product was found." : results
        })
    })
});
// Update product
router.put('/products', (req, res)=> {
    const bd = req.body;
    // Query
    const strQry =
    `UPDATE products
     SET ?
     WHERE id = ?`;
    db.query(strQry,[bd.id], (err, data)=> {
        if(err) throw err;
        res.send(`number of affected record/s: ${data.affectedRows}`);
    })
});
// Delete product
router.delete('/clinic/:id', (req, res)=> {
    // Query
    const strQry =
    `
    DELETE FROM products
    WHERE id = ?;
    `;
    db.query(strQry,[req.params.id], (err, data, fields)=> {
        if(err) throw err;
        res.send(`${data.affectedRows} row was affected`);
    })
});
console.log(bodyParser.json());