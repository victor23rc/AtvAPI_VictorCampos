require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express()
app.use(express.json())

/// Projeto - Victor Campos 

// DB

const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

  mongoose 
  .connect(
    'mongodb+srv://viiictor23rc:z28VmCatMG1LpnQD@cluster0.nz2woxk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
  )
  .then( () => {
  app.listen(30002)
  console.log('CONECTADO')
  })
  .catch((err) => console.log(err))

  /// API - Rotas

  app.get('/Teste', (req, res) => {
    res.send('Onlineeee')
  })

  /// criaçã de usuário 

  app.post('/auth/register', async(req, res) => { 

    const {name, email, password, confirmPassword}  = req.body

/// validações de resposta

    if(!name) { 
        return res.status(422).json({msg: "campo Nome obrigatório"})
    }

    if(!email) { 
        return res.status(422).json({msg: "campo E-mail obrigatório"})
    }

    if(!password) { 
        return res.status(422).json({msg: "campo Senha obrigatório"})
    }

    if (password !== confirmPassword ) {
        return res.status(422).json({msg: "Confirmação de senha não confere"})

    } 

    /// validações de usuários

    const userExists = await User.findOne({email: email})

    if (userExists){
        return res.status(422).json({msg: "E-mail já cadastrado!"})
    }

     /// criando senha

     const salt = await bcrypt.genSalt(12)
     const passwordash = await bcrypt.hash(password, salt)

     // criando usuário 

     const user = new User ({
         name,
         email,
         password: passwordash,

     })

     try {

        await user.save()

        return res.status(201).json({msg: "Usuário cadastrado com sucesso"})
        
     } catch (error) {
      console.log(error)

         res
         .status(500)
         .json({
            msg: 'Erro no server, tente novamente mais tarde!',
        })
        
     }

    })

         /// Autenticação 
     
         app.post('/auth/login', async(req, res) => { 


            const {email, password} = req.body
    
            if(!email) { 
                return res.status(422).json({msg: "campo E-mail obrigatório"})
            }
        
            if(!password) { 
                return res.status(422).json({msg: "campo Senha obrigatório"})
            }

        /// Verifica se usuário existe
             
        const user = await User.findOne({email: email})

         if (!user){
           return res.status(404).json({msg: "Usuário não encontrado"})
         }
        
       /// Validação Login x Senha

       const chekPassword = await bcrypt.compare(password, user.password)

       if (!chekPassword) { 
        return res.status(422).json({msg: "Senha invalida"})
       }

       try {
        const secret = process.env.SECRET

        const token = jwt.sign(
        {
            id: user._id,
        }, 
         secret,  
        )

         res.status(200).json({msg: 'Autenticação efetuada com suceso', token})
        
       } catch (err) {

        res
        .status(500)
        .json({
           msg: 'Erro no server, tente novamente mais tarde!',
       })
        
       }

         })



  /// retorno informações do usuário

  app.get('/user/:id', async (req, res) => {
    const id = req.params.id

    /// checando usuário 

    const user = await User.findById(id, '-password')

    if (!user){
     res.status(404).json({msg: "Usuário não encontrado"})
      }

      res.status(200).json({user})

  })

  /// Alterar Ususário utilizando o ID

  app.put("/alter/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const { name, email } = req.body;
 

      /// Atualiza as informações do usuário

        const updatedUser = await User.findByIdAndUpdate(userId, {
        name: name,
        email: email,
      }, { new: true }); 
  
      if (!updatedUser) {
        return res.status(404).json({ msg: "ERRO - Verifique as informações" });
      }

      res.status(200).json(updatedUser);

    } catch (error) {
        console.error("Erro ao alterar usuário:", error);
        res.status(500).json({ msg: "Erro no servidor, tente novamente mais tarde" });
      }
    });

    /// alteração de senha
  
    app.put("/alter/password/:id", async (req, res) => {
        const userId = req.params.id;
        const { currentPassword, newPassword } = req.body;


        if (!currentPassword ) {
            return res.status(422).json({msg: "campo senha atual obrigatório"})
        }
        if (!newPassword) {
            return res.status(422).json({msg: "campo nova senha obrigatório"})
        }

        try {
            /// Busca pelo usuário via ID 
            const user = await User.findById(userId);
        
            /// Verifica se o usuário foi encontrado
            if (!user) {
            
              return res.status(404).json({ msg: "Usuário não encontrado" });
            }

           // Compara as senhas
             const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

             if (!isPasswordValid) {
                return res.status(400).json({ msg: "Senha atual incorreta" });
              }

            // Gera um novo hash para a nova senha usando o bcrypt
              const salt = await bcrypt.genSalt(12);
              const newPasswordHash = await bcrypt.hash(newPassword, salt);

            // Atualiza a senha do usuário no banco
                 user.password = newPasswordHash;
                 await user.save();

            res.status(200).json({ msg: "Senha alterada com sucesso" }); 

        } catch (error) {
           
            console.error("Erro ao alterar senha:", error);
            res.status(500).json({ msg: "Erro no servidor, tente novamente mais tarde" });
          }
        });
        
        /// deletando usuário 

        app.delete("/delete/:id", async (req, res) => {

            const userId = req.params.id;
            const { infoPassword, password} = req.body;

            try {
                // Busca pelo usuário com o ID 
                const user = await User.findById(userId);

                // Verifica se o usuário foi encontrado
                 if (!user) {
                 return res.status(404).json({ msg: "Usuário não encontrado" });
                  }

                  // Verifica se a senha informada pelo usuário corresponde 
                 const isPasswordValid = await bcrypt.compare(infoPassword, user.password);
                  if (!isPasswordValid) {
                 return res.status(401).json({ msg: "Senha incorreta" });
                    }

                    await User.findByIdAndDelete(userId);
                    res.status(200).json({ msg: "Usuário deletado com sucesso" });

                } catch (error) {
                    console.error("Erro ao deletar usuário:", error);
                    res.status(500).json({ msg: "Erro no servidor, tente novamente mais tarde" });
                  }
                });

