const express = require('express');
const router = express.Router();
const { currentDate, currentTime } = require('../tools/Tools');
const { decrypt } = require('../tools/CryptoJS');

const Conexion = require('../database/Conexion');
const conec = new Conexion();

//Unidad de medida
router.get('/listmedida', async function (req, res) {
    try {
        let result = await conec.query(`SELECT
            idMedida, nombre, descripcion, codigo, estado  
            FROM medida
            WHERE
            ? = 0
            OR 
            ? = 1 AND nombre like concat(?,'%')`, [
            req.query.opcion,
            req.query.opcion,
            req.query.buscar
        ]);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.post('/addmedida', async function (req, res) {

    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let existe = await conec.execute(connection, 'SELECT nombre FROM medida');

        for (let item of existe) {
            if (item.nombre === req.body.nombre) {
                await conec.rollback(connection);
                res.status(400).send('Ya existe una medida con el mismo nombre');
                return;
            }
        }

        let result = await conec.execute(connection, 'SELECT idMedida FROM medida');
        let idMedida = "";

        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idMedida.replace("MD", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'MD000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'MD00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'MD0' + incremental;
            } else {
                codigoGenerado = 'MD' + incremental;
            }

            idMedida = codigoGenerado;
        } else {
            idMedida = "MD0001";
        }

        await conec.execute(connection, `INSERT INTO medida(
            idMedida, nombre, descripcion, codigo, estado) values (?,?,?,?,?)`, [
            idMedida,
            req.body.nombre,
            '',
            req.body.codigo,
            1
        ]);

        await conec.commit(connection);
        res.status(200).send('Datos insertados correctamente');
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
})

router.post('/updatemedida', async function (req, res) {

    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let existe = await conec.execute(connection, 'SELECT nombre FROM medida');

        for (let item of existe) {
            if (item.nombre === req.body.nombre) {
                await conec.rollback(connection);
                res.status(400).send('Ya existe una medida con el mismo nombre');
                return;
            }
        }

        await conec.execute(connection, `UPDATE medida SET 
            nombre=?, codigo=? WHERE idMedida=?`, [
            req.body.nombre,
            req.body.codigo,
            req.body.idMedida,
        ]);

        await conec.commit(connection);
        res.status(200).send('Datos insertados correctamente');
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
})

router.get('/listcombomedida', async function (req, res) {
    try {
        let result = await conec.query(`SELECT 
            idMedida,
            nombre,
            codigo
            FROM medida 
            WHERE 
            nombre LIKE CONCAT(?,'%')`, [
            req.query.filtrar
        ])
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

module.exports = router;