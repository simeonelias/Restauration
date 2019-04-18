    require('babel-register')
    const mysql = require('mysql')
    const bodyParser = require('body-parser')
    const express = require('express')
    const app = express()
    const session = require('express-session')
    var multer = require('multer');
    var ejs = require('ejs')
    var path = require('path');
    var fs = require('fs')
    // const morgan = require('morgan')
    
    
    // moteur de template
    app.set('view engine','ejs');
    
    // mes middlewares
    app.use(express.static('public'));
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json())
    app.use(session({
        secret: 'secret',
        resave: true,
        saveUninitialized:true
    }))
    
    // variables globales
    
    
    
    // base de données
    const db = mysql.createConnection({
        host: 'localhost',
        database: 'nodejs',
        user: 'root',
        password: ''
    })
    
    db.connect((err) => {
        
        if (err)
        console.log(err.message)
        else {
            
            // mes routes avec get
            app.get('/',(req,res)=>{
                db.query("SELECT * FROM members ORDER BY created DESC LIMIT 0, 3 ",(err,result)=>{
                    if(err){
                        console.log(err)
                    }
                        res.render('index',{records: result})
                    
                })
                
            })
            
            // app.get('/produit/:id',(req,res)=>{
            //     db.query("SELECT * FROM members WHERE id = ?",[req.params.id],(err,result)=>{
            //         if(err){
            //             console.log(err)
            //         }else{

            //             res.render('details',{result})
                        
            //             console.log(result)
                        
            //         }
            //     })
                
            // })
            
            
            
            app.get('/add', (req,res)=>{

                if(req.session.loggedin){
                    var success = "";
                    res.render('add',{success}) 
                }else{
                    res.redirect('/login')
                }
               res.end()
            })
            
            app.get('/produit', (req,res)=>{
                db.query("SELECT * FROM members",(err,result)=>{
                    if(err){
                        console.log(err)
                    }else{
                        res.render('produit',{records: result})
                    }
                }) 
            })
            // dashboard
            
            app.get('/dashboard', (req,res)=>{
                if(req.session.loggedin){
                    db.query("SELECT * FROM members",(err,result)=>{
                    if(err){
                    console.log(err)
                    }else{
                    res.render('dashboard',{records: result, msg: "la page d'administration"}) 
                    res.end()                  
               
                    }
                })

                }else{
                    res.redirect('/login')
                }
                      
                
            })
            
            // gestion des images et infos
            
            var storage = multer.diskStorage({
                destination: './public/uploads',
                filename: (req,file,cb)=>{
                    cb(null, file.fieldname+'-'+ Date.now() + path.extname(file.originalname));
                }
            });
            
            var upload = multer({
                storage: storage
            }).single('image');
            
            
            app.post('/file_upload', function (req, res) { 
                upload(req,res,(err)=>{
                    if(err){
                        console.log(err)
                        res.render('add',{
                            msg: err
                            
                        })
                    }else{
                        var image = req.file.filename
                        var description= req.body.description
                        var title = req.body.title
                        var categorie = req.body.categorie
                        console.log('titre: '+title +' mesage: '+ description +' img: '+image+ 'cat: '+categorie)
                        
                        if(title && description && image && categorie){
                            db.query("INSERT INTO members(title,description,created,categorie,image) VALUES(?,?,?,?,?)",[title,description,new Date(),categorie,image],(err,result)=>{
                                if(err){
                                    console.log('ERREUR:: '+err)
                                }else{
                                    res.send('<h5>enregistrement effectué avec succes</h5><br/><a href="/dashboard">Retour au dashboard</a>')
                                }
                            })
                        }else{
                            res.send({error: 'Veuillez remplir tous les champs svp!'})
                            
                        }
                    }
                })
                
            })
            
            // details d'un produit
            app.get('/details/:id',(req,res)=>{
                db.query("SELECT * FROM members WHERE id = ?",[req.params.id],(err,result)=>{
                    if(err){
                        return res.status(500).send(err)
                    }else{
                        
                        res.render('details', {records: result, msg: ''})
                        
                        
                        

                    }
                })
                
            })

            // Modification d'un produit

            app.get('/modifier/:id',(req,res)=>{

                if(req.session.loggedin){
                    db.query("SELECT * FROM members WHERE id = ?",[req.params.id],(err,result)=>{
                    if(err){
                        return res.status(500).send(err)
                    }else{
                        res.render('modifier', {records: result, msg: ''})
                        // console.log(result) 

                    }
                })

                }else{
                    res.redirect('/login')
                }
                
            })

            app.post('/file_upload', (req,res)=>{
                var title = req.body.title
                var image = req.file.image
                var description = req.body.description
                var categorie = req.body.categorie
                if(err) res.send(err)
                else{
                    db.query("UPDATE members SET title = ?, description = ?, categorie = ?, image = ? WHERE id = ?",[title,description,categorie,image,req.params.id], (err, result))
                    if(err){
                        res.send(err)
                    }else{
                        res.redirect('/dashboard')
                    }

                    
                }
            })

            // Suprimer un article

            app.get('/suprimer/:id',(req,res)=>{
          
                db.query("SELECT image FROM members WHERE id = ?",[req.params.id],(err, result)=>{
                    if(err) return res.status(500).send(err)

                    else{

                        let image = result[0].image
                        fs.unlink('public/uploads/'+image,(err)=>{
                            if(err){
                                return res.status(500).send(err)
                            }

                            db.query("DELETE FROM members WHERE id = ?",[req.params.id],(err,resultat)=>{
                                if(err){
                                    return res.status(500).send(err)
                                }
                                else{
                                    
                                   
                                   res.redirect('/dashboard') 
                                }
                                
                            })
                        })

                        
                   }
                })
            })

            // login d'un administrateur

            app.get('/login',(req,res)=>{
                res.render('login',{msg: "Bienvenue a la page d'authentification"})
            })

            app.post('/auth',(req,res)=>{
                var email = req.body.email
                var password = req.body.password

                if(email && password){
                    db.query("SELECT * FROM admins WHERE email= ? AND password = ?",[email,password],(err, result)=>{
                        if(err){
                            res.send(err)
                        }else{
                            if(result.length>0){
                                req.session.loggedin = true
                                req.session.email = email
                                
                                res.redirect('/dashboard')
                            }else{
                                res.send('les infos sont incorrect')
                            }
                        }

                    })
                }else{
                    res.send('Veuilez entrer tous les champs svp!')
                    res.end()
                }
            })

            // se deconnecter

            app.get('/logout',(req,res)=>{
                if(req.session){
                    req.session.destroy((err)=>{
                        if(err) res.send(err)

                        else res.redirect('/')
                    })
                }
            })

            app.listen(3000, () => console.log('Started on port '+3000))
            
            
            
        }
        
    })
    
    