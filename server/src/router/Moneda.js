const express = require('express');
const router = express.Router();
const { currentDate, currentTime } = require('../tools/Tools');
const Conexion = require('../database/Conexion');
const conec = new Conexion()

router.get('/list', async function (req, res) {
    try {
        let lista = await conec.query(`SELECT idMoneda, nombre, codiso, simbolo, estado FROM moneda 
         WHERE 
         ? = 0
         OR
         ? = 1 and nombre like concat(?,'%')
         OR
         ? = 1 and codiso like concat(?,'%')
         LIMIT ?,?`, [
            parseInt(req.query.opcion),

            parseInt(req.query.opcion),
            req.query.buscar,

            parseInt(req.query.opcion),
            req.query.buscar,

            parseInt(req.query.posicionPagina),
            parseInt(req.query.filasPorPagina)
        ])

        let resultLista = lista.map(function (item, index) {
            return {
                ...item,
                id: (index + 1) + parseInt(req.query.posicionPagina)
            }
        });

        let total = await conec.query(`SELECT COUNT(*) AS Total 
        FROM moneda  
        WHERE 
        ? = 0
        OR
        ? = 1 and nombre like concat(?,'%')
        OR
        ? = 1 and codiso like concat(?,'%')`, [
            parseInt(req.query.opcion),

            parseInt(req.query.opcion),
            req.query.buscar,

            parseInt(req.query.opcion),
            req.query.buscar,
        ]);

        res.status(200).send({ "result": resultLista, "total": total[0].Total })

    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.")
    }
});

router.post('/add', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let result = await conec.execute(connection, 'SELECT idMoneda FROM moneda');
        let idMoneda = "";
        if (result.length != 0) {

            let quitarValor = result.map(function (item) {
                return parseInt(item.idMoneda.replace("MN", ''));
            });

            let valorActual = Math.max(...quitarValor);
            let incremental = valorActual + 1;
            let codigoGenerado = "";
            if (incremental <= 9) {
                codigoGenerado = 'MN000' + incremental;
            } else if (incremental >= 10 && incremental <= 99) {
                codigoGenerado = 'MN00' + incremental;
            } else if (incremental >= 100 && incremental <= 999) {
                codigoGenerado = 'MN0' + incremental;
            } else {
                codigoGenerado = 'MN' + incremental;
            }

            idMoneda = codigoGenerado;
        } else {
            idMoneda = "MN0001";
        }

        await conec.execute(connection, `INSERT INTO moneda(
            idMoneda,
            nombre, 
            codiso, 
            simbolo,
            estado,
            predeterminado,
            fecha, 
            hora, 
            idUsuario) 
            values (?,?,?,?,?,?,?,?,?)`, [
            idMoneda,
            req.body.nombre,
            req.body.codiso,
            req.body.simbolo,
            req.body.estado,
            0,
            currentDate(),
            currentTime(),
            req.body.idUsuario,
        ])

        await conec.commit(connection);
        res.status(200).send('Datos insertados correctamente')

    } catch (err) {
        if (connection != null) {
            conec.rollback(connection);
        }
        res.status(500).send(connection);
    }
});

router.post('/update', async function (req, res) {
    let connection = null;
    try {

        connection = await conec.beginTransaction();
        await conec.execute(connection, `UPDATE moneda SET 
        nombre=?, 
        codiso=?,
        simbolo=?, 
        estado=?,
        fecha=?,
        hora=?,
        idUsuario=? 
        where idMoneda=?`, [
            req.body.nombre,
            req.body.codiso,
            req.body.simbolo,
            req.body.estado,
            currentDate(),
            currentTime(),
            req.body.idUsuario,
            req.body.idMoneda,
        ])

        await conec.commit(connection);
        res.status(200).send('Se actualizó correctamente los datos.');
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.get('/id', async function (req, res) {
    try {
        let result = await conec.query('SELECT * FROM moneda WHERE idMoneda = ?', [
            req.query.idMoneda,
        ]);

        if (result.length > 0) {
            res.status(200).send(result[0]);
        } else {
            res.status(400).send("Datos no encontrados");
        }

    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.delete('/', async function (req, res) {
    let connection = null;
    try {
        connection = await conec.beginTransaction();

        let banco = await conec.execute(connection, `SELECT * FROM banco WHERE idMoneda = ?`, [
            req.query.idMoneda
        ]);

        if (banco.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar la moneda ya que esta ligada a un banco.')
            return;
        }

        let cobro = await conec.execute(connection, `SELECT * FROM  cobro WHERE idMoneda = ?`, [
            req.query.idMoneda
        ]);

        if (cobro.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar la moneda ya que esta ligada a un cobro.')
            return;
        }

        let gasto = await conec.execute(connection, `SELECT * FROM  gasto WHERE idMoneda = ?`, [
            req.query.idMoneda
        ]);

        if (gasto.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar la moneda ya que esta ligada a un gasto.')
            return;
        }

        let venta = await conec.execute(connection, `SELECT * FROM venta WHERE idMoneda = ?`, [
            req.query.idMoneda
        ]);

        if (venta.length > 0) {
            await conec.rollback(connection);
            res.status(400).send('No se puede eliminar la moneda ya que esta ligada a un venta.')
            return;
        }

        await conec.execute(connection, `DELETE FROM moneda WHERE idMoneda  = ?`, [
            req.query.idMoneda
        ]);

        await conec.commit(connection)
        res.status(200).send('Se eliminó correctamente la moneda.')
    } catch (error) {
        if (connection != null) {
            await conec.rollback(connection);
        }
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

router.get('/listcombo', async function (req, res) {
    try {
        let result = await conec.query('SELECT idMoneda,nombre, simbolo, codiso, predeterminado FROM moneda WHERE estado = 1');
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno de conexión, intente nuevamente.");
    }
});

module.exports = router;