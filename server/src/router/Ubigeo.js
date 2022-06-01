const express = require('express');
const router = express.Router();
const Conexion = require('../database/Conexion');
const conec = new Conexion()

router.get('/', async function (req, res) {
    try {
        let result = await conec.query(`SELECT idUbigeo ,ubigeo, departamento, provincia, distrito 
        FROM ubigeo
        WHERE 
        ubigeo LIKE CONCAT(?,'%')
        OR
        departamento LIKE CONCAT(?,'%')
        OR
        provincia LIKE CONCAT(?,'%')
        OR
        distrito LIKE CONCAT(?,'%')`, [
            req.query.filtrar,
            req.query.filtrar,
            req.query.filtrar,
            req.query.filtrar,
        ]);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

module.exports = router;