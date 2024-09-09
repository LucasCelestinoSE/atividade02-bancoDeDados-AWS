const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuração do banco de dados
const db = new sqlite3.Database(':memory:');

// Cria a tabela de usuários
db.serialize(() => {
  db.run(`CREATE TABLE usuario (
    cpf INTEGER PRIMARY KEY,
    nome TEXT NOT NULL,
    data_nascimento TEXT NOT NULL
  )`);
});

const app = express();
app.use(express.json());

// Configuração do Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Usuários',
      version: '1.0.0',
      description: 'API para gerenciar usuários',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./index.js'], // Caminho para os arquivos de rotas
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - cpf
 *         - nome
 *         - data_nascimento
 *       properties:
 *         cpf:
 *           type: integer
 *           description: O CPF do usuário
 *         nome:
 *           type: string
 *           description: O nome do usuário
 *         data_nascimento:
 *           type: string
 *           format: date
 *           description: A data de nascimento do usuário
 */

/**
 * @swagger
 * /usuario:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Usuário já existe
 *       500:
 *         description: Erro no servidor
 */
app.post('/usuario', (req, res) => {
  const { cpf, nome, data_nascimento } = req.body;

  db.get('SELECT * FROM usuario WHERE cpf = ?', [cpf], (err, row) => {
    if (row) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    db.run('INSERT INTO usuario (cpf, nome, data_nascimento) VALUES (?, ?, ?)', [cpf, nome, data_nascimento], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ cpf, nome, data_nascimento });
    });
  });
});

/**
 * @swagger
 * /usuario/{cpf}:
 *   get:
 *     summary: Obtém os dados de um usuário
 *     tags: [Usuario]
 *     parameters:
 *       - in: path
 *         name: cpf
 *         schema:
 *           type: integer
 *         required: true
 *         description: O CPF do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuário não encontrado
 */
app.get('/usuario/:cpf', (req, res) => {
  const { cpf } = req.params;

  db.get('SELECT * FROM usuario WHERE cpf = ?', [cpf], (err, row) => {
    if (!row) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(row);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});