/// Lista de usuários para saber o ID sem consultar no banco 
  
         app.get('/Lista', async (req, res) => {
            const user  = await User.find();
            res.send(user);      
              })

/// Favoritos 

app.put('/user/favoritos/:id', async (req, res) => { 
    const userId = req.params.id;

    try {
      
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }
        // Atualiza o campo 'favorito' para true no usuário
        user.favorito = true;
        await user.save();
       
        const userWithFavorito = {
            
            _id: user._id,
            name: user.name,
            email: user.email,
            password: user.password,
            Favorito: true 
        };

        return res.status(200).json({msg:'Favorito adiconado com sucesso'});
  
    } catch (err) {
        return res.status(500).json({ msg: 'Erro ao atualizar usuário como favorito', error: err.message });
    }
});

/// Excluir favoritos

app.delete('/Favoritos/Delete/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        // Busca o usuário no banco
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'Usuário não encontrado' });
        }

        // Verifica se o usuário é favorito
        if (!user.favorito) {
            return res.status(400).json({ msg: 'Usuário não é favorito' });
        }

        // Remove o favorito do usuário
        user.favorito = false;
        await user.save();

        return res.status(200).json({ msg: 'Favorito REMOVIDO com sucesso!' });
      } catch (err) {
        return res.status(500).json({ msg: 'Erro ao deletar favorito do usuário', error: err.message });
    }
});

/// Listar todos os favoritos

app.get('/user/List/favoritos', async (req, res) => {
    try {
        // 
        const favoritos = await User.find({ favorito: true });

        return res.status(200).json(favoritos);
    } catch (err) {
        return res.status(500).json({ msg: 'Erro ao listar favoritos', error: err.message });
    }
});